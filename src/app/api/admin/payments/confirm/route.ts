import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // 1. Проверка прав доступа (только для персонала)
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ ok: false, error: { message: 'Не передан ID платежа' } }, { status: 400 });
    }

    // 2. Находим платеж в базе
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { charge: true }
    });

    if (!payment) {
      return NextResponse.json({ ok: false, error: { message: 'Платёж не найден' } }, { status: 404 });
    }

    if (payment.status === 'succeeded') {
      return NextResponse.json({ ok: false, error: { message: 'Этот платёж уже подтвержден' } }, { status: 400 });
    }

    // 3. Используем транзакцию, чтобы изменения применились либо вместе, либо никак
    await prisma.$transaction([
      // Обновляем статус самого платежа
      prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'succeeded', 
          paidAt: new Date() 
        }
      }),
      // Если платеж привязан к начислению, гасим долг
      ...(payment.chargeId ? [
        prisma.charge.update({
          where: { id: payment.chargeId },
          data: { 
            status: 'paid', 
            paidAmount: payment.amount 
          }
        })
      ] : [])
    ]);

    return NextResponse.json({ 
      ok: true, 
      data: { message: 'Оплата успешно подтверждена, долг погашен' } 
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}