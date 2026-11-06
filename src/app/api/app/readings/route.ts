import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

// Схема валидации входящих данных
const submitReadingSchema = z.object({
  meterId: z.string().uuid('Неверный ID счётчика'),
  readingT1: z.number().nonnegative('Показание не может быть отрицательным'),
  readingT2: z.number().nonnegative('Показание не может быть отрицательным').optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role !== 'owner') {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Не авторизован' } },
        { status: 401 }
      );
    }

    // 2. Валидация данных
    const body = await request.json();
    const result = submitReadingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message } },
        { status: 400 }
      );
    }

    const { meterId, readingT1, readingT2 } = result.data;

    // 3. Получаем счётчик и проверяем, что он принадлежит гаражу текущего пользователя
    const meter = await prisma.meter.findUnique({
      where: { id: meterId },
      include: {
        garage: {
          include: {
            owners: {
              where: { owner: { userId: session.userId } }
            }
          }
        }
      }
    });

    if (!meter) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Счётчик не найден' } },
        { status: 404 }
      );
    }

    if (meter.garage.owners.length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'У вас нет доступа к этому счётчику' } },
        { status: 403 }
      );
    }

    // 4. Определяем текущий расчётный период (первое число текущего месяца)
    const now = new Date();
    const currentPeriod = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    // 5. Проверяем, не передавал ли уже пользователь показания в этом месяце
    const existingReading = await prisma.reading.findUnique({
      where: {
        meterId_period: {
          meterId: meter.id,
          period: currentPeriod
        }
      }
    });

    if (existingReading) {
      return NextResponse.json(
        { ok: false, error: { code: 'ALREADY_EXISTS', message: 'Вы уже передали показания за этот месяц' } },
        { status: 400 }
      );
    }

    // 6. Ищем предыдущее показание (для расчета расхода)
    const previousReading = await prisma.reading.findFirst({
      where: {
        meterId: meter.id,
        period: { lt: currentPeriod }
      },
      orderBy: { period: 'desc' }
    });

    // Если предыдущих нет, берем начальные показания при установке счетчика
    const prevT1 = previousReading ? Number(previousReading.readingT1) : Number(meter.initialReadingT1);
    const prevT2 = previousReading ? Number(previousReading.readingT2 || 0) : Number(meter.initialReadingT2 || 0);

    // 7. Считаем расход
    const consumptionT1 = readingT1 - prevT1;
    const consumptionT2 = readingT2 !== undefined ? readingT2 - prevT2 : null;

    // 8. Проверка на отрицательный расход (защита от опечаток)
    if (consumptionT1 < 0 || (consumptionT2 !== null && consumptionT2 < 0)) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'NEGATIVE_CONSUMPTION', 
            message: `Расход не может быть отрицательным. Предыдущее T1: ${prevT1}. Вы ввели: ${readingT1}` 
          } 
        },
        { status: 400 }
      );
    }

    // 9. Сохраняем показания в базу
    const newReading = await prisma.reading.create({
      data: {
        meterId: meter.id,
        period: currentPeriod,
        readingT1: readingT1,
        readingT2: readingT2,
        source: 'owner',
        status: 'submitted', // Пока 'submitted', бухгалтер потом сможет сделать 'verified'
        submittedById: session.userId,
        isFirst: !previousReading,
      }
    });

    // 10. Возвращаем успешный результат
    return NextResponse.json({
      ok: true,
      data: {
        message: 'Показания успешно приняты',
        reading: {
          id: newReading.id,
          period: newReading.period,
          consumptionT1,
          consumptionT2
        }
      }
    });

  } catch (error) {
    console.error('Submit reading error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } },
      { status: 500 }
    );
  }
}