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
    
    // Получаем данные о счетах (поддерживаем и одиночный, и массовый формат)
    const chargeIdsRaw = formData.get('chargeIds') as string;
    const singleChargeId = formData.get('chargeId') as string;

    let finalChargeIds: string[] = [];

    if (chargeIdsRaw) {
      try {
        finalChargeIds = JSON.parse(chargeIdsRaw);
      } catch {
        return NextResponse.json({ ok: false, error: { message: 'Неверный формат массива ID' } }, { status: 400 });
      }
    } else if (singleChargeId) {
      finalChargeIds = [singleChargeId];
    } else {
      return NextResponse.json({ ok: false, error: { message: 'Не переданы ID счетов для оплаты' } }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ ok: false, error: { message: 'Файл чека не прикреплен' } }, { status: 400 });
    }

    // 1. Находим счета в базе
    const charges = await prisma.charge.findMany({
      where: { 
        id: { in: finalChargeIds }, 
        status: 'awaiting_payment' 
      }
    });

    if (charges.length === 0) {
      return NextResponse.json({ ok: false, error: { message: 'Счета не найдены или уже оплачены' } }, { status: 400 });
    }

    // Считаем общую сумму
    const totalAmount = charges.reduce((acc, c) => acc + Number(c.amount), 0);

    // 2. Сохраняем файл чека
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueFileName = `receipt_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, uniqueFileName), buffer);
    const fileUrl = `/uploads/${uniqueFileName}`;

    // 3. Создаем платеж и распределяем его
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: session.userId,
          amount: totalAmount,
          paymentType: charges[0].paymentType, // Берем тип первого счета (или electricity)
          provider: 'manual',
          status: 'pending',
          receiptUrl: fileUrl,
        }
      });

      // Распределяем по каждому счету
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