import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ ok: false, error: { message: 'Не авторизован' } }, { status: 401 });

    const { garageId } = await request.json();

    // 1. Проверяем, что гараж принадлежит этому пользователю
    const ownerGarage = await prisma.ownerGarage.findFirst({
      where: { garageId, owner: { userId: session.userId }, endedAt: null }
    });
    if (!ownerGarage) return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });

    // 2. Ищем последнее переданное показание (только по АКТИВНОМУ счетчику!)
    const reading = await prisma.reading.findFirst({
      where: { meter: { garageId, status: 'active' }, status: 'submitted' },
      orderBy: { period: 'desc' },
      include: { meter: true }
    });

    if (!reading) {
      return NextResponse.json({ ok: false, error: { message: 'Нет новых переданных показаний для расчета' } }, { status: 400 });
    }

    // 3. Проверяем, нет ли уже начисления за этот период (идемпотентность)
    let charge = await prisma.charge.findUnique({
      where: {
        garageId_period_paymentType: {
          garageId,
          period: reading.period,
          paymentType: 'electricity'
        }
      }
    });

    if (charge) {
      return NextResponse.json({ ok: true, data: { chargeId: charge.id } });
    }

    // 4. Ищем АКТУАЛЬНЫЙ тариф на дату периода показаний
    const tariff = await prisma.tariffSet.findFirst({ 
      where: { 
        status: 'active',
        paymentType: 'electricity',
        validFrom: { lte: reading.period },
        OR: [
          { validTo: null },
          { validTo: { gte: reading.period } }
        ]
      } 
    });

    if (!tariff) {
      return NextResponse.json({ ok: false, error: { message: 'Тариф на этот период не установлен' } }, { status: 400 });
    }

    // 5. Ищем предыдущие показания (по этому же счетчику)
    const prevReading = await prisma.reading.findFirst({
      where: { meterId: reading.meterId, period: { lt: reading.period } },
      orderBy: { period: 'desc' }
    });

    const prevT1 = prevReading ? Number(prevReading.readingT1) : Number(reading.meter.initialReadingT1);
    const prevT2 = prevReading && prevReading.readingT2 
      ? Number(prevReading.readingT2) 
      : (reading.meter.initialReadingT2 ? Number(reading.meter.initialReadingT2) : 0);

    const consumptionT1 = Number(reading.readingT1) - prevT1;
    const consumptionT2 = reading.readingT2 ? Number(reading.readingT2) - prevT2 : null;

    // 6. Защита от "скрученных" показаний
    if (consumptionT1 < 0 || (consumptionT2 !== null && consumptionT2 < 0)) {
      return NextResponse.json({ 
        ok: false, 
        error: { message: 'Введенные показания меньше предыдущих. Обратитесь в правление.' } 
      }, { status: 400 });
    }

    const amountT1 = consumptionT1 * Number(tariff.priceT1);
    const amountT2 = (consumptionT2 && tariff.priceT2) ? consumptionT2 * Number(tariff.priceT2) : 0;
    const totalAmount = amountT1 + amountT2;

    if (totalAmount <= 0) {
      return NextResponse.json({ ok: false, error: { message: 'Сумма к оплате равна 0' } }, { status: 400 });
    }

    // 7. Создаем начисление и обновляем балансы
    const newCharge = await prisma.$transaction(async (tx) => {
      const c = await tx.charge.create({
        data: {
          garageId,
          ownerId: ownerGarage.ownerId,
          meterId: reading.meterId,
          readingId: reading.id,
          period: reading.period,
          paymentType: 'electricity',
          consumptionT1,
          consumptionT2,
          tariffT1: tariff.priceT1,
          tariffT2: tariff.priceT2,
          amount: totalAmount,
          tariffSetId: tariff.id,
          source: 'reading',
          status: 'awaiting_payment',
        }
      });

      // Меняем статус показания на "проверено"
      await tx.reading.update({ where: { id: reading.id }, data: { status: 'verified' } });

      // Обновляем баланс гаража
      await tx.garageBalance.upsert({
        where: { garageId },
        create: { garageId, debtAmount: totalAmount, balance: -totalAmount },
        update: { debtAmount: { increment: totalAmount }, balance: { decrement: totalAmount } }
      });

      // Обновляем баланс собственника
      await tx.ownerBalance.upsert({
        where: { ownerId: ownerGarage.ownerId },
        create: { ownerId: ownerGarage.ownerId, debtAmount: totalAmount, balance: -totalAmount },
        update: { debtAmount: { increment: totalAmount }, balance: { decrement: totalAmount } }
      });

      return c;
    });

    return NextResponse.json({ ok: true, data: { chargeId: newCharge.id } });
  } catch (error) {
    console.error('Request invoice error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при расчете' } }, { status: 500 });
  }
}