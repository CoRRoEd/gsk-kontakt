import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id: oldMeterId } = await params;
    const data = await request.json();

    // 1. Проверяем старый счетчик
    const oldMeter = await prisma.meter.findUnique({ where: { id: oldMeterId } });
    if (!oldMeter) return NextResponse.json({ ok: false, error: { message: 'Счётчик не найден' } }, { status: 404 });

    // 2. Проверяем уникальность нового серийного номера
    const existingNewMeter = await prisma.meter.findUnique({ where: { serialNumber: data.newSerialNumber } });
    if (existingNewMeter) return NextResponse.json({ ok: false, error: { message: 'Счётчик с таким серийным номером уже существует' } }, { status: 400 });

    // 3. Выполняем транзакцию
    await prisma.$transaction(async (tx) => {
      // a) Архивируем старый
      await tx.meter.update({
        where: { id: oldMeterId },
        data: { status: 'replaced', removedAt: new Date(data.replacedAt) }
      });

      // b) Создаем новый
      const newMeter = await tx.meter.create({
        data: {
          garageId: oldMeter.garageId,
          serialNumber: data.newSerialNumber,
          meteringType: oldMeter.meteringType,
          initialReadingT1: data.newInitialT1,
          initialReadingT2: data.newInitialT2,
          initialReadingDate: new Date(data.replacedAt),
          status: 'active',
        }
      });

      // c) Записываем историю замены
      await tx.meterReplacement.create({
        data: {
          oldMeterId: oldMeter.id,
          newMeterId: newMeter.id,
          replacedAt: new Date(data.replacedAt),
          oldFinalReadingT1: data.oldFinalT1,
          oldFinalReadingT2: data.oldFinalT2,
          reason: data.reason,
          performedById: session.userId,
        }
      });
    });

    return NextResponse.json({ ok: true, data: { message: 'Счётчик успешно заменён' } });
  } catch (error) {
    console.error('Replace meter error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при замене' } }, { status: 500 });
  }
}