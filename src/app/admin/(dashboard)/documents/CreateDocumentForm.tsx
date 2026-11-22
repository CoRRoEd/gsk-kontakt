'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, Upload } from 'lucide-react';

export default function CreateDocumentForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('board_decision');
  const [number, setNumber] = useState('');
  const [description, setDescription] = useState('');
  const [adoptedAt, setAdoptedAt] = useState('');
  const [status, setStatus] = useState('active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Выберите PDF-файл');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('type', type);
    formData.append('number', number);
    formData.append('description', description);
    formData.append('adoptedAt', adoptedAt);
    formData.append('status', status);

    try {
      const res = await fetch('/api/admin/documents', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.ok) {
        setIsOpen(false);
        setFile(null); setTitle(''); setNumber(''); setDescription('');
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
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        <Plus size={18} /> Загрузить документ
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Новый документ</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="doc-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Название документа</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Решение Правления №5..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Тип документа</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="board_decision">Решение Правления</option>
                  <option value="general_meeting">Решение общего собрания</option>
                  <option value="board_report">Отчёт Правления</option>
                  <option value="announcement">Объявление</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Номер (если есть)</label>
                <input type="text" value={number} onChange={e => setNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="№5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Дата принятия</label>
                <input type="date" value={adoptedAt} onChange={e => setAdoptedAt(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="active">Действующий</option>
                  <option value="draft">Проект</option>
                  <option value="repealed">Утратил силу</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Описание (необязательно)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Выбор файла */}
            <div>
              <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && setFile(e.target.files[0])} />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
              >
                <Upload className={`mx-auto mb-2 ${file ? 'text-blue-500' : 'text-slate-400'}`} size={28} />
                <p className="text-sm font-medium text-slate-700">{file ? file.name : 'Нажмите, чтобы выбрать PDF'}</p>
                <p className="text-xs text-slate-500 mt-1">Только формат .pdf</p>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="doc-form" disabled={loading || !file} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading && <Loader2 size={18} className="animate-spin" />} Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}