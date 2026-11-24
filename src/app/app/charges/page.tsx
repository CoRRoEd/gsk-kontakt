import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, Receipt, CheckCircle2, Clock, Printer, Wallet } from 'lucide-react';
import Link from 'next/link';

export default async function AppChargesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const owner = await prisma.owner.findUnique({
    where: { userId: session.userId },
    include: {
      charges: {
        orderBy: { period: 'desc' },
        include: { garage: true }
      }
    }
  });

  if (!owner) redirect('/login');

  const charges = owner.charges || [];

  // Словарь для красивых названий услуг
  const serviceNames: Record<string, string> = {
    electricity: 'Электроэнергия',
    membership_fee: 'Членский взнос',
    targeted_fee: 'Целевой взнос',
    maintenance_fee: 'Содержание и ремонт',
    penalty: 'Пени / Штраф',
    debt_carryover: 'Старый долг'
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} />
          Назад в кабинет
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">История начислений</h1>
      </div>

      <div className="space-y-4">
        {charges.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            <Receipt size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">У вас пока нет начислений.</p>
          </div>
        ) : (
          charges.map((charge) => {
            const serviceName = serviceNames[charge.paymentType] || 'Услуги ГСК';
            const isElectricity = charge.paymentType === 'electricity';

            return (
              <div key={charge.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
                
                {/* Левая часть: Информация */}
                <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-lg ${isElectricity ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Receipt size={20} />
                    </div>
                    <div>
                      {/* ВЫВОДИМ НАЗВАНИЕ УСЛУГИ КРУПНО */}
                      <h3 className="font-bold text-slate-900 text-lg">
                        {serviceName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Период: {charge.period.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })} · Гараж: Ряд {charge.garage.row} · Бокс {charge.garage.number}
                      </p>
                    </div>
                  </div>

                  {/* Блок с деталями (Показываем только если это свет) */}
                  {isElectricity ? (
                    <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-3 rounded-xl">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Расход</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {Number(charge.consumptionT1)} кВт·ч
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Тариф</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {Number(charge.tariffT1)} ₽/кВт·ч
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 bg-slate-50 p-3 rounded-xl text-xs text-slate-500">
                      Начисление за услуги кооператива (расход электроэнергии не учитывается).
                    </div>
                  )}
                </div>

                {/* Правая часть: Сумма и Действия */}
                <div className="p-6 sm:w-64 flex flex-col justify-center items-start sm:items-end bg-slate-50/50">
                  <p className="text-sm text-slate-500 mb-1">К оплате</p>
                  <p className="text-3xl font-bold text-slate-900 mb-3">
                    {Number(charge.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                  </p>
                  
                  {charge.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 w-full sm:w-auto justify-center">
                      <CheckCircle2 size={14} />
                      Оплачено
                    </span>
                  ) : (
                    <div className="w-full flex flex-col gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-full sm:w-auto justify-center">
                        <Clock size={14} />
                        Ожидает оплаты
                      </span>
                      
                      <div className="flex gap-2 mt-1 w-full">
                        <a 
                          href={`/api/app/charges/${charge.id}/bill`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                          title="Скачать квитанцию"
                        >
                          <Printer size={16} />
                          <span className="hidden sm:inline">Квитанция</span>
                        </a>

                        <Link 
                          href={`/app/charges/${charge.id}/pay`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                          <Wallet size={16} />
                          Оплатить
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}