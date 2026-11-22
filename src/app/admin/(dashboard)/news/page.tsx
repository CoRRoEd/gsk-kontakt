import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { Newspaper, Clock } from 'lucide-react';
import CreateNewsForm from './CreateNewsForm';

export default async function AdminNewsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const newsList = await prisma.news.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { author: true }
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Новости Правления</h1>
          <p className="text-sm text-slate-500">Публикации для собственников</p> {/* <-- Убрали отсюда news.excerpt */}
        </div>
        <CreateNewsForm />
      </div>

      <div className="space-y-4">
        {newsList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 flex flex-col items-center">
            <Newspaper size={48} className="mb-3 opacity-20" />
            <p>Новостей пока нет.</p>
          </div>
        ) : (
          newsList.map(news => (
            <div key={news.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${
                    news.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    news.priority === 'important' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {news.priority === 'urgent' ? 'Срочно' : news.priority === 'important' ? 'Важно' : 'Обычное'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {news.publishedAt?.toLocaleDateString('ru-RU')}
                  </span>
                  {news.status === 'draft' && (
                     <span className="text-xs px-2 py-1 rounded-md font-bold bg-slate-200 text-slate-600">Черновик</span>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-400">{news.author?.fullName}</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{news.title}</h3>
              
              {/* ВОТ ЗДЕСЬ ВЫВОДИМ EXCERPT ДЛЯ КАЖДОЙ НОВОСТИ */}
              <p className="text-sm text-slate-600 line-clamp-3">
                {news.excerpt || news.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}