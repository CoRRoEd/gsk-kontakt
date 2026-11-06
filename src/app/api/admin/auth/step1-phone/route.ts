import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().min(1, 'Введите телефон'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Неверные данные' } },
        { status: 400 }
      );
    }

    const phone = normalizePhone(result.data.phone);

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Неверный формат телефона' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    const neutralResponse = {
      ok: true,
      data: { message: 'Если пользователь существует, переходим к следующему шагу' },
    };

    if (!user || user.role === 'owner' || user.status !== 'active' || !user.passwordHash) {
      return NextResponse.json(neutralResponse);
    }

    return NextResponse.json(neutralResponse);
  } catch (error) {
    console.error('admin step1 error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } },
      { status: 500 }
    );
  }
}