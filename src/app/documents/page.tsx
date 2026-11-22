import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ArrowLeft, FileText, Download, Calendar } from 'lucide-react';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function PublicDocumentsPage() {
  // 1. Проверка авторизации
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  if (!session.userId) {
    redirect('/login?redirect=/documents');
  }

  // 2. Запрос документов
  const documents = await prisma.document.findMany({
    where: { status: 'active' },
    orderBy: { adoptedAt: 'desc' },
  });

  const typeLabels: Record<string, string> = {
    general_meeting: 'Общее собрание',
    board_report: 'Отчёт Правления',
    board_decision: 'Решение Правления',
    announcement: 'Объявление',
    other: 'Другое',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
            <ArrowLeft size={16} /> На главную
          </Link>
          <Link href="/app" className="text-sm font-medium text-blue-600 hover:text-blue-700">В кабинет</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Официальные документы</h1>
          <p className="text-slate-500">Решения собраний, отчёты и тарифы кооператива</p>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
            <p className="text-slate-500">Документов пока нет.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <li key={doc.id} className="p-4 sm:p-6 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0 hidden sm:block">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                            {typeLabels[doc.type] || doc.type}
                          </span>
                          {doc.number && <span className="text-xs text-slate-400">№{doc.number}</span>}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{doc.title}</h3>
                        {doc.description && <p className="text-sm text-slate-500 mt-1">{doc.description}</p>}
                        {doc.adoptedAt && (
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <Calendar size={14} /> Принят: {doc.adoptedAt.toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {doc.pdfUrl && (
                      <a 
                        href={doc.pdfUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium text-sm shrink-0"
                      >
                        <Download size={16} /> Скачать PDF
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}