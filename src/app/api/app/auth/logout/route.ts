import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.destroy();

    const response = NextResponse.json({ ok: true, data: { message: 'Вы вышли из системы' } });
    // Принудительно стираем куку в браузере
    response.cookies.delete('gsk_session');
    
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}