import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const adjustSchema = z.object({
  type: z.enum(['penalty', 'write_off', 'recalculation']), // Пеня, Списание, Перерасчет
  amount: z.number().positive('Сумма должна быть положительной'),
  reason: z.string().min(5, 'Укажите причину корректировки (минимум 5 символов)'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id: chargeId } = await params;
    const body = await request.json();
    const result = adjustSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const { type, amount, reason } = result.data;

    // 1. Находим начисление
    const charge = await prisma.charge.findUnique({
      where: { id: chargeId }
    });

    if (!charge) return NextResponse.json({ ok: false, error: { message: 'Начисление не найдено' } }, { status: 404 });

    // 2. Определяем знак: если списание (write_off), то сумма идет в минус (уменьшает долг)
    const finalAmount = type === 'write_off' ? -amount : amount;

    // 3. Используем транзакцию для обновления всего сразу
    await prisma.$transaction(async (tx) => {
      // a) Создаем запись в журнале корректировок
      await tx.adjustment.create({
        data: {
          chargeId: charge.id,
          type: type,
          amount: finalAmount,
          reason: reason,
          authorId: session.userId,
          period: charge.period,
        }
      });

      // b) Обновляем сумму самого начисления (увеличиваем или уменьшаем)
      await tx.charge.update({
        where: { id: chargeId },
        data: { amount: { increment: finalAmount } }
      });

      // c) Обновляем баланс гаража
      await tx.garageBalance.update({
        where: { garageId: charge.garageId },
        data: { 
          debtAmount: { increment: finalAmount },
          balance: { decrement: finalAmount } 
        }
      });

      // d) Обновляем баланс собственника
      await tx.ownerBalance.update({
        where: { ownerId: charge.ownerId },
        data: { 
          debtAmount: { increment: finalAmount },
          balance: { decrement: finalAmount } 
        }
      });
    });

    return NextResponse.json({ ok: true, data: { message: 'Корректировка успешно применена' } });
  } catch (error) {
    console.error('Adjust charge error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при корректировке' } }, { status: 500 });
  }
}