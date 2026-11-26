import Link from 'next/link';
import { 
  LayoutDashboard, Users, Warehouse, Gauge, Upload, Settings, 
  Coins, Receipt, Wallet, FileSpreadsheet, Download, Megaphone,
  FileText, ShieldAlert 
} from 'lucide-react';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import AdminLogoLink from './AdminLogoLink';
import AdminLogoutButton from './AdminLogoutButton';
import NotificationBell from './NotificationBell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  // СТРОГАЯ ПРОВЕРКА: пускаем в админку только персонал
  const staffRoles = ['accountant', 'chairman', 'admin', 'moderator', 'electrician'];
  
  if (!session.userId || !session.role || !staffRoles.includes(session.role)) {
    redirect('/admin/login');
  }

  // Определяем права доступа
  const isManagement = ['chairman', 'admin'].includes(session.role); // Председатель и Админ
  const isAccountant = session.role === 'accountant';
  const isElectrician = session.role === 'electrician';
  const isModerator = session.role === 'moderator';

  // Загружаем уведомления для Председателя и Админа
  let notifications: any[] = [];
  if (isManagement && session.userId) {
    const dbNotifs = await prisma.notification.findMany({
      where: { userId: session.userId, status: 'queued' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Маппим под формат клиентского компонента NotificationBell
    notifications = dbNotifs.map(n => {
      const payload = n.payload as any;
      return {
        id: n.id,
        title: payload?.title || 'Системное уведомление',
        message: payload?.message || 'Требуется ваше внимание',
        url: payload?.url || '/admin'
      };
    });
  }

  // Общие пункты, которые видят все
  const commonLinks = (
    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
      <LayoutDashboard size={20} className="shrink-0" />
      <span className="font-medium">Сводка</span>
    </Link>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      {/* БОКОВОЕ МЕНЮ */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 shrink-0">
        <AdminLogoLink />
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          
          {commonLinks}

          {/* МЕНЮ ПРЕДСЕДАТЕЛЯ И АДМИНА */}
          {isManagement && (
            <>
              <Link href="/admin/owners" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Users size={20} className="shrink-0" /><span className="font-medium">Собственники</span>
              </Link>
              <Link href="/admin/garages" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Warehouse size={20} className="shrink-0" /><span className="font-medium">Гаражи</span>
              </Link>
              <Link href="/admin/meters" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Gauge size={20} className="shrink-0" /><span className="font-medium">Приборы учёта</span>
              </Link>
              <Link href="/admin/tariffs" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Coins size={20} className="shrink-0" /><span className="font-medium">Тарифы</span>
              </Link>
              <Link href="/admin/charges" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Receipt size={20} className="shrink-0" /><span className="font-medium">Начисления</span>
              </Link>
              <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Wallet size={20} className="shrink-0" /><span className="font-medium">Заявки на оплату</span>
              </Link>

              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Работа с людьми</p>
              </div>
              <Link href="/admin/appeals" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <FileText size={20} className="shrink-0" /><span className="font-medium">Обращения</span>
              </Link>
              <Link href="/admin/problems" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <ShieldAlert size={20} className="shrink-0" /><span className="font-medium">Журнал нарушений</span>
              </Link>
              <Link href="/admin/news" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Megaphone size={20} className="shrink-0" /><span className="font-medium">Новости</span>
              </Link>

              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Обмен с 1С</p>
              </div>
              <Link href="/admin/import" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Download size={20} className="shrink-0" /><span className="font-medium">Импорт данных</span>
              </Link>
              <Link href="/admin/export" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <FileSpreadsheet size={20} className="shrink-0" /><span className="font-medium">Экспорт для 1С</span>
              </Link>

              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Система</p>
              </div>
              <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Settings size={20} className="shrink-0" /><span className="font-medium">Настройки</span>
              </Link>
            </>
          )}

          {/* МЕНЮ БУХГАЛТЕРА */}
          {isAccountant && (
            <>
              <Link href="/admin/tariffs" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Coins size={20} className="shrink-0" /><span className="font-medium">Тарифы</span>
              </Link>
              <Link href="/admin/charges" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Receipt size={20} className="shrink-0" /><span className="font-medium">Начисления</span>
              </Link>
              <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Wallet size={20} className="shrink-0" /><span className="font-medium">Заявки на оплату</span>
              </Link>
            </>
          )}

          {/* МЕНЮ ЭЛЕКТРИКА */}
          {isElectrician && (
            <>
              <Link href="/admin/garages" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Warehouse size={20} className="shrink-0" /><span className="font-medium">Гаражи</span>
              </Link>
              <Link href="/admin/meters" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Gauge size={20} className="shrink-0" /><span className="font-medium">Приборы учёта</span>
              </Link>
              <Link href="/admin/appeals" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <FileText size={20} className="shrink-0" /><span className="font-medium">Заявки на ПУ</span>
              </Link>
            </>
          )}

          {/* МЕНЮ МОДЕРАТОРА */}
          {isModerator && (
            <>
              <Link href="/admin/owners" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Users size={20} className="shrink-0" /><span className="font-medium">Собственники</span>
              </Link>
              <Link href="/admin/news" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
                <Megaphone size={20} className="shrink-0" /><span className="font-medium">Новости</span>
              </Link>
            </>
          )}

        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <AdminLogoutButton />
        </div>
      </aside>

      {/* ОСНОВНАЯ ЧАСТЬ (ШАПКА + КОНТЕНТ) */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* ВЕРХНЯЯ ПАНЕЛЬ (ШАПКА) */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="text-slate-500 font-medium">
            Панель управления ГСК
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-bold text-slate-900">
                {session.role === 'chairman' ? 'Председатель' : 
                 session.role === 'accountant' ? 'Бухгалтер' : 
                 session.role === 'electrician' ? 'Электрик' : 
                 session.role === 'moderator' ? 'Модератор' : 'Администратор'}
              </p>
              <p className="text-xs text-slate-500">{session.phone}</p>
            </div>
            
            {/* КОЛОКОЛЬЧИК (только для Председателя и Админа) */}
            {isManagement && (
              <NotificationBell notifications={notifications} />
            )}
          </div>
        </header>

        {/* КОНТЕНТ СТРАНИЦЫ */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}