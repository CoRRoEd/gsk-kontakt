import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const data = await request.json();
    const {
      garageId, oldMeterId,
      newSerialNumber, newMeteringType,
      newInitialT1, newInitialT2,
      oldFinalT1, oldFinalT2,
      replacedAt, reason
    } = data;

    // 1. Архивируем старый счетчик
    await prisma.meter.update({
      where: { id: oldMeterId },
      data: { 
        status: 'replaced', 
        removedAt: new Date(replacedAt) 
      }
    });

    // 2. Создаем новый счетчик
    const newMeter = await prisma.meter.create({
      data: {
        garageId,
        serialNumber: newSerialNumber,
        meteringType: newMeteringType,
        initialReadingT1: newInitialT1,
        initialReadingT2: newInitialT2 || null,
        initialReadingDate: new Date(replacedAt),
        status: 'active',
      }
    });

    // 3. Записываем в историю замен
    await prisma.meterReplacement.create({
      data: {
        oldMeterId,
        newMeterId: newMeter.id,
        replacedAt: new Date(replacedAt),
        oldFinalReadingT1: oldFinalT1,
        oldFinalReadingT2: oldFinalT2 || null,
        reason: reason || 'Плановая замена',
        performedById: session.userId,
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Счётчик успешно заменён' } });
  } catch (error) {
    console.error('Replace meter error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при замене' } }, { status: 500 });
  }
}