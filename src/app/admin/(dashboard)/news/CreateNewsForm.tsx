'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, CheckCircle2 } from 'lucide-react';

export default function CreateNewsForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('important');
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('published');
  
  // Новые поля
  const [requiresAck, setRequiresAck] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          excerpt, 
          body, 
          category, 
          priority, 
          status,
          requiresAcknowledgement: requiresAck,
          expiresAt: expiresAt || null
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTitle(''); setExcerpt(''); setBody(''); setExpiresAt(''); setRequiresAck(false);
        router.refresh();
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
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
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
        <Plus size={18} /> Добавить новость
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Новая публикация</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="news-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Заголовок</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Передача показаний за январь" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Краткое описание (для списка)</label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} placeholder="Коротко о главном..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" required />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none">
                  <option value="important">Важное</option>
                  <option value="electricity">Электроэнергия</option>
                  <option value="documents">Документы</option>
                  <option value="meetings">Собрания</option>
                  <option value="improvement">Благоустройство</option>
                  <option value="announcements">Объявления</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Приоритет</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none">
                  <option value="normal">Обычный</option>
                  <option value="important">Важный</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none">
                  <option value="published">Опубликовать</option>
                  <option value="draft">Черновик</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Текст новости</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Введите полный текст новости..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Актуально до (опционально)</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" />
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={requiresAck} onChange={e => setRequiresAck(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm font-medium text-slate-700">Требует обязательного прочтения</span>
                </label>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
            {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg flex items-center gap-2"><CheckCircle2 size={16}/> Новость успешно создана!</div>}
          </form>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="news-form" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading && <Loader2 size={18} className="animate-spin" />} Создать
          </button>
        </div>
      </div>
    </div>
  );
}