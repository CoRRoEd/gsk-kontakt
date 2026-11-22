'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Edit } from 'lucide-react';

export default function EditNewsForm({ news }: { news: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(news.title);
  const [slug, setSlug] = useState(news.slug);
  const [excerpt, setExcerpt] = useState(news.excerpt);
  const [body, setBody] = useState(news.body);
  const [category, setCategory] = useState(news.category);
  const [priority, setPriority] = useState(news.priority);
  const [status, setStatus] = useState(news.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/news/${news.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, excerpt, body, category, priority, status }),
      });
      const data = await res.json();

      if (data.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(data.error.message);
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)} 
        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
        title="Редактировать"
      >
        <Edit size={18} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Редактировать новость</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="edit-news-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Заголовок</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL (slug)</label>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Краткое описание</label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} required rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Полный текст</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} required rows={8} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="announcements">Объявления</option>
                  <option value="important">Важное</option>
                  <option value="electricity">Электроэнергия</option>
                  <option value="documents">Документы</option>
                  <option value="meetings">Собрания</option>
                  <option value="improvement">Благоустройство</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Приоритет</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="normal">Обычный</option>
                  <option value="important">Важный</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="published">Опубликовать</option>
                  <option value="draft">Черновик</option>
                </select>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="edit-news-form" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading && <Loader2 size={18} className="animate-spin" />} Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}