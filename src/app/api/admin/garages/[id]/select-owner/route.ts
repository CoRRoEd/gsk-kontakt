import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });

    const { id } = await params;
    const { ownerId } = await request.json(); // Получаем ID существующего собственника

    // 1. ПРОВЕРКА ДОЛГА ГАРАЖА
    const balance = await prisma.garageBalance.findUnique({ where: { garageId: id } });
    if (balance && Number(balance.debtAmount) > 0) {
      return NextResponse.json({ 
        ok: false, 
        error: { message: `Невозможно сменить собственника. За гаражом числится долг ${Number(balance.debtAmount).toLocaleString('ru-RU')} ₽.` } 
      }, { status: 400 });
    }

    // 2. Закрываем старую связь
    await prisma.ownerGarage.updateMany({
      where: { garageId: id, endedAt: null },
      data: { endedAt: new Date() }
    });

    // 3. Создаем новую связь
    await prisma.ownerGarage.create({
      data: { ownerId, garageId: id, ownershipType: 'owner', share: 1.0 }
    });

    return NextResponse.json({ ok: true, data: { message: 'Собственник изменен' } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}