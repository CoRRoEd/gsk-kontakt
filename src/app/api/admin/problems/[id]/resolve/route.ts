import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Проверка прав (только Председатель или Админ)
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || !['chairman', 'admin'].includes(session.role || '')) {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;

    // 2. Выполняем все изменения в транзакции
    await prisma.$transaction(async (tx) => {
      // А) Находим проблему, чтобы узнать, к какому гаражу она относится
      const problem = await tx.problemGarage.findUnique({
        where: { id }
      });

      if (!problem) {
        throw new Error('Проблема не найдена');
      }

      // Б) Обновляем статус самой проблемы
      await tx.problemGarage.update({
        where: { id },
        data: { 
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionNote: `Урегулировано пользователем ${session.userId}`
        }
      });

      // В) Гасим уведомление в колокольчике (меняем статус с 'queued' на 'delivered')
      // Ищем уведомления текущего пользователя, где в payload (JSON) есть ссылка на этот гараж
      await tx.notification.updateMany({
        where: {
          userId: session.userId,
          status: 'queued',
          payload: {
            path: ['url'],
            string_contains: problem.garageId // Ищем уведомление, привязанное к этому гаражу
          }
        },
        data: { status: 'delivered' }
      });
    });

    return NextResponse.json({ ok: true, data: { message: 'Нарушение урегулировано' } });

  } catch (error: any) {
    console.error('Resolve problem error:', error);
    return NextResponse.json(
      { ok: false, error: { message: error.message || 'Ошибка сервера при закрытии проблемы' } }, 
      { status: 500 }
    );
  }
}