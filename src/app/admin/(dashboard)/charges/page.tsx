import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import GenerateButton from './GenerateButton';
import ManualChargeButton from './ManualChargeButton';
import AdjustChargeButton from './AdjustChargeButton';

export default async function ChargesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  // Получаем начисления с привязкой к собственнику и гаражу
  const charges = await prisma.charge.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: true,
      garage: true,
    }
  });

  // Считаем общую сумму выставленных счетов
  const totalAmount = charges.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Шапка страницы */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Начисления</h1>
          <p className="text-sm text-slate-500 mt-1">
            Сформировано записей: {charges.length} | На общую сумму: <span className="font-bold text-slate-800">{totalAmount.toLocaleString('ru-RU')} ₽</span>
          </p>
        </div>
        
        {/* Кнопки действий */}
        <div className="flex flex-wrap items-center gap-3">
          <ManualChargeButton />
          <GenerateButton />
        </div>
      </div>

      {/* Таблица начислений */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Период</th>
              <th className="p-4 font-medium">Гараж</th>
              <th className="p-4 font-medium">Собственник</th>
              <th className="p-4 font-medium">Расход (кВт·ч)</th>
              <th className="p-4 font-medium">Сумма</th>
              <th className="p-4 font-medium">Статус</th>
              <th className="p-4 font-medium text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {charges.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Начислений пока нет. Нажмите «Сформировать начисления» или «Выставить взнос».
                </td>
              </tr>
            ) : (
              charges.map((charge) => (
                <tr key={charge.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600 whitespace-nowrap">
                    {charge.period.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="p-4 font-medium text-slate-900 whitespace-nowrap">
                    Ряд {charge.garage.row} · Блок {charge.garage.block} · Бокс {charge.garage.number}
                  </td>
                  <td className="p-4 text-slate-600">
                    {charge.owner.fullName}
                  </td>
                  <td className="p-4 text-slate-600">
                    {Number(charge.consumptionT1)} 
                    {charge.consumptionT2 ? ` / ${Number(charge.consumptionT2)}` : ''}
                  </td>
                  <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                    {Number(charge.amount).toFixed(2)} ₽
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      charge.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      charge.status === 'awaiting_payment' ? 'bg-amber-100 text-amber-800' : 
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {charge.status === 'awaiting_payment' ? 'Ожидает оплаты' : 
                       charge.status === 'paid' ? 'Оплачено' : 
                       charge.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {/* Кнопка корректировки доступна только для неоплаченных счетов */}
                    {charge.status === 'awaiting_payment' && (
                      <AdjustChargeButton chargeId={charge.id} amount={Number(charge.amount)} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}