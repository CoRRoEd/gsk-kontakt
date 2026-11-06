import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';
import { verifyCodeSchema } from '@/lib/validation/auth';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyCodeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message } },
        { status: 400 }
      );
    }

    const phone = normalizePhone(result.data.phone);
    const { code } = result.data;

    if (!isValidPhone(phone)) {
      return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Неверный формат' } }, { status: 400 });
    }

    // Ищем код в БАЗЕ ДАННЫХ
    const stored = await prisma.authCode.findUnique({ where: { phone } });

    // --- ОТЛАДОЧНЫЙ ЛОГ ---
    console.log('DEBUG VERIFY:', { 
      phone, 
      enteredCode: code, 
      foundInDb: stored ? stored.code : 'НЕ НАЙДЕН',
      attempts: stored ? stored.attempts : 0
    });

    if (!stored) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_CODE', message: 'Код не найден. Запросите новый.' } }, { status: 400 });
    }

    if (new Date() > stored.expiresAt) {
      await prisma.authCode.delete({ where: { phone } });
      return NextResponse.json({ ok: false, error: { code: 'CODE_EXPIRED', message: 'Код истек. Запросите новый.' } }, { status: 400 });
    }

    if (stored.attempts >= 3) {
      await prisma.authCode.delete({ where: { phone } });
      return NextResponse.json({ ok: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Слишком много попыток.' } }, { status: 429 });
    }

    if (stored.code !== code) {
      await prisma.authCode.update({ where: { phone }, data: { attempts: stored.attempts + 1 } });
      return NextResponse.json({ ok: false, error: { code: 'INVALID_CODE', message: 'Неверный код' } }, { status: 400 });
    }

    // Код верный — удаляем из базы
    await prisma.authCode.delete({ where: { phone } });

    // Находим пользователя и создаем сессию
    const userPhone = await prisma.userPhone.findUnique({ where: { phone }, include: { user: true } });
    if (!userPhone || !userPhone.user) {
      return NextResponse.json({ ok: false, error: { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' } }, { status: 404 });
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = userPhone.user.id;
    session.role = userPhone.user.role;
    session.phone = phone;
    await session.save();

    await prisma.user.update({ where: { id: userPhone.user.id }, data: { lastLoginAt: new Date() } });

    return NextResponse.json({
      ok: true,
      data: {
        user: { id: userPhone.user.id, fullName: userPhone.user.fullName, role: userPhone.user.role },
        redirect: userPhone.user.role === 'owner' ? '/app' : '/admin',
      },
    });
  } catch (error) {
    console.error('verify-code error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } }, { status: 500 });
  }
}