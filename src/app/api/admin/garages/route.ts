import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const createGarageSchema = z.object({
  row: z.union([z.string(), z.number()]), // Принимаем и строку, и число
  block: z.union([z.string(), z.number()]),
  number: z.number().int().positive(),
  floors: z.number().int().min(1).max(2).optional(),
  areaSqm: z.number().positive().nullable().optional(),
  cadastralNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional().default('active'),
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
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message || 'Неверные данные' } }, { status: 400 });
    }

    const data = result.data;
    
    // Принудительно приводим к строкам и убираем пробелы
    const rowStr = String(data.row).trim();
    const blockStr = String(data.block).trim();

    // Проверка, что такой гараж уже не создан
    const existing = await prisma.garage.findUnique({
      where: { 
        row_block_number: { 
          row: rowStr, 
          block: blockStr, 
          number: data.number 
        } 
      }
    });

    if (existing) {
      return NextResponse.json({ ok: false, error: { message: 'Гараж с такими параметрами уже существует' } }, { status: 400 });
    }

    // Создаем гараж
    const newGarage = await prisma.garage.create({
      data: {
        row: rowStr,
        block: blockStr,
        number: data.number,
        floors: data.floors || 1,
        areaSqm: data.areaSqm || null,
        cadastralNumber: data.cadastralNumber || null,
        notes: data.notes || null,
        status: data.status as any,
      }
    });

    return NextResponse.json({ 
      ok: true, 
      data: { message: 'Гараж успешно создан', garage: newGarage } 
    });
  } catch (error) {
    console.error('Create garage error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при создании гаража' } }, { status: 500 });
  }
}