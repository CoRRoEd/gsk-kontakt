import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.userId) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Не авторизован' } },
        { status: 401 }
      );
    }

    // Загружаем пользователя с гаражами
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        owner: {
          include: {
            garages: {
              include: {
                garage: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Пользователь не найден' } },
        { status: 401 }
      );
    }

    // Формируем список гаражей
    const garages =
      user.owner?.garages.map((og) => ({
        id: og.garage.id,
        block: og.garage.block,
        row: og.garage.row,
        number: og.garage.number,
        ownershipType: og.ownershipType,
        share: og.share,
      })) || [];

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
        garages,
      },
    });
  } catch (error) {
    console.error('me error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера' } },
      { status: 500 }
    );
  }
}