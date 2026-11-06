'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';

export default function CreateOwnerModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await res.json();

      if (data.ok) {
        setIsOpen(false);
        setFullName(''); setPhone('');
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
        <Plus size={18} /> Добавить
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Новый собственник</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <div className="p-5">
          <form id="create-owner-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ФИО</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Телефон</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+79001234567" className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="create-owner-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />} Создать
          </button>
        </div>
      </div>
    </div>
  );
}