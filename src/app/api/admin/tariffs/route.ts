import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const createTariffSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  tariffType: z.enum(['single', 'dual']),
  priceT1: z.number().positive('Цена должна быть больше нуля'),
  priceT2: z.number().positive().optional(),
  validFrom: z.string(), // YYYY-MM-DD
});

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const body = await request.json();
    const result = createTariffSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const data = result.data;

    // 1. Архивируем текущие активные тарифы
    await prisma.tariffSet.updateMany({
      where: { status: 'active' },
      data: { status: 'archived', validTo: new Date(data.validFrom) }
    });

    // 2. Создаем новый активный тариф
    const newTariff = await prisma.tariffSet.create({
      data: {
        name: data.name,
        paymentType: 'electricity',
        tariffType: data.tariffType,
        priceT1: data.priceT1,
        priceT2: data.tariffType === 'dual' ? data.priceT2 : null,
        validFrom: new Date(data.validFrom),
        status: 'active',
        createdById: session.userId,
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Тариф успешно установлен', tariff: newTariff } });
  } catch (error) {
    console.error('Create tariff error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}