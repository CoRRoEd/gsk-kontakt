import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    // Удалять гараж может только Председатель (или админ)
    if (!session.userId || (session.role !== 'chairman' && session.role !== 'admin')) {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;

    // 1. Проверяем, есть ли долги у этого гаража
    const activeCharges = await prisma.charge.count({
      where: { garageId: id, status: 'awaiting_payment' }
    });

    if (activeCharges > 0) {
      return NextResponse.json({ 
        ok: false, 
        error: { message: 'Невозможно удалить гараж. По нему есть непогашенные начисления.' } 
      }, { status: 400 });
    }

    // 2. Удаляем всё, что привязано к гаражу (каскадно)
    // Удаляем связи с собственниками
    await prisma.ownerGarage.deleteMany({ where: { garageId: id } });
    // Удаляем баланс
    await prisma.garageBalance.deleteMany({ where: { garageId: id } });
    
    // Удаляем показания (они привязаны к счетчикам)
    const meters = await prisma.meter.findMany({ where: { garageId: id } });
    const meterIds = meters.map(m => m.id);
    
    if (meterIds.length > 0) {
      await prisma.reading.deleteMany({ where: { meterId: { in: meterIds } } });
      await prisma.meter.deleteMany({ where: { garageId: id } });
    }

    // Удаляем старые начисления (которые уже оплачены)
    await prisma.charge.deleteMany({ where: { garageId: id } });

    // 3. Наконец, удаляем сам гараж
    await prisma.garage.delete({ where: { id } });

    return NextResponse.json({ ok: true, data: { message: 'Гараж успешно удален' } });
  } catch (error) {
    console.error('Delete garage error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при удалении' } }, { status: 500 });
  }
}