import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, Car, Phone, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import EditOwnerForm from './EditOwnerForm';

// Отключаем кэширование страницы, чтобы при возврате данные всегда были свежими
export const dynamic = 'force-dynamic';

export default async function OwnerCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      user: { include: { phones: true } },
      // ФИКС: Добавили where: { endedAt: null }, чтобы показывать только АКТУАЛЬНЫЕ гаражи
      garages: { 
        where: { endedAt: null }, 
        include: { garage: true } 
      },
      balances: true,
    }
  });

  if (!owner) notFound();

  const phone = owner.user?.phones?.[0]?.phone || 'Нет номера';
  const debt = Number(owner.balances?.debtAmount || 0);

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      
      {/* Шапка страницы */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin/owners" 
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Назад к списку
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Карточка собственника</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ЛЕВАЯ КАРТОЧКА: Личные данные */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-full text-blue-500 shrink-0">
              <UserIcon size={28} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Собственник</p>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{owner.fullName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Phone size={18} className="text-slate-400" />
            <span className="text-sm font-medium">{phone}</span>
          </div>

          <div className="border-t border-slate-100 py-4 flex justify-between items-center">
            <span className="text-sm text-slate-500 font-medium">Текущий долг:</span>
            <span className={`text-lg font-bold ${debt > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {debt.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-auto">
            <EditOwnerForm ownerId={owner.id} initialName={owner.fullName} initialPhone={phone} />
          </div>
        </div>

        {/* ПРАВАЯ КАРТОЧКА: Гаражи */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Car size={20} className="text-slate-400" />
            Привязанные гаражи
          </h3>
          
          <div className="space-y-3">
            {owner.garages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">У собственника нет активных гаражей.</p>
              </div>
            ) : (
              owner.garages.map(og => (
                <div key={og.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  {/* Ссылка на карточку гаража + формат Ряд-Блок-Бокс */}
                  <Link href={`/admin/garages/${og.garage.id}`} className="font-semibold text-slate-700 text-sm hover:text-blue-600 hover:underline">
                    Ряд {og.garage.row} · Блок {og.garage.block} · Бокс {og.garage.number}
                  </Link>
                  <span className="text-[11px] bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 font-medium">
                    {og.ownershipType === 'owner' ? 'Собственник' : 'Арендатор'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}