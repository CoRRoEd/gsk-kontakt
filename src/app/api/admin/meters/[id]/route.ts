import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;

    // Проверяем, есть ли начисления, привязанные к этому счетчику
    const chargesCount = await prisma.charge.count({ where: { meterId: id } });
    
    if (chargesCount > 0) {
      return NextResponse.json({ 
        ok: false, 
        error: { message: 'Невозможно удалить счётчик, так как по нему уже есть начисления. Сначала удалите начисления.' } 
      }, { status: 400 });
    }

    // Если начислений нет, удаляем показания и сам счётчик в транзакции
    await prisma.$transaction([
      prisma.reading.deleteMany({ where: { meterId: id } }),
      prisma.meter.delete({ where: { id } })
    ]);

    return NextResponse.json({ ok: true, data: { message: 'Счётчик успешно удален' } });
  } catch (error) {
    console.error('Delete meter error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}