import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLoginPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  // СПАСИТЕЛЬНЫЙ КРУГ: 
  // Если зашел персонал (Председатель, Бухгалтер и т.д.) — отправляем в /admin.
  // Если зашел СОБСТВЕННИК (owner), мы НЕ делаем редирект, 
  // а даем ему увидеть форму, чтобы он мог войти как Админ.
  const staffRoles = ['accountant', 'chairman', 'admin', 'moderator', 'electrician'];
  
  if (session.userId && session.role && staffRoles.includes(session.role)) {
    redirect('/admin');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <p className="text-gray-500 text-sm mt-1">ГСК «Контакт»</p>
        </div>

        {/* Вставляем нашу клиентскую форму */}
        <AdminLoginForm />

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← На главную</a>
        </div>
      </div>
    </main>
  );
}