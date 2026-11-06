import Link from 'next/link';
import { LayoutDashboard, Users, Warehouse, Gauge, Download, Settings, LogOut, Coins, Receipt, Wallet, FileSpreadsheet } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-white tracking-wide whitespace-nowrap">ГСК «Контакт»</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider whitespace-nowrap">Панель управления</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
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
          
          {/* Иконка Download теперь на своем месте */}
          <Link href="/admin/import" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
            <Download size={20} className="shrink-0" />
            <span className="font-medium">Импорт данных</span>
          </Link>
          
          <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
            <Wallet size={20} className="shrink-0" />
            <span className="font-medium">Заявки на оплату</span>
          </Link>

          {/* Новый раздел для ФинАдмина */}
          <Link href="/admin/export" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
            <FileSpreadsheet size={20} className="shrink-0" />
            <span className="font-medium">Экспорт для 1С</span>
          </Link>
          
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors w-full whitespace-nowrap">
            <Settings size={20} className="shrink-0" />
            <span className="font-medium">Настройки</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <form action="/api/admin/auth/logout" method="POST">
            <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors whitespace-nowrap">
              <LogOut size={20} className="shrink-0" />
              <span className="font-medium">Выйти</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}