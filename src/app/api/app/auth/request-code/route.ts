import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';
import { requestCodeSchema } from '@/lib/validation/auth';
import { sendVerificationCode } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Валидация
    const result = requestCodeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Неверные данные' } },
        { status: 400 }
      );
    }

    const phone = normalizePhone(result.data.phone);
    const isOwnerConfirm = result.data.isOwnerConfirm || false;

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Неверный формат телефона' } },
        { status: 400 }
      );
    }

    // 2. Ищем пользователя и его профиль собственника
    const userPhone = await prisma.userPhone.findUnique({
      where: { phone },
      include: { user: { include: { owner: true } } }
    });

    if (!userPhone) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Этот номер не зарегистрирован в системе ГСК.' } },
        { status: 404 }
      );
    }

    const isStaff = userPhone.user.role !== 'owner';
    const hasOwnerProfile = !!userPhone.user.owner;

    // 3. Проверка для сотрудников
    if (isStaff) {
      // Если это сотрудник без гаража — отправляем в админку
      if (!hasOwnerProfile) {
        return NextResponse.json({
          ok: false,
          error: { 
            code: 'WRONG_PORTAL', 
            message: 'Этот номер принадлежит сотруднику ГСК. Используйте форму входа для персонала.' 
          }
        }, { status: 403 });
      }
      
      // Если сотрудник имеет гараж, но еще не подтвердил вход как собственник
      if (hasOwnerProfile && !isOwnerConfirm) {
        return NextResponse.json({
          ok: false,
          error: { 
            code: 'STAFF_IS_OWNER', 
            message: 'Этот номер принадлежит сотруднику ГСК. Но вы также являетесь собственником.' 
          }
        }, { status: 403 });
      }
    }

    // 4. Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    await prisma.authCode.upsert({
      where: { phone },
      update: { code, expiresAt, attempts: 0 },
      create: { phone, code, expiresAt, attempts: 0 }
    });

    // 5. Отправляем SMS
    await sendVerificationCode(phone, code);

    return NextResponse.json({
      ok: true,
      data: { message: 'Код отправлен' },
    });

  } catch (error) {
    console.error('request-code error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } },
      { status: 500 }
    );
  }
}