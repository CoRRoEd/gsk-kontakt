import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import Link from 'next/link';
import CreateOwnerModal from './CreateOwnerModal';

// Отключаем кэширование страницы, чтобы данные всегда были свежими
export const dynamic = 'force-dynamic';

export default async function OwnersPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  // Получаем список собственников с их АКТУАЛЬНЫМИ гаражами и телефонами
  const owners = await prisma.owner.findMany({
    include: {
      user: { include: { phones: true } },
      garages: { 
        where: { endedAt: null }, // <--- ГЛАВНЫЙ ФИКС: берем только текущие гаражи
        include: { garage: true } 
      },
    },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Шапка страницы */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Собственники</h1>
          <p className="text-sm text-slate-500">Всего в базе: {owners.length}</p>
        </div>
        <CreateOwnerModal />
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">ФИО</th>
              <th className="p-4 font-medium">Телефон</th>
              <th className="p-4 font-medium">Гаражи</th>
              <th className="p-4 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {owners.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Собственников пока нет. Добавьте первого или загрузите из Excel.
                </td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr key={owner.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">
                    <Link href={`/admin/owners/${owner.id}`} className="hover:text-blue-600 hover:underline">
                      {owner.fullName}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-600">
                    {owner.user?.phones?.[0]?.phone || 'Нет номера'}
                  </td>
                  <td className="p-4 text-slate-600">
                    {owner.garages.length > 0
                      ? owner.garages.map((g) => `Ряд ${g.garage.row} · Блок ${g.garage.block} · Бокс ${g.garage.number}`).join(', ')
                      : <span className="text-slate-400 italic">Нет гаражей</span>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {owner.status === 'active' ? 'Активен' : 'Архив'}
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