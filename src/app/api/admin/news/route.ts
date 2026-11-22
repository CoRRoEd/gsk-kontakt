import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const createNewsSchema = z.object({
  title: z.string().min(5, 'Заголовок слишком короткий'),
  slug: z.string().optional(),
  excerpt: z.string().min(10, 'Краткое описание слишком короткое'),
  body: z.string().min(10, 'Текст новости слишком короткий'),
  category: z.enum(['important', 'electricity', 'documents', 'meetings', 'improvement', 'announcements', 'other']),
  priority: z.enum(['normal', 'important', 'urgent']),
  status: z.enum(['draft', 'published']),
  requiresAcknowledgement: z.boolean().optional().default(false),
  expiresAt: z.string().optional().nullable(), // Дата в формате ISO
});

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const body = await request.json();
    const result = createNewsSchema.safeParse(body);

    if (!result.success) {
      console.log('VALIDATION ERROR:', result.error.errors);
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const data = result.data;

    // Генерация слага
    let finalSlug = data.slug;
    if (!finalSlug || finalSlug.length < 3) {
      finalSlug = data.title.toLowerCase()
        .replace(/[а-яё]/g, (char) => {
          const map: Record<string, string> = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
          return map[char] || char;
        })
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      if (!finalSlug) finalSlug = `news-${Date.now()}`;
    }

    // Проверка уникальности
    const existing = await prisma.news.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ ok: false, error: { message: 'Новость с таким URL уже существует' } }, { status: 400 });
    }

    const news = await prisma.news.create({
      data: {
        title: data.title,
        slug: finalSlug,
        excerpt: data.excerpt,
        body: data.body,
        category: data.category,
        priority: data.priority,
        status: data.status,
        requiresAcknowledgement: data.requiresAcknowledgement,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        publishedAt: data.status === 'published' ? new Date() : null,
        authorId: session.userId,
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Новость успешно создана', news } });
  } catch (error) {
    console.error('Create news error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}