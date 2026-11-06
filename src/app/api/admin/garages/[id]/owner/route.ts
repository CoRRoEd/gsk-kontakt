import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Проверка авторизации
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newOwnerId } = body;

    if (!newOwnerId) {
      return NextResponse.json({ ok: false, error: { message: 'Не передан ID нового собственника' } }, { status: 400 });
    }

    // 2. Находим гараж
    const garage = await prisma.garage.findUnique({
      where: { id },
      include: {
        owners: {
          where: { endedAt: null } // Текущий активный владелец
        }
      }
    });

    if (!garage) {
      return NextResponse.json({ ok: false, error: { message: 'Гараж не найден' } }, { status: 404 });
    }

    const currentOwnerLink = garage.owners[0];

    // 3. Проверка, что новый собственник не является текущим
    if (currentOwnerLink && currentOwnerLink.ownerId === newOwnerId) {
      return NextResponse.json({ ok: false, error: { message: 'Этот собственник уже владеет данным гаражом' } }, { status: 400 });
    }

    // 4. Проверка, существует ли новый собственник в базе
    const newOwner = await prisma.owner.findUnique({ where: { id: newOwnerId } });
    if (!newOwner) {
      return NextResponse.json({ ok: false, error: { message: 'Выбранный собственник не найден в базе' } }, { status: 404 });
    }

    // 5. СМЕНА СОБСТВЕННИКА (Транзакция)
    await prisma.$transaction([
      // Если был старый владелец — закрываем его период владения (архивируем)
      ...(currentOwnerLink ? [
        prisma.ownerGarage.update({
          where: { id: currentOwnerLink.id },
          data: { endedAt: new Date() }
        })
      ] : []),
      
      // Создаем новую запись о владении
      prisma.ownerGarage.create({
        data: {
          ownerId: newOwnerId,
          garageId: garage.id,
          ownershipType: 'owner',
          share: 1.0,
          startedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ ok: true, data: { message: 'Собственник успешно привязан' } });

  } catch (error) {
    console.error('Change owner error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}