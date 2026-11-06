import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const createGarageSchema = z.object({
  row: z.number().int().positive('Ряд должен быть больше 0'),
  block: z.enum(['1', '2'], { errorMap: () => ({ message: 'Блок может быть только "1" или "2"' }) }),
  number: z.number().int().positive('Номер бокса должен быть больше 0'),
  floors: z.number().int().min(1).max(2),
  areaSqm: z.number().positive().optional().nullable(),
  cadastralNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const body = await request.json();
    const result = createGarageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const data = result.data;

    // Проверка, что такой гараж уже не создан
    const existing = await prisma.garage.findUnique({
      where: { row_block_number: { row: data.row, block: data.block, number: data.number } }
    });

    if (existing) {
      return NextResponse.json({ ok: false, error: { message: 'Гараж с такими параметрами уже существует' } }, { status: 400 });
    }

    const garage = await prisma.garage.create({
      data: {
        row: data.row,
        block: data.block,
        number: data.number,
        floors: data.floors,
        areaSqm: data.areaSqm || null,
        cadastralNumber: data.cadastralNumber || null,
        notes: data.notes || null,
        status: 'active',
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Гараж создан', garage } });
  } catch (error) {
    console.error('Create garage error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}