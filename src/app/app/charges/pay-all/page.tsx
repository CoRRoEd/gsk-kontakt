import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PayAllForm from './PayAllForm';

export default async function PayAllPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      owner: {
        include: {
          charges: {
            where: { status: 'awaiting_payment' },
            include: { garage: true }
          }
        }
      }
    }
  });

  const unpaidCharges = user?.owner?.charges || [];
  if (unpaidCharges.length === 0) redirect('/app');

  const totalAmount = unpaidCharges.reduce((acc, c) => acc + Number(c.amount), 0);
  
  // Собираем уникальные лицевые счета (Ряд-Бокс)
  const garageInfo = unpaidCharges
    .map(c => `${c.garage.row}-${c.garage.number}`)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ');

  const chargeIds = unpaidCharges.map(c => c.id);

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} /> Назад
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Оплата всех счетов</h1>
        <p className="text-slate-500 mt-1 text-sm">Общая сумма: {totalAmount.toFixed(2)} ₽</p>
      </div>

      <PayAllForm 
        chargeIds={chargeIds}
        amount={totalAmount}
        payerName={user?.fullName || ''}
        garageInfo={garageInfo}
      />
    </div>
  );
}