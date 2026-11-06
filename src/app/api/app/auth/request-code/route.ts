import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';
import { requestCodeSchema } from '@/lib/validation/auth';
import { sendVerificationCode } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = requestCodeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message } },
        { status: 400 }
      );
    }

    const phone = normalizePhone(result.data.phone);
    const neutralResponse = { ok: true, data: { message: 'Если номер зарегистрирован, код отправлен' } };

    if (!isValidPhone(phone)) return NextResponse.json(neutralResponse);

    const userPhone = await prisma.userPhone.findUnique({ where: { phone } });
    if (!userPhone) return NextResponse.json(neutralResponse);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Сохраняем в БАЗУ ДАННЫХ
    await prisma.authCode.upsert({
      where: { phone },
      update: { code, expiresAt, attempts: 0 },
      create: { phone, code, expiresAt },
    });

    await sendVerificationCode(phone, code);

    return NextResponse.json(neutralResponse);
  } catch (error) {
    console.error('request-code error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } }, { status: 500 });
  }
}