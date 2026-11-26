import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { Settings } from 'lucide-react';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  // Запрещаем бухгалтеру менять настройки ГСК
  if (session.role === 'accountant') {
    redirect('/admin');
  }

  const settings = await prisma.cooperativeSettings.findFirst();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="text-slate-400" />
          Настройки ГСК
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Реквизиты организации, нормативы и правила расчёта за электроэнергию.
        </p>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  );
}