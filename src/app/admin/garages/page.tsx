import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { Download } from 'lucide-react';
import Link from 'next/link';
import CreateGarageModal from './CreateGarageModal';
import SearchBar from './SearchBar';
import { Prisma } from '@prisma/client';
import { Suspense } from 'react'; // <-- Импортируем Suspense

export const dynamic = 'force-dynamic';

export default async function GaragesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const { search } = await searchParams;

  let whereClause: Prisma.GarageWhereInput = {};

  if (search) {
    const searchNum = parseInt(search, 10);
    const isNum = !isNaN(searchNum);

    whereClause = {
      OR: [
        { block: { contains: search, mode: 'insensitive' } },
        { 
          owners: { 
            some: { 
              endedAt: null, 
              owner: { fullName: { contains: search, mode: 'insensitive' } } 
            } 
          } 
        },
        ...(isNum ? [
          { number: searchNum },
          { row: searchNum }
        ] : [])
      ]
    };
  }

  const garages = await prisma.garage.findMany({
    where: whereClause,
    orderBy: [{ row: 'asc' }, { block: 'asc' }, { number: 'asc' }],
    include: { 
      owners: { 
        where: { endedAt: null },
        include: { 
          owner: { 
            include: { 
              user: { 
                include: { phones: true } 
              } 
            } 
          } 
        } 
      } 
    }
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Гаражи</h1>
            <p className="text-sm text-slate-500 whitespace-nowrap">Всего в базе: {garages.length}</p>
          </div>
          
          {/* Оборачиваем в Suspense, чтобы Next.js корректно обновлял страницу */}
          <Suspense fallback={<div className="w-full max-w-xl h-[42px] bg-slate-100 animate-pulse rounded-lg"></div>}>
            <SearchBar />
          </Suspense>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <a href="/api/admin/export/garages" className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition text-sm font-medium">
            <Download size={18} />
            Экспорт
          </a>
          <CreateGarageModal />
        </div>
      </div>

      {/* Добавляем id="garages-table" для скролла */}
      <div id="garages-table" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto scroll-mt-6">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Ряд</th>
              <th className="p-4 font-medium">Блок</th>
              <th className="p-4 font-medium">Бокс</th>
              <th className="p-4 font-medium">Этажность</th>
              <th className="p-4 font-medium">Площадь</th>
              <th className="p-4 font-medium">Собственник</th>
              <th className="p-4 font-medium">Телефон</th>
              <th className="p-4 font-medium">Кадастр №</th>
              <th className="p-4 font-medium">Примечания</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {garages.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  По вашему запросу ничего не найдено.
                </td>
              </tr>
            ) : (
              garages.map((garage) => {
                const activeOwner = garage.owners[0]?.owner;
                const phone = activeOwner?.user?.phones?.[0]?.phone || '—';

                return (
                  <tr key={garage.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-600">{garage.row}</td>
                    <td className="p-4 text-slate-600">{garage.block}</td>
                    <td className="p-4 text-slate-600">
                      <Link href={`/admin/garages/${garage.id}`} className="font-semibold text-blue-600 hover:underline">
                        {garage.number}
                      </Link>
                    </td>
                    <td className="p-4 text-slate-600">{garage.floors} эт.</td>
                    <td className="p-4 text-slate-600">{garage.areaSqm ? `${Number(garage.areaSqm)} кв.м` : '—'}</td>
                    <td className="p-4 font-medium text-slate-900">
                      {activeOwner ? (
                        <Link href={`/admin/owners/${activeOwner.id}`} className="hover:text-blue-600 hover:underline">
                          {activeOwner.fullName}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Не привязан</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">{phone}</td>
                    <td className="p-4 text-slate-600">{garage.cadastralNumber || '—'}</td>
                    <td className="p-4 text-slate-600 max-w-[150px] truncate">{garage.notes || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}