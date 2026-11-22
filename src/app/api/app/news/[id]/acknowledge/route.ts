import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ ok: false, error: { message: 'Не авторизован' } }, { status: 401 });

    const { id: newsId } = await params;

    // Создаем запись (или игнорируем, если уже есть)
    await prisma.newsAcknowledgement.upsert({
      where: {
        newsId_userId: { newsId, userId: session.userId }
      },
      update: {},
      create: {
        newsId,
        userId: session.userId
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Acknowledge error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}