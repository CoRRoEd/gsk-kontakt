'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';

export default function CreateGarageModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [row, setRow] = useState('');
  const [block, setBlock] = useState('1');
  const [number, setNumber] = useState('');
  const [floors, setFloors] = useState('1');
  const [area, setArea] = useState('');
  const [cadastral, setCadastral] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/garages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          row: Number(row),
          block,
          number: Number(number),
          floors: Number(floors),
          areaSqm: area ? Number(area) : undefined,
          cadastralNumber: cadastral || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setIsOpen(false);
        setRow(''); setNumber(''); setArea(''); setCadastral(''); setNotes('');
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Новый гараж</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="create-garage-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ряд</label>
                <input type="number" min="1" value={row} onChange={e => setRow(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Блок</label>
                <select value={block} onChange={e => setBlock(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Бокс</label>
                <input type="number" min="1" value={number} onChange={e => setNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Этажность</label>
                <select value={floors} onChange={e => setFloors(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="1">1 этаж</option>
                  <option value="2">2 этажа</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Площадь (кв.м)</label>
                <input type="number" step="0.1" value={area} onChange={e => setArea(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Кадастровый номер</label>
              <input type="text" value={cadastral} onChange={e => setCadastral(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Примечания</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2}></textarea>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="create-garage-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />} Создать
          </button>
        </div>
      </div>
    </div>
  );
}