import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const settingsSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  address: z.string().optional(),
  inn: z.string().optional(),
  ogrn: z.string().optional(),
  normKwhPerMonth: z.number().positive('Норматив должен быть больше 0'),
  averageMonths: z.number().int().positive(),
  maxMonthsWithoutReadings: z.number().int().positive(),
  readingPeriodStartDay: z.number().int().min(1).max(31),
  readingPeriodEndDay: z.number().int().min(1).max(31),
  paymentDueDays: z.number().int().positive(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    // Доступ только у Председателя (или Админа), бухгалтер не может менять настройки ГСК
    if (!session.userId || session.role === 'owner' || session.role === 'accountant') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const body = await request.json();
    const result = settingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const data = result.data;

    // Ищем текущие настройки
    const currentSettings = await prisma.cooperativeSettings.findFirst();

    if (!currentSettings) {
      // Если настроек нет (первый запуск), создаем
      const newSettings = await prisma.cooperativeSettings.create({
        data: {
          ...data,
          startDate: new Date(), // Текущая дата как старт (если не задан)
        }
      });
      return NextResponse.json({ ok: true, data: newSettings });
    }

    // Если есть, обновляем
    const updated = await prisma.cooperativeSettings.update({
      where: { id: currentSettings.id },
      data: data
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}