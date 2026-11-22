import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { CreditCard, Bell, Calendar, Megaphone, ChevronRight, Wallet, CheckCircle2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import RequestInvoiceButton from './RequestInvoiceButton';

export default async function AppPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      owner: {
        include: {
          garages: { 
            include: { 
              garage: { 
                include: { 
                  meters: { 
                    include: { 
                      readings: { 
                        orderBy: { period: 'desc' }, 
                        take: 1 
                      } 
                    } 
                  } 
                } 
              } 
            } 
          },
          charges: {
            where: { status: 'awaiting_payment' },
            orderBy: { period: 'desc' }
          }
        },
      },
    },
  });

  if (!user) redirect('/login');

  const garages = user.owner?.garages || [];
  const unpaidCharges = user.owner?.charges || [];
  
  // Общая сумма долга
  const totalDebt = unpaidCharges.reduce((acc, charge) => acc + Number(charge.amount), 0) || 0;
  const now = new Date();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Здравствуйте, {user.fullName.split(' ')[1] || user.fullName}!
        </h1>
        <p className="text-slate-500 mt-2">
          Добро пожаловать в личный кабинет собственника.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Синяя карточка "К оплате" */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden max-w-md">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm mb-1">Текущая задолженность за электроэнергию</p>
              <p className="text-4xl sm:text-5xl font-bold mb-6">
                {totalDebt.toLocaleString('ru-RU')} ₽
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/app/charges" className="inline-block bg-white text-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
                  История
                </Link>
                
                {/* ВОТ ЗДЕСЬ ИСПРАВЛЕНА ССЫЛКА НА pay-all */}
                {totalDebt > 0 && (
                  <Link href="/app/charges/pay-all" className="inline-flex items-center gap-2 bg-blue-500/50 text-white border border-blue-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500 transition shadow-sm">
                    <Wallet size={16} />
                    Оплатить всё
                  </Link>
                )}
              </div>
            </div>
            <CreditCard className="absolute -right-4 -bottom-4 text-blue-500/30 w-32 h-32 pointer-events-none" />
          </div>

          {/* Мои гаражи */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                <img src="/garage-icon.png" alt="Гаражи" className="w-8 h-8 object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Мои гаражи
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {garages.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-slate-500 text-sm text-center flex flex-col items-center justify-center relative overflow-hidden">
                  <img src="/garage-icon.png" alt="" className="w-20 h-20 opacity-10 mb-3" />
                  <p className="relative z-10 font-medium">У вас пока нет привязанных гаражей.</p>
                </div>
              ) : (
                garages.map((og) => {
                  const latestReading = og.garage.meters?.[0]?.readings?.[0];
                  const isSubmittedThisMonth = latestReading && 
                    latestReading.period.getMonth() === now.getMonth() && 
                    latestReading.period.getFullYear() === now.getFullYear();

                  // Ищем неоплаченный счет конкретно для ЭТОГО гаража
                  const garageCharge = unpaidCharges.find(c => c.garageId === og.garage.id);

                  return (
                    <div key={og.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group">
                      
                      <img 
                        src="/garage-icon.png" 
                        alt="" 
                        className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none" 
                      />

                      <div className="relative z-10 flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Гараж</p>
                          <p className="text-xl sm:text-2xl font-bold text-slate-900">
                            Ряд {og.garage.row} · Блок {og.garage.block} · Бокс {og.garage.number}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-md font-medium">
                          Активен
                        </span>
                      </div>
                      
                      <div className="relative z-10 mt-auto border-t border-slate-100 pt-4 flex flex-col gap-2">
                        
                        {isSubmittedThisMonth ? (
                          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2.5 rounded-lg border border-green-100 mb-1">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <span className="font-medium">
                              Показания переданы ({latestReading.submittedAt.toLocaleDateString('ru-RU')})
                            </span>
                          </div>
                        ) : (
                          <Link href="/app/readings" className="w-full bg-slate-50 text-slate-700 text-center py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition border border-slate-200">
                            Передать показания
                          </Link>
                        )}

                        {/* Умная кнопка: для конкретного гаража */}
                        {isSubmittedThisMonth || garageCharge ? (
                          <RequestInvoiceButton 
                            garageId={og.garage.id} 
                            activeChargeId={garageCharge ? garageCharge.id : null} 
                          />
                        ) : (
                          <button disabled className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-400 py-2.5 rounded-lg text-sm font-medium border border-slate-100 cursor-not-allowed">
                            Нет данных для счёта
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* СРЕДНЯЯ КОЛОНКА */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-full flex flex-col">
            <Megaphone size={28} className="text-blue-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Внимание всем!</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
              Теперь вы можете передавать показания ПУ, получать расчёт и квитанции об оплате онлайн в своём личном кабинете.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-auto">
              <p className="text-sm font-semibold text-blue-900 mb-3">
                Как это сделать? Смотрите инструкцию:
              </p>
              <Link 
                href="/app/help" 
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
              >
                <PlayCircle size={20} />
                Смотреть видеоуроки
              </Link>
            </div>
            
            <div className="h-px w-full bg-slate-100 my-6"></div>
            
            <Calendar size={28} className="text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">График работы</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              В праздничные дни прием Правления осуществляется по субботам с 10:00 до 14:00.
            </p>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-slate-500" />
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
          </div>
        </div>

      </div>
    </div>
  );
}