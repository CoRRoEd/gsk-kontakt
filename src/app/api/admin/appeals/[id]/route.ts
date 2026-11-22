import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const replyAppealSchema = z.object({
  status: z.enum(['in_progress', 'resolved', 'rejected']),
  resolution: z.string().min(1, 'Введите текст ответа'),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = replyAppealSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        status: result.data.status,
        resolution: result.data.resolution,
        isReadByOwner: false, // <--- ВАЖНО: Зажигаем колокольчик у собственника!
        assignedToId: session.userId,
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Ответ отправлен', appeal } });
  } catch (error) {
    console.error('Reply appeal error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}