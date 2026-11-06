import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';
import { verifyPassword } from '@/lib/auth/password';
import { sendVerificationCode } from '@/lib/sms';
import { adminLoginStore } from '../store';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1, 'Введите пароль'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: result.error.errors[0]?.message || 'Неверные данные',
          },
        },
        { status: 400 }
      );
    }

    const phone = normalizePhone(result.data.phone);
    const { password } = result.data;

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'Неверный формат телефона' },
        },
        { status: 400 }
      );
    }

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // Нейтральный ответ при любой ошибке — не раскрываем, что именно не так
    const errorResponse = () =>
      NextResponse.json(
        {
          ok: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Неверный телефон или пароль' },
        },
        { status: 401 }
      );

    // Проверяем, что это персонал, аккаунт активен и пароль установлен
    if (
      !user ||
      user.role === 'owner' ||
      user.status !== 'active' ||
      !user.passwordHash
    ) {
      return errorResponse();
    }

    // Проверяем пароль
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return errorResponse();
    }

    // Пароль верный — генерируем 2FA-код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = Date.now() + 5 * 60 * 1000; // 5 минут

    // Сохраняем состояние в общее хранилище (store.ts)
    adminLoginStore.set(phone, {
      userId: user.id,
      phone,
      step: 'code_sent',
      code,
      codeExpiresAt,
      codeAttempts: 0,
      createdAt: Date.now(),
    });

    // Отправляем SMS (пока выводит в консоль терминала)
    await sendVerificationCode(phone, code);

    return NextResponse.json({
      ok: true,
      data: { message: 'Код отправлен' },
    });
  } catch (error) {
    console.error('admin step2 error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } },
      { status: 500 }
    );
  }
}