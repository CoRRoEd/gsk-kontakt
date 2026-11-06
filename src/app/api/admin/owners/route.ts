import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { normalizePhone, isValidPhone } from '@/lib/phone';

export async function POST(request: NextRequest) {
  try {
    // 1. Проверяем, что запрос делает персонал
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    // 2. Получаем данные из формы
    const body = await request.json();
    const { fullName, phone } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ ok: false, error: { message: 'Заполните ФИО и телефон' } }, { status: 400 });
    }

    // 3. Проверяем телефон
    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json({ ok: false, error: { message: 'Неверный формат телефона' } }, { status: 400 });
    }

    // 4. Проверяем, нет ли уже такого пользователя
    const existingUser = await prisma.user.findUnique({ 
      where: { phone: normalizedPhone } 
    });
    
    if (existingUser) {
      return NextResponse.json({ ok: false, error: { message: 'Пользователь с таким телефоном уже существует' } }, { status: 400 });
    }

    // 5. Создаем всё в транзакции (User + Phone + Owner)
    const newOwner = await prisma.$transaction(async (tx) => {
      // Создаем пользователя
      const user = await tx.user.create({
        data: {
          phone: normalizedPhone,
          fullName,
          role: 'owner',
          status: 'active',
          phones: {
            create: { 
              phone: normalizedPhone, 
              status: 'confirmed', 
              confirmedAt: new Date() 
            }
          }
        }
      });

      // Создаем профиль собственника
      return tx.owner.create({
        data: {
          userId: user.id,
          fullName,
          status: 'active'
        }
      });
    });

    return NextResponse.json({ ok: true, data: { message: 'Собственник успешно создан', owner: newOwner } });
  } catch (error) {
    console.error('Create owner error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при создании' } }, { status: 500 });
  }
}