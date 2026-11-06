import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId?: string;
  role?: 'owner' | 'accountant' | 'chairman' | 'admin' | 'moderator' | 'electrician';
  phone?: string;
  // Для промежуточных шагов входа персонала
  loginStep?: 'phone' | 'password' | 'code';
  tempPhone?: string;
  tempUserId?: string;
}

// Проверка: SESSION_SECRET должен быть задан
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error(
    'SESSION_SECRET must be set in .env and be at least 32 characters long'
  );
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'gsk_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  },
};