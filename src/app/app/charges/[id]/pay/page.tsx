import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PayForm from './PayForm';

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. В Next.js 15 params — это Promise, его нужно подождать
  const resolvedParams = await params;
  const chargeId = resolvedParams.id;

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  // 2. Ищем начисление в базе
  const charge = await prisma.charge.findUnique({
    where: { id: chargeId },
    include: { owner: true }
  });

  // 3. Защита: если счета нет или он принадлежит другому человеку — выкидываем назад
  if (!charge || charge.owner.userId !== session.userId) {
    redirect('/app/charges');
  }

  // Форматируем период для красивого вывода
  const periodStr = charge.period.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/app/charges" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} /> Назад
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Оплата</h1>
        <p className="text-slate-500 mt-1 text-sm">Электроэнергия за {periodStr}</p>
      </div>

      <PayForm 
        chargeId={charge.id} 
        amount={Number(charge.amount)} 
        period={periodStr} 
      />
    </div>
  );
}