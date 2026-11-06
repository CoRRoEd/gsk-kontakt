import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import GenerateButton from './GenerateButton';

export default async function ChargesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const charges = await prisma.charge.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: true,
      garage: true,
    }
  });

  const totalDebt = charges.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Начисления</h1>
          <p className="text-sm text-slate-500 mt-1">
            Сформировано записей: {charges.length} | На общую сумму: <span className="font-bold text-slate-800">{totalDebt.toLocaleString('ru-RU')} ₽</span>
          </p>
        </div>
        <GenerateButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Период</th>
              <th className="p-4 font-medium">Гараж</th>
              <th className="p-4 font-medium">Собственник</th>
              <th className="p-4 font-medium">Расход (кВт·ч)</th>
              <th className="p-4 font-medium">Сумма</th>
              <th className="p-4 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {charges.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Начислений пока нет. Нажмите «Сформировать начисления».
                </td>
              </tr>
            ) : (
              charges.map((charge) => (
                <tr key={charge.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">
                    {charge.period.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="p-4 font-medium text-slate-900">
                    Блок {charge.garage.block} · Бокс {charge.garage.number}
                  </td>
                  <td className="p-4 text-slate-600">{charge.owner.fullName}</td>
                  <td className="p-4 text-slate-600">
                    {Number(charge.consumptionT1)} 
                    {charge.consumptionT2 ? ` / ${Number(charge.consumptionT2)}` : ''}
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {Number(charge.amount).toFixed(2)} ₽
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {charge.status === 'awaiting_payment' ? 'Ожидает оплаты' : charge.status}
                    </span>
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