import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ ok: false, error: { message: 'Не авторизован' } }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chargeId = formData.get('chargeId') as string;

    if (!file || !chargeId) {
      return NextResponse.json({ ok: false, error: { message: 'Не хватает данных' } }, { status: 400 });
    }

    // 1. Проверяем начисление
    const charge = await prisma.charge.findUnique({
      where: { id: chargeId }
    });

    if (!charge) {
      return NextResponse.json({ ok: false, error: { message: 'Начисление не найдено' } }, { status: 404 });
    }

    // 2. Сохраняем файл на сервер (в папку public/uploads)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Генерируем уникальное имя файла, чтобы чеки не перезаписывали друг друга
    const uniqueFileName = `receipt_${chargeId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    // Создаем папку, если ее нет
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    // Записываем файл
    const filePath = join(uploadDir, uniqueFileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    // 3. Создаем запись о платеже в базе данных
    const payment = await prisma.payment.create({
      data: {
        chargeId: charge.id,
        userId: session.userId,
        amount: charge.amount,
        paymentType: charge.paymentType,
        provider: 'manual', // Указываем, что это ручной перевод с чеком
        status: 'pending', // Ожидает подтверждения бухгалтером
        receiptUrl: fileUrl,
      }
    });

    // 4. Можно добавить проверку: если по этому начислению уже есть платеж в статусе pending, 
    // возможно, стоит отклонить повторную загрузку. Но для MVP оставим так.

    return NextResponse.json({
      ok: true,
      data: { message: 'Чек успешно загружен и отправлен на проверку' }
    });

  } catch (error) {
    console.error('Payment submit error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при загрузке чека' } }, { status: 500 });
  }
}