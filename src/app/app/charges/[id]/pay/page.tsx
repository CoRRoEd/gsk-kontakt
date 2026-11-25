import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PayForm from './PayForm';

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const chargeId = resolvedParams.id;

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const charge = await prisma.charge.findUnique({
    where: { id: chargeId },
    include: { owner: true, garage: true } 
  });

  if (!charge || charge.owner.userId !== session.userId) {
    redirect('/app/charges');
  }

  const periodStr = charge.period.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  
  // Формируем строку с гаражом: "6-31"
  const garageInfo = `${charge.garage.row}-${charge.garage.number}`;

  // Словарь для названий услуг
  const serviceNames: Record<string, string> = {
    electricity: 'Электроэнергия',
    membership_fee: 'Членский взнос',
    targeted_fee: 'Целевой взнос',
    maintenance_fee: 'Содержание и ремонт',
    penalty: 'Пени / Штраф',
    debt_carryover: 'Старый долг'
  };
  
  const serviceName = serviceNames[charge.paymentType] || 'Услуги ГСК';

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/app/charges" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} /> Назад
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Оплата</h1>
        {/* Теперь заголовок зависит от типа платежа */}
        <p className="text-slate-500 mt-1 text-sm">{serviceName} за {periodStr}</p>
      </div>

      <PayForm 
        chargeId={charge.id} 
        amount={Number(charge.amount)} 
        period={periodStr} 
        payerName={charge.owner.fullName} 
        garageInfo={garageInfo}
        serviceName={serviceName} // <-- Передаем название услуги
      />
    </div>
  );
}