import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import TariffForm from './TariffForm';
import { Coins } from 'lucide-react';

export default async function TariffsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const tariffs = await prisma.tariffSet.findMany({
    orderBy: { validFrom: 'desc' },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Тарифы</h1>
          <p className="text-sm text-slate-500">Управление ценами на электроэнергию</p>
        </div>
        <TariffForm />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Название</th>
              <th className="p-4 font-medium">Тип</th>
              <th className="p-4 font-medium">Цена T1</th>
              <th className="p-4 font-medium">Цена T2</th>
              <th className="p-4 font-medium">Действует с</th>
              <th className="p-4 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tariffs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Тарифов пока нет. Установите первый тариф.</td></tr>
            ) : (
              tariffs.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">{t.name}</td>
                  <td className="p-4 text-slate-600">{t.tariffType === 'single' ? 'Однотарифный' : 'Двухтарифный'}</td>
                  <td className="p-4 text-slate-600">{Number(t.priceT1).toFixed(2)} ₽</td>
                  <td className="p-4 text-slate-600">{t.priceT2 ? `${Number(t.priceT2).toFixed(2)} ₽` : '—'}</td>
                  <td className="p-4 text-slate-600">{t.validFrom.toLocaleDateString('ru-RU')}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {t.status === 'active' ? 'Действует' : 'Архив'}
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