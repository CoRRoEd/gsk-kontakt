import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import MeterForm from './MeterForm';
import DeleteMeterButton from './DeleteMeterButton';

// Отключаем кэш
export const dynamic = 'force-dynamic';

export default async function MetersPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const meters = await prisma.meter.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      garage: true,
    }
  });

  const garages = await prisma.garage.findMany({
    orderBy: [{ row: 'asc' }, { block: 'asc' }, { number: 'asc' }]
  });

  const garageOptions = garages.map(g => ({
    id: g.id,
    // Формат Ряд - Блок - Бокс
    label: `Ряд ${g.row} · Блок ${g.block} · Бокс ${g.number}`
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Приборы учёта</h1>
          <p className="text-sm text-slate-500">Всего счётчиков в базе: {meters.length}</p>
        </div>
        <MeterForm garages={garageOptions} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Гараж</th>
              <th className="p-4 font-medium">Серийный номер</th>
              <th className="p-4 font-medium">Тип</th>
              <th className="p-4 font-medium">Нач. показание</th>
              <th className="p-4 font-medium">Статус</th>
              <th className="p-4 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {meters.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Счётчиков пока нет. Добавьте первый прибор учёта.
                </td>
              </tr>
            ) : (
              meters.map((meter) => (
                <tr key={meter.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">
                    {/* Формат Ряд - Блок - Бокс */}
                    Ряд {meter.garage.row} · Блок {meter.garage.block} · Бокс {meter.garage.number}
                  </td>
                  <td className="p-4 text-slate-600 font-mono">{meter.serialNumber}</td>
                  <td className="p-4 text-slate-600">
                    {meter.meteringType === 'single' ? 'Однотарифный' : 'Двухтарифный'}
                  </td>
                  <td className="p-4 text-slate-600">
                    T1: {Number(meter.initialReadingT1)} 
                    {meter.initialReadingT2 && ` / T2: ${Number(meter.initialReadingT2)}`}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      meter.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {meter.status === 'active' ? 'Активен' : 'Архив'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end">
                    {/* Кнопка удаления */}
                    <DeleteMeterButton meterId={meter.id} serialNumber={meter.serialNumber} />
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