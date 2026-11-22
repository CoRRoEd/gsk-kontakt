import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import CreateAppealForm from './CreateAppealForm';
import RefreshOnLoad from './RefreshOnLoad';

export default async function AppealsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  // Помечаем все непрочитанные ответы как прочитанные
  await prisma.appeal.updateMany({
    where: { userId: session.userId, isReadByOwner: false },
    data: { isReadByOwner: true }
  });

  // ВОТ ЗДЕСЬ МЫ ЗАКРЫЛИ ЗАПРОС И ДОБАВИЛИ УСЛОВИЯ ВЫБОРКИ
  const appeals = await prisma.appeal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  const topicLabels: Record<string, string> = {
    access: 'Доступ', metering: 'Показания', payment: 'Оплата',
    negative_reading: 'Отрицательный расход', meter_replacement: 'Замена ПУ', other: 'Другое'
  };

  return (
     <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <RefreshOnLoad /> 
       <div className="mb-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} /> Назад в кабинет
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Обращения к Правлению</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Задайте вопрос или сообщите о проблеме. Председатель ответит вам здесь.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Форма создания */}
        <div>
          <CreateAppealForm />
        </div>

        {/* История обращений */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Мои обращения ({appeals.length})</h2>
          
          {appeals.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 flex flex-col items-center">
              <MessageSquare size={40} className="mb-3 opacity-20" />
              <p>У вас пока нет обращений.</p>
            </div>
          ) : (
            appeals.map(appeal => (
              <div key={appeal.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                      {topicLabels[appeal.topic] || appeal.topic}
                    </p>
                    <h3 className="font-bold text-slate-900">{appeal.subject}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 ${
                    appeal.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                    appeal.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {appeal.status === 'resolved' ? <CheckCircle2 size={12}/> : appeal.status === 'in_progress' ? <Clock size={12}/> : <AlertCircle size={12}/>}
                    {appeal.status === 'resolved' ? 'Решено' : appeal.status === 'in_progress' ? 'В работе' : 'Новое'}
                  </span>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{appeal.createdAt.toLocaleDateString('ru-RU')} вы написали:</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{appeal.body}</p>
                  </div>
                  
                  {appeal.resolution && (
                    <div className="mt-3 pl-3 border-l-2 border-blue-200">
                      <p className="text-xs text-blue-500 font-semibold mb-1">Ответ Правления:</p>
                      <p className="text-sm text-slate-700">{appeal.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}