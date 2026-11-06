import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, Receipt, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function ChargesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  // Получаем собственника со всеми его начислениями, сортируем по дате (сначала новые)
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Шапка */}
      <div className="mb-8">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} />
          Назад в кабинет
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">История начислений</h1>
        <p className="text-slate-500 mt-2">
          Здесь отображаются все ваши счета за электроэнергию.
        </p>
      </div>

      {/* Список начислений */}
      <div className="space-y-4">
        {charges.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            <Receipt size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">У вас пока нет начислений.</p>
            <p className="text-sm text-slate-400 mt-1">Передайте показания, чтобы система рассчитала расход.</p>
          </div>
        ) : (
          charges.map((charge) => (
            <div key={charge.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
              
              {/* Левая часть: Информация */}
              <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {charge.period.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Гараж: Блок {charge.garage.block} · Бокс {charge.garage.number}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-3 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Расход</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {Number(charge.consumptionT1)} кВт·ч
                      {charge.consumptionT2 ? ` / ${Number(charge.consumptionT2)} кВт·ч` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Тариф</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {Number(charge.tariffT1)} ₽/кВт·ч
                      {charge.tariffT2 ? ` / ${Number(charge.tariffT2)} ₽` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Правая часть: Сумма и Статус */}
              <div className="p-6 sm:w-64 flex flex-col justify-center items-start sm:items-end bg-slate-50/50">
                <p className="text-sm text-slate-500 mb-1">К оплате</p>
                <p className="text-3xl font-bold text-slate-900 mb-3">
                  {Number(charge.amount).toLocaleString('ru-RU')} ₽
                </p>
                
                {charge.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 w-full sm:w-auto justify-center">
                    <CheckCircle2 size={14} />
                    Оплачено
                  </span>
                                ) : (
                  <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-full sm:w-auto justify-center">
                      <Clock size={14} />
                      Ожидает оплаты
                    </span>
                    
                    {/* ВОТ ЗДЕСЬ МЕНЯЕМ КНОПКУ НА ССЫЛКУ */}
                    <Link 
                      href={`/app/charges/${charge.id}/pay`} 
                      className="mt-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition text-center inline-block"
                    >
                      Оплатить
                    </Link>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}