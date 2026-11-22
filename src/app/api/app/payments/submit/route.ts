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
    if (!session.userId) return NextResponse.json({ ok: false, error: { message: 'Не авторизован' } }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chargeIdsRaw = formData.get('chargeIds') as string;

    if (!file || !chargeIdsRaw) {
      return NextResponse.json({ ok: false, error: { message: 'Не хватает данных для загрузки чека' } }, { status: 400 });
    }

    // Парсим массив ID
    let chargeIds: string[] = [];
    try {
      chargeIds = JSON.parse(chargeIdsRaw);
    } catch {
      return NextResponse.json({ ok: false, error: { message: 'Неверный формат ID счетов' } }, { status: 400 });
    }

    // 1. Находим все счета, которые пользователь пытается оплатить
    const charges = await prisma.charge.findMany({
      where: { 
        id: { in: chargeIds }, 
        status: 'awaiting_payment' 
      }
    });

    if (charges.length === 0) {
      return NextResponse.json({ ok: false, error: { message: 'Счета не найдены или уже оплачены' } }, { status: 400 });
    }

    // Считаем общую сумму (на случай, если кто-то подделал запрос)
    const totalAmount = charges.reduce((acc, c) => acc + Number(c.amount), 0);

    // 2. Сохраняем файл чека на сервер
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Уникальное имя файла
    const uniqueFileName = `receipt_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, uniqueFileName), buffer);
    const fileUrl = `/uploads/${uniqueFileName}`;

    // 3. Создаем один платеж на общую сумму и распределяем его
    await prisma.$transaction(async (tx) => {
      // Создаем общий платеж (статус pending, ждет проверки бухгалтера)
      const payment = await tx.payment.create({
        data: {
          userId: session.userId,
          amount: totalAmount,
          paymentType: 'electricity', // основной тип
          provider: 'manual',
          status: 'pending',
          receiptUrl: fileUrl,
        }
      });

      // Распределяем оплату по каждому счету (PaymentAllocation)
      for (const charge of charges) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            chargeId: charge.id,
            amount: charge.amount,
          }
        });
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Чек успешно загружен и отправлен на проверку' } });
    
  } catch (error) {
    console.error('Payment submit error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при загрузке чека' } }, { status: 500 });
  }
}