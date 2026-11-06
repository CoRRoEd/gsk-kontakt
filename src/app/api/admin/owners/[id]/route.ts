import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { normalizePhone, isValidPhone } from '@/lib/phone';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Проверка прав
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, phone } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ ok: false, error: { message: 'Заполните все поля' } }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json({ ok: false, error: { message: 'Неверный формат телефона' } }, { status: 400 });
    }

    // 2. Находим собственника
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: { user: { include: { phones: true } } }
    });

    // ИСПРАВЛЕНИЕ: добавили проверку !owner.user
    if (!owner || !owner.userId || !owner.user) {
      return NextResponse.json({ ok: false, error: { message: 'Собственник не найден' } }, { status: 404 });
    }

    // 3. Обновляем ФИО в обеих таблицах
    await prisma.user.update({
      where: { id: owner.userId },
      data: { fullName }
    });

    await prisma.owner.update({
      where: { id: owner.id },
      data: { fullName }
    });

    // 4. Обновляем телефон
    const primaryPhone = owner.user.phones[0];
    
    if (primaryPhone && primaryPhone.phone !== normalizedPhone) {
      // Проверяем, не занят ли номер кем-то другим
      const existingPhone = await prisma.userPhone.findUnique({ where: { phone: normalizedPhone } });
      if (existingPhone && existingPhone.userId !== owner.userId) {
        return NextResponse.json({ ok: false, error: { message: 'Этот номер уже привязан к другому пользователю' } }, { status: 400 });
      }

      await prisma.userPhone.update({
        where: { id: primaryPhone.id },
        data: { phone: normalizedPhone }
      });
      
      await prisma.user.update({
        where: { id: owner.userId },
        data: { phone: normalizedPhone }
      });
    }

    return NextResponse.json({ ok: true, data: { message: 'Данные сохранены' } });
  } catch (error) {
    console.error('Update owner error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}