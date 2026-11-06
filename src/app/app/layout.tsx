import Link from 'next/link';
import { Home } from 'lucide-react';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import LogoutButton from './LogoutButton'; // <-- Импортируем новую кнопку

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  if (!session.userId) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            <Home size={24} />
            <span>ГСК «Контакт»</span>
          </Link>
          
          {/* Заменили форму на умную кнопку */}
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}