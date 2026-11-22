'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';

export default function TariffForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState<'single' | 'dual'>('single');
  const [priceT1, setPriceT1] = useState('');
  const [priceT2, setPriceT2] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tariffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tariffType: type,
          priceT1: Number(priceT1),
          priceT2: type === 'dual' ? Number(priceT2) : undefined,
          validFrom: date,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setIsOpen(false);
        setName(''); setPriceT1(''); setPriceT2('');
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
        <Plus size={18} /> Установить тариф
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Новый тариф</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
        </div>
        <div className="p-6">
          <form id="tariff-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Электроэнергия, 2027" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип учёта</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={type === 'single'} onChange={() => setType('single')} /> <span className="text-sm">Однотарифный</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={type === 'dual'} onChange={() => setType('dual')} /> <span className="text-sm">Двухтарифный</span></label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Цена T1 (руб.)</label>
                <input type="number" step="0.01" value={priceT1} onChange={e => setPriceT1(e.target.value)} placeholder="11.00" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" required />
              </div>
              {type === 'dual' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Цена T2 (руб.)</label>
                  <input type="number" step="0.01" value={priceT2} onChange={e => setPriceT2(e.target.value)} placeholder="5.50" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" required />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Действует с даты</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" required />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          </form>
        </div>
        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="tariff-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading && <Loader2 size={18} className="animate-spin" />} Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}