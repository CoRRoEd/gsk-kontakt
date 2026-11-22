import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReadingForm from './ReadingForm';

export default async function ReadingsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const owner = await prisma.owner.findUnique({
    where: { userId: session.userId },
    include: {
      garages: {
        where: { endedAt: null },
        include: {
          garage: {
            include: {
              meters: {
                where: { status: 'active' },
                include: {
                  readings: {
                    orderBy: { period: 'desc' },
                    take: 1,
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Определяем текущий расчетный период (первое число текущего месяца)
  const now = new Date();
  const currentPeriod = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

  const allMeters = owner?.garages.flatMap((og) => 
    og.garage.meters.map((meter) => {
      const latestReading = meter.readings[0];
      
      // Проверяем, совпадает ли последнее показание с текущим месяцем
      const isSubmitted = latestReading 
        ? latestReading.period.getTime() === currentPeriod.getTime() 
        : false;

      return {
        id: meter.id,
        serialNumber: meter.serialNumber,
        meteringType: meter.meteringType as 'single' | 'dual',
        garage: { block: og.garage.block, number: og.garage.number },
        previousReading: latestReading 
          ? { 
              t1: Number(latestReading.readingT1), 
              t2: latestReading.readingT2 ? Number(latestReading.readingT2) : null 
            } 
          : { 
              t1: Number(meter.initialReadingT1), 
              t2: meter.initialReadingT2 ? Number(meter.initialReadingT2) : null 
            },
        isSubmitted // <-- Передаем этот флаг в форму
      };
    })
  ) || [];

  const meters = allMeters.filter((m, index, self) =>
    index === self.findIndex((t) => t.id === m.id)
  );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} />
          Назад в кабинет
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Передача показаний</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Внесите текущие данные со счётчика. Система автоматически рассчитает расход.
        </p>
      </div>

      <ReadingForm meters={meters} />
    </div>
  );
}