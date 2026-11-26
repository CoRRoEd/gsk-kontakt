import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { Users, Warehouse, Banknote, AlertCircle, FileText, ArrowRight, TrendingUp, Gauge } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect('/admin/login');

  const roleLabels: Record<string, string> = {
    chairman: 'Председатель', accountant: 'Бухгалтер', admin: 'Администратор', moderator: 'Модератор', electrician: 'Электрик',
  };

  // Проверяем права на просмотр финансов
  const canSeeFinances = ['chairman', 'admin', 'accountant'].includes(user.role);

  // === СБОР РЕАЛЬНЫХ ДАННЫХ ===

  const totalGarages = await prisma.garage.count({ where: { status: 'active' } });
  
  // Данные по показаниям (нужны всем)
  const now = new Date();
  const currentPeriod = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const activeMeters = await prisma.meter.findMany({
    where: { status: 'active' },
    include: {
      garage: true,
      readings: { where: { period: currentPeriod } }
    }
  });
  const missingReadingsCount = activeMeters.filter(m => m.readings.length === 0).length;
  const recentMissing = activeMeters.filter(m => m.readings.length === 0).slice(0, 5);

  // === ФИНАНСОВЫЕ ДАННЫЕ (только для бухгалтера/председателя) ===
  let totalOwners = 0;
  let totalDebt = 0;
  let pendingPaymentsCount = 0;
  let topDebtors: any[] = [];
  let recentCharges: any[] = [];

  if (canSeeFinances) {
    totalOwners = await prisma.owner.count();
    
    const debtAgg = await prisma.charge.aggregate({
      _sum: { amount: true },
      where: { status: 'awaiting_payment' }
    });
    totalDebt = Number(debtAgg._sum.amount || 0);

    pendingPaymentsCount = await prisma.payment.count({ where: { status: 'pending' } });

    topDebtors = await prisma.garageBalance.findMany({
      where: { debtAmount: { gt: 0 } },
      orderBy: { debtAmount: 'desc' },
      take: 5,
      include: { garage: { include: { owners: { where: { endedAt: null }, include: { owner: true } } } } }
    });

    recentCharges = await prisma.charge.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { owner: true, garage: true }
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Шапка */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Сводка</h1>
        <p className="text-slate-500 mt-1">
          Добро пожаловать, {user.fullName} <span className="text-slate-400">({roleLabels[user.role] || user.role})</span>
        </p>
      </div>

      {/* Алерт о непроверенных чеках (только для тех, кто видит финансы) */}
      {canSeeFinances && pendingPaymentsCount > 0 && (
        <Link href="/admin/payments" className="block bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between hover:bg-blue-100 transition group">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-full">
              <FileText size={20} />
            </div>
            <div>
              <p className="font-bold text-blue-900">Есть новые заявки на оплату</p>
              <p className="text-sm text-blue-700">Собственники прислали чеки, ожидающие вашей проверки.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            Проверить ({pendingPaymentsCount})
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><Warehouse size={28} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Активных гаражей</p>
            <p className="text-3xl font-bold text-slate-900">{totalGarages}</p>
          </div>
        </div>

        {canSeeFinances && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-xl text-green-600"><Users size={28} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Собственников</p>
              <p className="text-3xl font-bold text-slate-900">{totalOwners}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600"><Gauge size={28} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Не сдали показания</p>
            <p className="text-3xl font-bold text-slate-900">{missingReadingsCount}</p>
          </div>
        </div>

        {canSeeFinances && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-rose-100 p-4 rounded-xl text-rose-600"><Banknote size={28} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Общая задолженность</p>
              <p className="text-2xl font-bold text-slate-900">{totalDebt.toLocaleString('ru-RU')} ₽</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ должников (только для финансов) */}
        {canSeeFinances && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-rose-500" />
                Топ-5 должников
              </h2>
              <Link href="/admin/charges" className="text-sm text-blue-600 hover:underline">Все долги</Link>
            </div>
            
            <div className="space-y-4 text-sm">
              {topDebtors.length === 0 ? (
                <p className="text-center text-slate-400 py-4">Отлично! Долгов нет.</p>
              ) : (
                topDebtors.map((item, index) => (
                  <div key={item.garageId} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                      <div>
                        <p className="font-semibold text-slate-900">{item.garage.owners[0]?.owner.fullName || 'Не привязан'}</p>
                        <p className="text-xs text-slate-500">Ряд {item.garage.row} · Блок {item.garage.block} · Бокс {item.garage.number}</p>
                      </div>
                    </div>
                    <span className="font-bold text-rose-600">{Number(item.debtAmount).toLocaleString('ru-RU')} ₽</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Не сдали показания (видят все) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              Нет показаний за месяц
            </h2>
            <Link href="/admin/meters" className="text-sm text-blue-600 hover:underline">Все ПУ</Link>
          </div>
          
          <div className="space-y-4 text-sm">
            {recentMissing.length === 0 ? (
              <p className="text-center text-slate-400 py-4">Все сдали показания! Молодцы.</p>
            ) : (
              recentMissing.map((meter) => (
                <div key={meter.id} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-900">Бокс {meter.garage.number}</p>
                    <p className="text-xs text-slate-500">Ряд {meter.garage.row} · Счётчик №{meter.serialNumber}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium">Ожидает</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Последние начисления (только для финансов) */}
      {canSeeFinances && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Последние операции</h2>
          <div className="space-y-4 text-sm text-slate-600">
            {recentCharges.length === 0 ? (
              <p className="text-center text-slate-400 py-2">Операций пока нет.</p>
            ) : (
              recentCharges.map(charge => (
                <div key={charge.id} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-slate-900">{charge.owner.fullName}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>Начисление: Ряд {charge.garage.row} · Блок {charge.garage.block} · Бокс {charge.garage.number}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      charge.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {charge.status === 'paid' ? 'Оплачено' : 'Ожидает'}
                    </span>
                    <span className="font-bold text-slate-900 w-20 text-right">{Number(charge.amount).toFixed(2)} ₽</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}