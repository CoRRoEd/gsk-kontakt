import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { FileText, CreditCard, Bell, Calendar, Megaphone, ChevronRight, Wallet } from 'lucide-react';
import Link from 'next/link';

export default async function AppPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      owner: {
        include: {
          garages: { include: { garage: true } },
          charges: {
            where: { status: 'awaiting_payment' },
            orderBy: { period: 'desc' } // Сначала новые
          }
        },
      },
    },
  });

  if (!user) redirect('/login');

  const garages = user.owner?.garages || [];
  const unpaidCharges = user.owner?.charges || [];
  
  // Считаем общую сумму долга
  const totalDebt = unpaidCharges.reduce((acc, charge) => acc + Number(charge.amount), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Приветствие */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Здравствуйте, {user.fullName.split(' ')[1] || user.fullName}!
        </h1>
        <p className="text-slate-500 mt-2">
          Добро пожаловать в личный кабинет собственника.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Блок "К оплате" */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden max-w-xl">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm mb-1">Текущая задолженность за электроэнергию</p>
              <p className="text-4xl sm:text-5xl font-bold mb-6">
                {totalDebt.toLocaleString('ru-RU')} ₽
              </p>
              
              {/* Кнопки действий */}
              <div className="flex flex-wrap gap-3">
                <Link href="/app/charges" className="inline-block bg-white text-blue-700 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
                  История начислений
                </Link>
                
                {/* Кнопка "Оплатить" появляется только если есть долг */}
                {totalDebt > 0 && (
                  <Link href={unpaidCharges.length > 0 ? `/app/charges/${unpaidCharges[0].id}/pay` : '/app/charges'} className="inline-flex items-center gap-2 bg-blue-500 text-white border border-blue-400 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-400 transition shadow-sm">
                    <Wallet size={16} />
                    Оплатить
                  </Link>
                )}
              </div>
            </div>
            <CreditCard className="absolute -right-4 -bottom-4 text-blue-500/30 w-40 h-40" />
          </div>

          {/* Мои гаражи */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <img src="/garage-icon.png" alt="Гаражи" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Мои гаражи
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {garages.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-slate-500 text-sm text-center sm:col-span-2 flex flex-col items-center justify-center relative overflow-hidden">
                  <img src="/garage-icon.png" alt="" className="w-20 h-20 opacity-10 mb-3" />
                  <p className="relative z-10 font-medium">У вас пока нет привязанных гаражей.</p>
                  <p className="relative z-10 text-xs mt-1 text-slate-400">Обратитесь к председателю для добавления.</p>
                </div>
              ) : (
                garages.map((og) => (
                  <div key={og.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group">
                    
                    <img 
                      src="/garage-icon.png" 
                      alt="" 
                      className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none" 
                    />

                    <div className="relative z-10 flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Гараж</p>
                        <p className="text-xl font-bold text-slate-900">
                          Блок {og.garage.block} · Бокс {og.garage.number}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">
                        Активен
                      </span>
                    </div>
                    
                    <div className="relative z-10 mt-auto border-t border-slate-100 pt-4 flex gap-2">
                      <Link href="/app/readings" className="flex-1 bg-blue-50 text-blue-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                        Показания
                      </Link>
                      <button className="px-4 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition">
                        <FileText size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* СРЕДНЯЯ КОЛОНКА */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <Megaphone size={24} className="text-blue-500 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">Добро пожаловать!</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Теперь вы можете передавать показания ПУ, получать расчёт и квитанции об оплате онлайн в своём личном кабинете.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <Calendar size={24} className="text-amber-500 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">График работы</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              В праздничные дни прием Правления осуществляется по субботам с 10:00 до 14:00.
            </p>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bell size={22} className="text-slate-500" />
            События
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[400px] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center group">
              <div>
                <p className="font-medium text-slate-900 text-sm">Добро пожаловать!</p>
                <p className="text-xs text-slate-500 mt-1">Показания теперь онлайн.</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center group">
              <div>
                <p className="font-medium text-slate-900 text-sm">График Правления</p>
                <p className="text-xs text-slate-500 mt-1">В праздники — по субботам.</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center group">
              <div>
                <p className="font-medium text-slate-900 text-sm">Общее собрание</p>
                <p className="text-xs text-slate-500 mt-1">Состоится 15 ноября в 12:00.</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center group">
              <div>
                <p className="font-medium text-slate-900 text-sm">Плановые работы</p>
                <p className="text-xs text-slate-500 mt-1">Отключение света 20 октября.</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}