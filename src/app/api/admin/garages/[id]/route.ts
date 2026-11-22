import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { z } from 'zod';

const updateGarageSchema = z.object({
  row: z.string().min(1).optional(),
  block: z.string().min(1).optional(),
  number: z.number().int().positive().optional(),
  floors: z.number().int().min(1).max(2).optional(),
  areaSqm: z.number().positive().nullable().optional(),
  cadastralNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
  clearOwner: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateGarageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: { message: result.error.errors[0]?.message } }, { status: 400 });
    }

    const data = result.data;

    await prisma.$transaction(async (tx) => {
      
      // 1. Обновляем характеристики гаража (только те, которые пришли)
      await tx.garage.update({
        where: { id },
        data: {
          row: data.row,
          block: data.block,
          number: data.number,
          floors: data.floors,
          areaSqm: data.areaSqm,
          cadastralNumber: data.cadastralNumber,
          notes: data.notes,
          status: data.status,
        }
      });

      // 2. Если передан флаг clearOwner, отвязываем всех текущих собственников
      if (data.clearOwner) {
        await tx.ownerGarage.updateMany({
          where: { garageId: id, endedAt: null },
          data: { endedAt: new Date() }
        });
      }
    });

    return NextResponse.json({ ok: true, data: { message: 'Данные гаража обновлены' } });
  } catch (error) {
    console.error('Update garage error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}