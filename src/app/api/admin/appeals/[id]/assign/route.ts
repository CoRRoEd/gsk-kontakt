import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    
    // Только Председатель или Админ
    if (!session.userId || !['chairman', 'admin'].includes(session.role || '')) {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { comment } = body; // <-- Принимаем комментарий

    // Ищем электрика в системе
    const electrician = await prisma.user.findFirst({
      where: { role: 'electrician', status: 'active' }
    });

    if (!electrician) {
      return NextResponse.json({ ok: false, error: { message: 'Электрик не найден в системе' } }, { status: 404 });
    }

    // Обновляем заявку
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        assignedToId: electrician.id,
        status: 'in_progress',
        resolution: comment || 'Заявка передана электрику', // <-- Сохраняем комментарий
        isReadByOwner: false // Собственнику прилетит уведомление, что статус изменился
      }
    });

    return NextResponse.json({ ok: true, data: appeal });
  } catch (error) {
    console.error('Assign appeal error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}