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

  // Ищем профиль собственника и подтягиваем все его счетчики с последними показаниями
  const owner = await prisma.owner.findUnique({
    where: { userId: session.userId },
    include: {
      garages: {
        include: {
          garage: {
            include: {
              meters: {
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

  // Собираем плоский массив счетчиков для формы
  const meters = owner?.garages.flatMap((og) => 
    og.garage.meters.map((meter) => ({
      id: meter.id,
      serialNumber: meter.serialNumber,
      meteringType: meter.meteringType as 'single' | 'dual',
      garage: { block: og.garage.block, number: og.garage.number },
      previousReading: meter.readings[0] 
        ? { 
            t1: Number(meter.readings[0].readingT1), 
            t2: meter.readings[0].readingT2 ? Number(meter.readings[0].readingT2) : null 
          } 
        : { 
            t1: Number(meter.initialReadingT1), 
            t2: meter.initialReadingT2 ? Number(meter.initialReadingT2) : null 
          } // Если показаний нет, берем начальные при установке
    }))
  ) || [];

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