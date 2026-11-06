import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );
    session.destroy();

    return NextResponse.json({ ok: true, data: { message: 'Вы вышли из системы' } });
  } catch (error) {
    console.error('logout error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}