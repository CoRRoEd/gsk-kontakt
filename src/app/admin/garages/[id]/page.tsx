import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, User, Phone } from 'lucide-react';
import Link from 'next/link';
import EditGarageForm from './EditGarageForm';
import SelectOwnerModal from './SelectOwnerModal';
import DeleteGarageButton from './DeleteGarageButton';

export const dynamic = 'force-dynamic';

export default async function GarageCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const garage = await prisma.garage.findUnique({
    where: { id },
    include: {
      owners: { 
        where: { endedAt: null },
        include: { owner: { include: { user: { include: { phones: true } }, balances: true } } } 
      },
      meters: { where: { status: 'active' } }
    }
  });

  if (!garage) notFound();

  const unpaidChargesCount = await prisma.charge.count({
    where: { garageId: garage.id, status: 'awaiting_payment' }
  });
  const hasDebt = unpaidChargesCount > 0;

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
  const debt = Number(activeOwner?.balances?.debtAmount || 0);

  // ФИКС: Превращаем Decimal в обычные числа для счетчиков
  const safeMeters = garage.meters.map(m => ({
    id: m.id,
    serialNumber: m.serialNumber,
    meteringType: m.meteringType,
    initialReadingT1: Number(m.initialReadingT1),
    initialReadingT2: m.initialReadingT2 ? Number(m.initialReadingT2) : null,
    status: m.status
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
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${garage.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
              {garage.status === 'active' ? 'Активен' : 'Архив'}
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${debt > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {debt > 0 ? `Долг ${debt} ₽` : 'Нет долга'}
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
        
        <div className="mt-6 pt-4 border-t border-slate-100">
          <DeleteGarageButton garageId={garage.id} hasDebt={hasDebt} />
        </div>
      </div>

    </div>
  );
}