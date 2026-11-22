import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

// Схема валидации
const createAppealSchema = z.object({
  topic: z.enum(['access', 'metering', 'payment', 'negative_reading', 'meter_replacement', 'other']),
  subject: z.string().min(3, 'Тема должна быть не менее 3 символов'),
  body: z.string().min(10, 'Сообщение должно быть не менее 10 символов'),
});

// GET: Получить список своих обращений
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ ok: false, error: { message: 'Не авторизован' } }, { status: 401 });

    const appeals = await prisma.appeal.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ ok: true, data: { appeals } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}

// POST: Создать обращение
export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ ok: false, error: { message: 'Не авторизован' } }, { status: 401 });

    const body = await request.json();
    const result = createAppealSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const data = result.data;

    const appeal = await prisma.appeal.create({
      data: {
        userId: session.userId,
        topic: data.topic,
        subject: data.subject,
        body: data.body,
        status: 'new',
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Обращение отправлено', appeal } });
  } catch (error) {
    console.error('Create appeal error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}