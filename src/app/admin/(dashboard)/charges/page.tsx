import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import GenerateButton from './GenerateButton';
import ManualChargeButton from './ManualChargeButton';
import AdminChargeActions from './AdminChargeActions';
import { Search } from 'lucide-react';

export default async function ChargesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ search?: string }> 
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.search || '';

  let whereClause: any = {};
  if (searchQuery) {
    whereClause = {
      OR: [
        { owner: { fullName: { contains: searchQuery, mode: 'insensitive' } } },
        { garage: { row: { contains: searchQuery, mode: 'insensitive' } } },
        { garage: { block: { contains: searchQuery, mode: 'insensitive' } } },
        ...(isNaN(Number(searchQuery)) ? [] : [{ garage: { number: Number(searchQuery) } }])
      ]
    };
  }

  const charges = await prisma.charge.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { owner: true, garage: true }
  });

  // ПРЕОБРАЗУЕМ Decimal и Date в безопасные типы для клиента
  const safeCharges = charges.map(c => ({
    id: c.id,
    period: c.period.toISOString(), 
    amount: Number(c.amount),
    consumptionT1: Number(c.consumptionT1),
    consumptionT2: c.consumptionT2 ? Number(c.consumptionT2) : null,
    status: c.status,
    paymentType: c.paymentType, // <-- ДОБАВИЛИ ЭТУ СТРОКУ!
    owner: { fullName: c.owner.fullName },
    garage: { row: c.garage.row, block: c.garage.block, number: c.garage.number }
  }));

  const totalAmount = safeCharges.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Начисления</h1>
          <p className="text-sm text-slate-500 mt-1">
            Найдено записей: {safeCharges.length} | На общую сумму: <span className="font-bold text-slate-800">{totalAmount.toLocaleString('ru-RU')} ₽</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <form className="relative">
            <input 
              type="text" 
              name="search" 
              defaultValue={searchQuery}
              placeholder="Поиск: ФИО, ряд, бокс..." 
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </form>
          
          <ManualChargeButton />
          <GenerateButton />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Период</th>
              <th className="p-4 font-medium">Гараж</th>
              <th className="p-4 font-medium">Собственник</th>
              <th className="p-4 font-medium">Расход</th>
              <th className="p-4 font-medium">Сумма</th>
              <th className="p-4 font-medium">Статус</th>
              <th className="p-4 font-medium text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {safeCharges.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  По вашему запросу ничего не найдено.
                </td>
              </tr>
            ) : (
              safeCharges.map((charge) => (
                <tr key={charge.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600 whitespace-nowrap">
                    {new Date(charge.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="p-4 font-medium text-slate-900 whitespace-nowrap">
                    Ряд {charge.garage.row} · Блок {charge.garage.block} · Бокс {charge.garage.number}
                  </td>
                  <td className="p-4 text-slate-600">{charge.owner.fullName}</td>
                  <td className="p-4 text-slate-600">
                    {charge.consumptionT1} {charge.consumptionT2 ? ` / ${charge.consumptionT2}` : ''}
                  </td>
                  <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                    {charge.amount.toFixed(2)} ₽
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      charge.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {charge.status === 'awaiting_payment' ? 'Ожидает оплаты' : 'Оплачено'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <AdminChargeActions charge={charge} />
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