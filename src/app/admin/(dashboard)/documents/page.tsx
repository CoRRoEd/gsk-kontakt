import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import CreateDocumentForm from './CreateDocumentForm';
import { FileText, ExternalLink } from 'lucide-react';

export default async function AdminDocumentsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const typeLabels: Record<string, string> = {
    general_meeting: 'Общее собрание',
    board_report: 'Отчёт Правления',
    board_decision: 'Решение Правления',
    announcement: 'Объявление',
    other: 'Другое',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Документы</h1>
          <p className="text-sm text-slate-500">Архив официальных документов ГСК</p>
        </div>
        <CreateDocumentForm />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Название</th>
              <th className="p-4 font-medium">Тип</th>
              <th className="p-4 font-medium">Статус</th>
              <th className="p-4 font-medium">Дата</th>
              <th className="p-4 font-medium">Файл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">Документов пока нет.</td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">
                    {doc.title} {doc.number && `(${doc.number})`}
                  </td>
                  <td className="p-4 text-slate-600">{typeLabels[doc.type] || doc.type}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doc.status === 'active' ? 'bg-green-100 text-green-800' : 
                      doc.status === 'draft' ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doc.status === 'active' ? 'Действует' : doc.status === 'draft' ? 'Проект' : 'Утратил силу'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {doc.adoptedAt ? doc.adoptedAt.toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="p-4">
                    {doc.pdfUrl && (
                      <a href={doc.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <FileText size={16} /> Открыть <ExternalLink size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}