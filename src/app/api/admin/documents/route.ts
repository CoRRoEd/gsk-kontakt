import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const documentSchema = z.object({
  title: z.string().min(3, 'Название слишком короткое'),
  type: z.enum(['general_meeting', 'board_report', 'board_decision', 'announcement', 'other']),
  number: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  adoptedAt: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'repealed']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File; // Убедись, что на фронтенде ключ 'file'
    
    // Валидация текстовых полей
    const rawData = {
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      number: (formData.get('number') as string) || null,
      description: (formData.get('description') as string) || null,
      adoptedAt: (formData.get('adoptedAt') as string) || null,
      status: formData.get('status') as string,
    };

    const result = documentSchema.safeParse(rawData);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ ok: false, error: { message: 'Прикрепите PDF-файл' } }, { status: 400 });
    }

    // ЗАЩИТА: Проверяем, что это действительно PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ ok: false, error: { message: 'Можно загружать только файлы формата PDF' } }, { status: 400 });
    }

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueFileName = `doc_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents');
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, uniqueFileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/documents/${uniqueFileName}`;

    // ЗАЩИТА: Безопасный парсинг даты (если пустая строка, то null)
    const adoptedDate = result.data.adoptedAt && result.data.adoptedAt !== '' 
      ? new Date(result.data.adoptedAt) 
      : null;

    // Сохраняем в БД
    const document = await prisma.document.create({
      data: {
        title: result.data.title,
        type: result.data.type as any,
        number: result.data.number,
        description: result.data.description,
        adoptedAt: adoptedDate,
        status: result.data.status as any,
        pdfUrl: fileUrl,
        publishedAt: result.data.status === 'active' ? new Date() : null,
        publishedById: session.userId,
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Документ загружен', document } });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка при загрузке' } }, { status: 500 });
  }
}