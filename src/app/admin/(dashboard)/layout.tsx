import Link from 'next/link';
import { LayoutDashboard, Users, Warehouse, Gauge, Upload, Settings, LogOut, Coins, Receipt, Wallet, FileSpreadsheet, Download } from 'lucide-react';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import AdminLogoLink from './AdminLogoLink';
import AdminLogoutButton from './AdminLogoutButton'; // <-- Наша новая умная кнопка выхода

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  // СТРОГАЯ ПРОВЕРКА: пускаем в админку только персонал, а не собственников
  const staffRoles = ['accountant', 'chairman', 'admin', 'moderator', 'electrician'];
  
  if (!session.userId || !session.role || !staffRoles.includes(session.role)) {
    redirect('/admin/login');
  }

  // Проверяем, является ли пользователь бухгалтером (ФинАдмином)
  const isAccountant = session.role === 'accountant';

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 shrink-0">
        
        {/* Безопасный логотип (разрывает сессию и ведет на /) */}
        <AdminLogoLink />
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          
          {isAccountant ? (
            /* МЕНЮ ДЛЯ БУХГАЛТЕРА (ФинАдмина) - 4 кнопки */
            <>
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <LayoutDashboard size={20} className="shrink-0" />
                <span className="font-medium">Сводка</span>
              </Link>
              <Link href="/admin/tariffs" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Coins size={20} className="shrink-0" />
                <span className="font-medium">Тарифы</span>
              </Link>
              <Link href="/admin/charges" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Receipt size={20} className="shrink-0" />
                <span className="font-medium">Начисления</span>
              </Link>
              <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Wallet size={20} className="shrink-0" />
                <span className="font-medium">Заявки на оплату</span>
              </Link>
            </>
          ) : (
            /* ПОЛНОЕ МЕНЮ ДЛЯ ПРЕДСЕДАТЕЛЯ / АДМИНА */
            <>
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <LayoutDashboard size={20} className="shrink-0" />
                <span className="font-medium">Сводка</span>
              </Link>
              <Link href="/admin/owners" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Users size={20} className="shrink-0" />
                <span className="font-medium">Собственники</span>
              </Link>
              <Link href="/admin/garages" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Warehouse size={20} className="shrink-0" />
                <span className="font-medium">Гаражи</span>
              </Link>
              <Link href="/admin/meters" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Gauge size={20} className="shrink-0" />
                <span className="font-medium">Приборы учёта</span>
              </Link>
              <Link href="/admin/tariffs" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Coins size={20} className="shrink-0" />
                <span className="font-medium">Тарифы</span>
              </Link>
              <Link href="/admin/charges" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Receipt size={20} className="shrink-0" />
                <span className="font-medium">Начисления</span>
              </Link>
              <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Wallet size={20} className="shrink-0" />
                <span className="font-medium">Заявки на оплату</span>
              </Link>
              
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Обмен с 1С</p>
              </div>
              
              <Link href="/admin/import" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Download size={20} className="shrink-0" />
                <span className="font-medium">Импорт данных</span>
              </Link>
              <Link href="/admin/export" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <FileSpreadsheet size={20} className="shrink-0" />
                <span className="font-medium">Экспорт для 1С</span>
              </Link>

              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Система</p>
              </div>

              <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Settings size={20} className="shrink-0" />
                <span className="font-medium">Настройки</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          {/* Умная кнопка выхода */}
          <AdminLogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}