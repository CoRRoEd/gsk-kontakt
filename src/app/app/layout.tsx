import Link from 'next/link';
import { Phone, Bell } from 'lucide-react'; // Добавили Bell
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { prisma } from '@/lib/db'; // Добавили prisma
import LogoutButton from './LogoutButton';
import AppLogoLink from './AppLogoLink';
import IdleTimer from '@/components/IdleTimer';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  if (!session.userId) {
    redirect('/login');
  }

  // Проверяем, есть ли непрочитанные ответы от Председателя
  const unreadAppealsCount = await prisma.appeal.count({
    where: { 
      userId: session.userId, 
      isReadByOwner: false 
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Левая часть: Логотип и мобильный телефон */}
          <div className="flex items-center gap-3 shrink-0">
            <AppLogoLink />

            <a 
              href="tel:+79007654321" 
              className="lg:hidden flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0"
            >
              <Phone size={16} className="text-slate-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-medium leading-none mb-0.5">Председатель</span>
                <span className="text-xs sm:text-sm font-semibold leading-none">+7 900 765-43-21</span>
              </div>
            </a>
          </div>
          
          {/* Блок с телефонами для десктопа */}
          <div className="hidden lg:flex items-center gap-6 text-sm text-slate-600 flex-1 justify-start pl-4 border-l border-slate-200">
            <a href="tel:+79007654321" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Phone size={14} className="text-slate-400" />
              <span>Председатель: <span className="font-medium text-slate-900">+7 (900) 765-43-21</span></span>
            </a>
            <a href="tel:+79007654322" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Phone size={14} className="text-slate-400" />
              <span>Бухгалтерия: <span className="font-medium text-slate-900">+7 (900) 765-43-22</span></span>
            </a>
          </div>
          
          {/* Правая часть: Навигация и кнопка выхода */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/documents" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition hidden md:block">
              Документы
            </Link>
            
            {/* Кнопка Обращения с колокольчиком */}
            <Link href="/app/appeals" className="relative flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Обращения
              {unreadAppealsCount > 0 && (
                <span className="relative flex h-5 w-5 items-center justify-center">
                  {/* Анимация пульсации для привлечения внимания */}
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <Bell size={18} className="relative text-red-500 animate-bounce" />
                </span>
              )}
            </Link>
            
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <IdleTimer logoutUrl="/api/app/auth/logout" />
    </div>
  );
}