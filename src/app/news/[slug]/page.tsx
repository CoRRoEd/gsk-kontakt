import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Ищем новость в базе по её URL (slug)
  const news = await prisma.news.findUnique({
    where: { slug }
  });

  // Если новости нет или она не опубликована — показываем 404
  if (!news || news.status !== 'published') {
    notFound();
  }

  // Словарь для красивого отображения категорий
  const categoryLabels: Record<string, string> = {
    important: 'Важное',
    electricity: 'Электроэнергия',
    documents: 'Документы',
    meetings: 'Собрания',
    improvement: 'Благоустройство',
    announcements: 'Объявления',
    other: 'Другое'
  };

  // Форматируем дату без использования date-fns
  const dateStr = new Date(news.publishedAt || news.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Кнопка "На главную" (ведет на публичную главную) */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
            <ArrowLeft size={16} /> На главную
          </Link>
        </div>

        <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Обложка новости (если есть) */}
          {news.coverUrl && (
            <div className="w-full h-64 sm:h-80 bg-slate-200">
              <img src={news.coverUrl} alt={news.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="p-6 sm:p-10">
            
            {/* Дата и категория */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar size={16} />
                {dateStr}
              </span>
              <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {categoryLabels[news.category] || news.category}
              </span>
            </div>

            {/* Заголовок */}
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight">
              {news.title}
            </h1>

            {/* Текст новости (с переносами строк) */}
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">
              {news.body}
            </div>

          </div>
        </article>
      </div>
    </div>
  );
}