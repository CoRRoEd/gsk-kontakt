import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    // 1. Ищем действующий тариф
    const activeTariff = await prisma.tariffSet.findFirst({
      where: { status: 'active' }
    });

    if (!activeTariff) {
      return NextResponse.json({ ok: false, error: { message: 'Нет действующего тарифа. Сначала установите тариф.' } }, { status: 400 });
    }

    // 2. Ищем все показания, по которым еще не созданы начисления (статус submitted)
    const readings = await prisma.reading.findMany({
      where: { status: 'submitted' },
      include: {
        meter: {
          include: {
            garage: {
              include: { owners: { include: { owner: true } } }
            }
          }
        }
      }
    });

    if (readings.length === 0) {
      return NextResponse.json({ ok: false, error: { message: 'Нет новых показаний для расчета. Возможно, начисления уже сформированы.' } }, { status: 400 });
    }

    let generatedCount = 0;

    // 3. Обрабатываем каждое показание
    for (const reading of readings) {
      const garage = reading.meter.garage;
      const owner = garage.owners[0]?.owner; // Берем первого собственника гаража

      if (!owner) continue; // Пропускаем, если у гаража нет владельца

      // Находим предыдущее показание, чтобы узнать расход
      const prevReading = await prisma.reading.findFirst({
        where: { meterId: reading.meterId, period: { lt: reading.period } },
        orderBy: { period: 'desc' }
      });

      const prevT1 = prevReading ? Number(prevReading.readingT1) : Number(reading.meter.initialReadingT1);
      const prevT2 = prevReading ? Number(prevReading.readingT2 || 0) : Number(reading.meter.initialReadingT2 || 0);

      const consumptionT1 = Number(reading.readingT1) - prevT1;
      const consumptionT2 = reading.readingT2 ? Number(reading.readingT2) - prevT2 : null;

      // Считаем сумму: расход умножить на цену тарифа
      const amountT1 = consumptionT1 * Number(activeTariff.priceT1);
      const amountT2 = (consumptionT2 && activeTariff.priceT2) ? consumptionT2 * Number(activeTariff.priceT2) : 0;
      const totalAmount = amountT1 + amountT2;

      // Создаем начисление
      await prisma.charge.create({
        data: {
          garageId: garage.id,
          ownerId: owner.id,
          meterId: reading.meterId,
          readingId: reading.id,
          period: reading.period,
          paymentType: 'electricity',
          consumptionT1,
          consumptionT2,
          tariffT1: activeTariff.priceT1,
          tariffT2: activeTariff.priceT2,
          amount: totalAmount,
          tariffSetId: activeTariff.id,
          source: 'reading',
          status: 'awaiting_payment', // Ожидает оплаты
        }
      });

      // Меняем статус показания, чтобы не начислить дважды
      await prisma.reading.update({
        where: { id: reading.id },
        data: { status: 'verified' }
      });

      // Обновляем баланс гаража и собственника (пока просто увеличиваем общий долг)
      await prisma.garageBalance.upsert({
        where: { garageId: garage.id },
        create: { garageId: garage.id, debtAmount: totalAmount, balance: -totalAmount },
        update: { debtAmount: { increment: totalAmount }, balance: { decrement: totalAmount } }
      });

      await prisma.ownerBalance.upsert({
        where: { ownerId: owner.id },
        create: { ownerId: owner.id, debtAmount: totalAmount, balance: -totalAmount },
        update: { debtAmount: { increment: totalAmount }, balance: { decrement: totalAmount } }
      });

      generatedCount++;
    }

    return NextResponse.json({ 
      ok: true, 
      data: { message: `Успешно сформировано начислений: ${generatedCount}` } 
    });

  } catch (error) {
    console.error('Generate charges error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при расчете' } }, { status: 500 });
  }
}