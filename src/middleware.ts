import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. САМОЕ ВАЖНОЕ: Всегда пропускаем страницы входа без проверок!
  // Это разрывает любой цикл редиректов.
  if (pathname === '/login' || pathname === '/admin/login') {
    return response;
  }

  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  const isLoggedIn = !!session.userId;
  const isOwner = session.role === 'owner';
  const staffRoles = ['accountant', 'chairman', 'admin', 'moderator', 'electrician']; 
  // ИСПРАВЛЕНО: Добавили проверку роли
  const isStaff = session.role ? staffRoles.includes(session.role) : false;

  // 2. Если пользователь НЕ авторизован (выкидываем на вход)
  if (!isLoggedIn) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (pathname.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/documents') || pathname.startsWith('/news')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Если пользователь АВТОРИЗОВАН (разграничиваем права)
  if (isLoggedIn) {
    // Защита Админки от собственников
    if (pathname.startsWith('/admin') && !isStaff) {
      return NextResponse.redirect(new URL('/app', request.url));
    }

    // Защита Кабинета от сотрудников (чтобы они не заходили в /app со своей ролью)
    if (pathname.startsWith('/app') && !isOwner) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/app/:path*', 
    '/admin/:path*', 
    '/login', 
    '/admin/login', 
    '/documents/:path*', 
    '/news/:path*'
  ],
};