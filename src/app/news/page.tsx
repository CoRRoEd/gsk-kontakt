import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, Newspaper, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerNewsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const newsList = await prisma.news.findMany({
    where: { 
      status: 'published',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    orderBy: { publishedAt: 'desc' }
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mb-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft size={16} /> Назад в кабинет
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Новости и объявления</h1>
        <p className="text-slate-500 mt-1 text-sm">Официальная лента событий ГСК «Контакт».</p>
      </div>

      <div className="space-y-4">
        {newsList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 flex flex-col items-center">
            <Newspaper size={48} className="mb-3 opacity-20" />
            <p>Новостей пока нет.</p>
          </div>
        ) : (
          newsList.map(news => (
            <Link key={news.id} href={`/app/news/${news.slug}`} className="block group">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group-hover:border-blue-300 transition-colors">
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
                    {news.requiresAcknowledgement && (
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-purple-100 text-purple-700">
                        Требует прочтения
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{news.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{news.excerpt || news.body}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}