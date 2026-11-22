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
    const { paymentType, amount, period, description } = data;

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: { message: 'Неверная сумма' } }, { status: 400 });
    }

    const [year, month] = period.split('-').map(Number);
    const chargePeriod = new Date(Date.UTC(year, month - 1, 1));

    // 1. Получаем все активные гаражи с их собственниками
    const garages = await prisma.garage.findMany({
      where: { status: 'active' },
      include: {
        owners: { include: { owner: true } }
      }
    });

    let createdCount = 0;
    let skippedCount = 0;

    // 2. Начисляем каждому
    for (const garage of garages) {
      const owner = garage.owners[0]?.owner;
      if (!owner) {
        skippedCount++; // Пропускаем, если у гаража нет собственника
        continue;
      }

      try {
        // Проверяем, нет ли уже такого начисления за этот период
        const existing = await prisma.charge.findUnique({
          where: {
            garageId_period_paymentType: {
              garageId: garage.id,
              period: chargePeriod,
              paymentType: paymentType
            }
          }
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Создаем начисление
        await prisma.charge.create({
          data: {
            garageId: garage.id,
            ownerId: owner.id,
            period: chargePeriod,
            paymentType: paymentType,
            amount: amount,
            source: 'manual',
            status: 'awaiting_payment',
            notes: description // Если есть поле notes в БД, или пропусти
          }
        });

        // Обновляем баланс гаража и собственника
        await prisma.garageBalance.upsert({
          where: { garageId: garage.id },
          create: { garageId: garage.id, debtAmount: amount, balance: -amount },
          update: { debtAmount: { increment: amount }, balance: { decrement: amount } }
        });

        await prisma.ownerBalance.upsert({
          where: { ownerId: owner.id },
          create: { ownerId: owner.id, debtAmount: amount, balance: -amount },
          update: { debtAmount: { increment: amount }, balance: { decrement: amount } }
        });

        createdCount++;
      } catch (e) {
        console.error(`Ошибка при начислении на гараж ${garage.block}-${garage.number}`, e);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      data: { message: `Начислено взносов: ${createdCount}. Пропущено: ${skippedCount}` } 
    });

  } catch (error) {
    console.error('Manual charge error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}