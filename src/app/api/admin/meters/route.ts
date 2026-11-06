import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const createMeterSchema = z.object({
  garageId: z.string().uuid('Выберите гараж'),
  serialNumber: z.string().min(1, 'Введите серийный номер'),
  meteringType: z.enum(['single', 'dual']),
  initialReadingT1: z.number().nonnegative(),
  initialReadingT2: z.number().nonnegative().optional(),
  initialReadingDate: z.string(), // Придет как YYYY-MM-DD
});

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const body = await request.json();
    const result = createMeterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { message: result.error.errors[0]?.message || 'Неверные данные' } },
        { status: 400 }
      );
    }

    const data = result.data;

    // Проверка на уникальность серийного номера
    const existingMeter = await prisma.meter.findUnique({
      where: { serialNumber: data.serialNumber }
    });

    if (existingMeter) {
      return NextResponse.json(
        { ok: false, error: { message: 'Счётчик с таким серийным номером уже существует' } },
        { status: 400 }
      );
    }

    // Создаем счётчик
    const newMeter = await prisma.meter.create({
      data: {
        garageId: data.garageId,
        serialNumber: data.serialNumber,
        meteringType: data.meteringType,
        initialReadingT1: data.initialReadingT1,
        initialReadingT2: data.initialReadingT2,
        initialReadingDate: new Date(data.initialReadingDate),
        status: 'active',
      }
    });

    return NextResponse.json({
      ok: true,
      data: { message: 'Счётчик успешно добавлен', meter: newMeter }
    });

  } catch (error) {
    console.error('Create meter error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}