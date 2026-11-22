import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { normalizePhone, isValidPhone } from '@/lib/phone';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newOwnerName, newOwnerPhone } = body;

    // ЗАЩИТА ОТ ПУСТЫХ ДАННЫХ
    if (!newOwnerName || !newOwnerPhone) {
      return NextResponse.json({ ok: false, error: { message: 'Заполните ФИО и телефон нового собственника' } }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(newOwnerPhone);
    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json({ ok: false, error: { message: 'Неверный формат телефона' } }, { status: 400 });
    }

    // 1. Проверка долга гаража
    const balance = await prisma.garageBalance.findUnique({ where: { garageId: id } });
    if (balance && Number(balance.debtAmount) > 0) {
      return NextResponse.json({ 
        ok: false, 
        error: { message: `Невозможно сменить собственника. За гаражом числится долг ${Number(balance.debtAmount).toLocaleString('ru-RU')} ₽.` } 
      }, { status: 400 });
    }

    // 2. Создаем или ищем пользователя
    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          fullName: newOwnerName,
          role: 'owner',
          status: 'active',
          phones: { create: { phone: normalizedPhone, status: 'confirmed', confirmedAt: new Date() } }
        }
      });
    } else {
      // Если пользователь существует, обновляем ФИО
      await prisma.user.update({ where: { id: user.id }, data: { fullName: newOwnerName } });
    }

    // 3. Создаем или ищем профиль собственника
    let owner = await prisma.owner.findUnique({ where: { userId: user.id } });
    if (!owner) {
      owner = await prisma.owner.create({ data: { userId: user.id, fullName: newOwnerName, status: 'active' } });
    } else {
      await prisma.owner.update({ where: { id: owner.id }, data: { fullName: newOwnerName } });
    }

    // 4. Закрываем старую связь (архивируем)
    await prisma.ownerGarage.updateMany({
      where: { garageId: id, endedAt: null },
      data: { endedAt: new Date() }
    });

    // 5. Создаем новую связь
    await prisma.ownerGarage.create({
      data: { ownerId: owner.id, garageId: id, ownershipType: 'owner', share: 1.0 }
    });

    return NextResponse.json({ ok: true, data: { message: 'Собственник успешно изменен' } });
  } catch (error) {
    console.error('Change owner error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}