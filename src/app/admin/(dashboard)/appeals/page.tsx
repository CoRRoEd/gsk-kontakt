import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, User, Phone } from 'lucide-react';
import Link from 'next/link';
import AppealReplyForm from './AppealReplyForm';

export default async function AdminAppealsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const resolvedParams = await searchParams;
  const filterStatus = resolvedParams.status;

  const whereClause = filterStatus ? { status: filterStatus as any } : {};

  const appeals = await prisma.appeal.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { include: { owner: true, phones: true } }
    }
  });

  const statusTabs = [
    { value: '', label: 'Все' },
    { value: 'new', label: 'Новые' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'resolved', label: 'Решённые' },
  ];

  const topicLabels: Record<string, string> = {
    access: 'Доступ', metering: 'Показания', payment: 'Оплата',
    negative_reading: 'Отрицательный расход', meter_replacement: 'Замена ПУ', other: 'Другое'
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Обращения собственников</h1>
        <p className="text-sm text-slate-500 mt-1">Вопросы и заявки от членов ГСК</p>
      </div>

      {/* Фильтры по статусу */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {statusTabs.map(tab => (
          <Link
            key={tab.value}
            href={`/admin/appeals${tab.value ? `?status=${tab.value}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              (filterStatus || '') === tab.value 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Список обращений */}
      <div className="space-y-4">
        {appeals.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 flex flex-col items-center">
            <MessageSquare size={48} className="mb-3 opacity-20" />
            <p>По этому фильтру обращений нет.</p>
          </div>
        ) : (
          appeals.map(appeal => (
            <div key={appeal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Шапка обращения */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded">
                      {topicLabels[appeal.topic] || appeal.topic}
                    </span>
                    <span className="text-xs text-slate-400">{appeal.createdAt.toLocaleDateString('ru-RU')}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{appeal.subject}</h3>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                    <User size={14} className="text-slate-400" />
                    {appeal.user?.owner?.fullName || appeal.user?.fullName || 'Неизвестно'}
                  </div>
                  {appeal.user?.phones?.[0]?.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone size={12} className="text-slate-400" />
                      {appeal.user.phones[0].phone}
                    </div>
                  )}
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1 shrink-0 ${
                  appeal.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                  appeal.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 
                  appeal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {appeal.status === 'resolved' ? <CheckCircle2 size={14}/> : appeal.status === 'in_progress' ? <Clock size={14}/> : <AlertCircle size={14}/>}
                  {appeal.status === 'resolved' ? 'Решено' : appeal.status === 'in_progress' ? 'В работе' : appeal.status === 'rejected' ? 'Отклонено' : 'Новое'}
                </span>
              </div>
              
              {/* Тело обращения и форма ответа */}
              <div className="p-4">
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{appeal.body}</p>
                
                <AppealReplyForm 
                  appealId={appeal.id} 
                  currentStatus={appeal.status} 
                  currentResolution={appeal.resolution} 
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}