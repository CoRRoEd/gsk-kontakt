import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { Users, Warehouse, Banknote, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect('/admin/login');

  const roleLabels: Record<string, string> = {
    chairman: 'Председатель', accountant: 'Бухгалтер', admin: 'Администратор', moderator: 'Модератор', electrician: 'Электрик',
  };

  // 1. Получаем реальные данные из БД
  const totalGarages = await prisma.garage.count();
  const totalOwners = await prisma.owner.count();
  
  // Сумма всех неоплаченных начислений
  const debtAgg = await prisma.charge.aggregate({
    _sum: { amount: true },
    where: { status: 'awaiting_payment' }
  });
  const totalDebt = Number(debtAgg._sum.amount || 0);

  // Количество чеков, ожидающих проверки
  const pendingPaymentsCount = await prisma.payment.count({
    where: { status: 'pending' }
  });

  // Последние 5 событий (начислений)
  const recentCharges = await prisma.charge.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { owner: true, garage: true }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Шапка */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Сводка</h1>
        <p className="text-slate-500 mt-1">
          Добро пожаловать, {user.fullName} <span className="text-slate-400">({roleLabels[user.role] || user.role})</span>
        </p>
      </div>

      {/* Если есть чеки на проверку — показываем яркий алерт */}
      {pendingPaymentsCount > 0 && (
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
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <Warehouse size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Всего гаражей</p>
            <p className="text-3xl font-bold text-slate-900">{totalGarages}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-xl text-green-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Собственников</p>
            <p className="text-3xl font-bold text-slate-900">{totalOwners}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ожидают оплаты</p>
            <p className="text-3xl font-bold text-slate-900">{pendingPaymentsCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-rose-100 p-4 rounded-xl text-rose-600">
            <Banknote size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Общая задолженность</p>
            <p className="text-2xl font-bold text-slate-900">{totalDebt.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>
      </div>

      {/* Блок с последними событиями */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900">Последние начисления</h2>
          <Link href="/admin/charges" className="text-sm text-blue-600 hover:underline">Все начисления</Link>
        </div>
        
        <div className="space-y-4 text-sm text-slate-600">
          {recentCharges.length === 0 ? (
            <p className="text-center text-slate-400 py-4">Начислений пока нет.</p>
          ) : (
            recentCharges.map(charge => (
              <div key={charge.id} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <span className="font-semibold text-slate-900">{charge.owner.fullName}</span>
                  <span className="mx-2">·</span>
                  <span>Блок {charge.garage.block} · {charge.garage.number}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    charge.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {charge.status === 'paid' ? 'Оплачено' : 'Ожидает'}
                  </span>
                  <span className="font-bold text-slate-900 w-20 text-right">{Number(charge.amount).toFixed(0)} ₽</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}