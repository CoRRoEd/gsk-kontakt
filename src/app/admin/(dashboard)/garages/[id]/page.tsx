import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, User, Phone } from 'lucide-react';
import Link from 'next/link';
import EditGarageForm from './EditGarageForm';
import SelectOwnerModal from './SelectOwnerModal';
import ChangeOwnerForm from './ChangeOwnerForm';
import DeleteGarageButton from './DeleteGarageButton';

export const dynamic = 'force-dynamic';

export default async function GarageCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  // 1. Запрашиваем гараж, его баланс, текущего собственника и активные счётчики
  const garage = await prisma.garage.findUnique({
    where: { id },
    include: {
      balance: true, // <-- Важно для расчета долга гаража
      owners: { 
        where: { endedAt: null },
        include: { owner: { include: { user: { include: { phones: true } } } } } 
      },
      meters: { 
        where: { status: 'active' },
        include: {
          // Подтягиваем последнее показание для валидации при замене ПУ
          readings: {
            orderBy: { period: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  if (!garage) notFound();

  // 2. Получаем список всех собственников (для модального окна выбора)
  const allOwners = await prisma.owner.findMany({
    include: { user: { include: { phones: true } } }
  });
  
  const ownerOptions = allOwners.map(o => ({
    id: o.id,
    fullName: o.fullName,
    phone: o.user?.phones?.[0]?.phone || 'Нет телефона'
  }));

  const activeOwner = garage.owners[0]?.owner;
  const phone = activeOwner?.user?.phones?.[0]?.phone || 'Нет телефона';
  
  // 3. Считаем долг именно по этому ГАРАЖУ, а не по всем гаражам собственника
  const garageDebt = Number(garage.balance?.debtAmount || 0); 
  const hasDebt = garageDebt > 0;

  // 4. Словарь статусов для красивого бейджа
  const statusLabels: Record<string, { text: string, color: string }> = {
    active: { text: 'Активен', color: 'bg-green-100 text-green-700' },
    under_construction: { text: 'Строительство', color: 'bg-amber-100 text-amber-700' },
    no_owner: { text: 'Без собственника', color: 'bg-slate-200 text-slate-700' },
    inactive: { text: 'Не используется', color: 'bg-slate-200 text-slate-700' },
    archived: { text: 'Архив', color: 'bg-slate-200 text-slate-500' },
  };
  const currentStatus = statusLabels[garage.status] || statusLabels.active;

  // 5. Превращаем Decimal в обычные числа для безопасной передачи в клиентские компоненты
  const safeMeters = garage.meters.map(m => ({
    id: m.id,
    serialNumber: m.serialNumber,
    meteringType: m.meteringType,
    initialReadingT1: Number(m.initialReadingT1),
    initialReadingT2: m.initialReadingT2 ? Number(m.initialReadingT2) : null,
    status: m.status,
    // Передаем последнее переданное показание (или начальное, если передач еще не было)
    prevReadingT1: m.readings[0] ? Number(m.readings[0].readingT1) : Number(m.initialReadingT1),
    prevReadingT2: m.readings[0]?.readingT2 ? Number(m.readings[0].readingT2) : (m.initialReadingT2 ? Number(m.initialReadingT2) : null)
  }));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      
      {/* Шапка карточки */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin/garages" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-1 transition">
            <ArrowLeft size={14} /> Назад к реестру
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Ряд {garage.row} · Блок {garage.block} · Бокс {garage.number}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${currentStatus.color}`}>
              {currentStatus.text}
            </span>
          </div>
        </div>

        {/* Блок текущего собственника */}
        <div className="flex items-start gap-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 min-w-[280px]">
          <User size={20} className="text-slate-400 shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Текущий собственник</p>
            {activeOwner ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/admin/owners/${activeOwner.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 hover:underline">
                    {activeOwner.fullName}
                  </Link>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${garageDebt > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {garageDebt > 0 ? `Долг ${garageDebt.toLocaleString('ru-RU')} ₽` : 'Нет долга'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone size={12} /> {phone}
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-400">Не привязан</p>
            )}
          </div>
          <div className="pl-3 border-l border-slate-200 h-full flex items-center">
            {/* Кнопка выбора из существующих */}
            <SelectOwnerModal garageId={garage.id} owners={ownerOptions} />
          </div>
        </div>
      </div>

      {/* Основной белый блок */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <EditGarageForm 
          garage={{
            id: garage.id,
            block: garage.block,
            row: garage.row,
            number: garage.number,
            floors: garage.floors,
            areaSqm: garage.areaSqm ? Number(garage.areaSqm) : null,
            cadastralNumber: garage.cadastralNumber,
            notes: garage.notes,
            status: garage.status
          }} 
          meters={safeMeters} 
        />
        
        {/* Форма создания нового собственника */}
        <div className="border-t border-slate-100 mt-6 pt-6">
          <ChangeOwnerForm garageId={garage.id} currentOwner={activeOwner} />
        </div>
        
        {/* Кнопка удаления (только одна) */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <DeleteGarageButton garageId={garage.id} hasDebt={hasDebt} />
        </div>
      </div>

    </div>
  );
}