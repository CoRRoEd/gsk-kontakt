import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const updateNewsSchema = z.object({
  title: z.string().min(5, 'Заголовок слишком короткий'),
  slug: z.string().min(3, 'URL слишком короткий'),
  excerpt: z.string().min(10, 'Краткое описание слишком короткое'),
  body: z.string().min(10, 'Текст новости слишком короткий'),
  category: z.enum(['important', 'electricity', 'documents', 'meetings', 'improvement', 'announcements', 'other']),
  priority: z.enum(['normal', 'important', 'urgent']),
  status: z.enum(['draft', 'published']),
});

// --- ОБНОВЛЕНИЕ (РЕДАКТИРОВАНИЕ) ---
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateNewsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const data = result.data;

    // Проверка, не занят ли новый slug другой новостью
    const existing = await prisma.news.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ ok: false, error: { message: 'Новость с таким URL уже существует' } }, { status: 400 });
    }

    // Получаем старую новость, чтобы понять, менялся ли статус
    const oldNews = await prisma.news.findUnique({ where: { id } });

    const news = await prisma.news.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        body: data.body,
        category: data.category,
        priority: data.priority,
        status: data.status,
        // Если переводим из черновика в публикацию, ставим текущую дату
        publishedAt: data.status === 'published' && oldNews?.status !== 'published' 
          ? new Date() 
          : oldNews?.publishedAt,
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Новость обновлена', news } });
  } catch (error) {
    console.error('Update news error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}

// --- УДАЛЕНИЕ ---
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;

    await prisma.news.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true, data: { message: 'Новость удалена' } });
  } catch (error) {
    console.error('Delete news error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка при удалении' } }, { status: 500 });
  }
}