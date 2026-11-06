import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { adminLoginStore } from '../store';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().min(1),
  code: z.string().length(6, 'Код должен быть 6 цифр'),
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
    const { code } = result.data;

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Неверный формат телефона' } },
        { status: 400 }
      );
    }

    // Проверяем состояние входа
    const state = adminLoginStore.get(phone);

    if (!state || state.step !== 'code_sent') {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_FLOW', message: 'Начните вход заново' } },
        { status: 400 }
      );
    }

    if (!state.code || !state.codeExpiresAt) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_CODE', message: 'Код не найден' } },
        { status: 400 }
      );
    }

    if (Date.now() > state.codeExpiresAt) {
      adminLoginStore.delete(phone);
      return NextResponse.json(
        { ok: false, error: { code: 'CODE_EXPIRED', message: 'Код истёк. Начните вход заново.' } },
        { status: 400 }
      );
    }

    if ((state.codeAttempts ?? 0) >= 3) {
      adminLoginStore.delete(phone);
      return NextResponse.json(
        { ok: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Слишком много попыток. Начните вход заново.' } },
        { status: 429 }
      );
    }

    if (state.code !== code) {
      state.codeAttempts = (state.codeAttempts ?? 0) + 1;
      adminLoginStore.set(phone, state);
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_CODE', message: 'Неверный код' } },
        { status: 400 }
      );
    }

    // Код верный — удаляем состояние
    adminLoginStore.delete(phone);

    // Загружаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: state.userId },
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { ok: false, error: { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' } },
        { status: 404 }
      );
    }

    // Создаём сессию
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );
    session.userId = user.id;
    session.role = user.role;
    session.phone = user.phone ?? phone;
    await session.save();

    // Обновляем lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      data: {
        user: { id: user.id, fullName: user.fullName, role: user.role },
        redirect: '/admin',
      },
    });
  } catch (error) {
    console.error('admin step3 error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } },
      { status: 500 }
    );
  }
}