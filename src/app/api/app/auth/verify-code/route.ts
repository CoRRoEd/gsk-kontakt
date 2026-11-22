import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';
import { verifyCodeSchema } from '@/lib/validation/auth';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Валидация
    const result = verifyCodeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Неверные данные' } },
        { status: 400 }
      );
    }

    const phone = normalizePhone(result.data.phone);
    const { code } = result.data;

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Неверный формат телефона' } },
        { status: 400 }
      );
    }

    // 2. Проверяем код в базе данных
    const authCode = await prisma.authCode.findUnique({
      where: { phone }
    });

    if (!authCode) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_CODE', message: 'Код не найден. Запросите новый.' } },
        { status: 400 }
      );
    }

    if (new Date() > authCode.expiresAt) {
      await prisma.authCode.delete({ where: { phone } });
      return NextResponse.json(
        { ok: false, error: { code: 'CODE_EXPIRED', message: 'Код истёк. Запросите новый.' } },
        { status: 400 }
      );
    }

    if (authCode.attempts >= 3) {
      await prisma.authCode.delete({ where: { phone } });
      return NextResponse.json(
        { ok: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Слишком много попыток. Запросите новый код.' } },
        { status: 429 }
      );
    }

    if (authCode.code !== code) {
      await prisma.authCode.update({
        where: { phone },
        data: { attempts: { increment: 1 } }
      });
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_CODE', message: 'Неверный код' } },
        { status: 400 }
      );
    }

    // Код верный — удаляем его из базы
    await prisma.authCode.delete({ where: { phone } });

    // 3. Находим пользователя и его профиль собственника
    const userPhone = await prisma.userPhone.findUnique({
      where: { phone },
      include: { user: { include: { owner: true } } },
    });

    if (!userPhone || !userPhone.user) {
      return NextResponse.json(
        { ok: false, error: { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' } },
        { status: 404 }
      );
    }

    if (userPhone.user.status !== 'active') {
      return NextResponse.json(
        { ok: false, error: { code: 'USER_BLOCKED', message: 'Доступ заблокирован' } },
        { status: 403 }
      );
    }

    // 4. Проверка для сотрудников (персонала)
    if (userPhone.user.role !== 'owner') {
      // Если это сотрудник без гаража — запрещаем вход в кабинет собственника
      if (!userPhone.user.owner) {
        return NextResponse.json(
          { ok: false, error: { code: 'WRONG_PORTAL', message: 'Вход в кабинет собственника запрещен. Используйте админ-панель.' } },
          { status: 403 }
        );
      }
      // Если у сотрудника есть гараж — пускаем, но сессия будет строго с ролью 'owner' (см. ниже)
    }

    // 5. Подтверждаем телефон, если он еще не подтвержден
    if (userPhone.status === 'pending_confirmation') {
      await prisma.userPhone.update({
        where: { id: userPhone.id },
        data: { status: 'confirmed', confirmedAt: new Date() },
      });
    }

    // 6. Создаем сессию
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = userPhone.user.id;
    session.role = 'owner'; // <-- ВСЕГДА ставим роль 'owner' для этого портала, даже если вошел Председатель
    session.phone = phone;
    await session.save();

    // 7. Обновляем дату последнего входа
    await prisma.user.update({
      where: { id: userPhone.user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: userPhone.user.id,
          fullName: userPhone.user.fullName,
          role: 'owner', // В ответе тоже указываем owner
        },
        redirect: '/app',
      },
    });

  } catch (error) {
    console.error('verify-code error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } },
      { status: 500 }
    );
  }
}