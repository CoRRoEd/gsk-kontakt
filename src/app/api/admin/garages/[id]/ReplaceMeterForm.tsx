'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, AlertCircle, RefreshCcw } from 'lucide-react';

type Props = {
  garageId: string;
  oldMeter: { id: string; serialNumber: string } | null;
};

export default function ReplaceMeterForm({ garageId, oldMeter }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Данные старого ПУ
  const [oldFinalT1, setOldFinalT1] = useState('');
  const [oldFinalT2, setOldFinalT2] = useState('');
  
  // Данные нового ПУ
  const [newSerial, setNewSerial] = useState('');
  const [newType, setNewType] = useState<'single' | 'dual'>('single');
  const [newInitialT1, setNewInitialT1] = useState('0');
  const [newInitialT2, setNewInitialT2] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Истечение срока поверки');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldMeter) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/meters/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garageId,
          oldMeterId: oldMeter.id,
          newSerialNumber: newSerial,
          newMeteringType: newType,
          newInitialT1: Number(newInitialT1),
          newInitialT2: newType === 'dual' ? Number(newInitialT2) : undefined,
          oldFinalT1: Number(oldFinalT1),
          oldFinalT2: newType === 'dual' ? Number(oldFinalT2) : undefined,
          replacedAt: date,
          reason
        }),
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

  if (!oldMeter) return null;

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
        <RefreshCcw size={16} /> Заменить счётчик
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">Замена прибора учёта</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Блок снятия старого */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Снятие старого ПУ (№ {oldMeter.serialNumber})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Финальное T1</label>
                <input type="number" step="0.01" value={oldFinalT1} onChange={e => setOldFinalT1(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Финальное T2</label>
                <input type="number" step="0.01" value={oldFinalT2} onChange={e => setOldFinalT2(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
          </div>

          {/* Блок установки нового */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-3">Установка нового ПУ</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Серийный номер</label>
                  <input type="text" value={newSerial} onChange={e => setNewSerial(e.target.value)} required className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Тип</label>
                  <select value={newType} onChange={e => setNewType(e.target.value as 'single' | 'dual')} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white">
                    <option value="single">Однотарифный</option>
                    <option value="dual">Двухтарифный</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Начальное T1</label>
                  <input type="number" step="0.01" value={newInitialT1} onChange={e => setNewInitialT1(e.target.value)} required className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm" />
                </div>
                {newType === 'dual' && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Начальное T2</label>
                    <input type="number" step="0.01" value={newInitialT2} onChange={e => setNewInitialT2(e.target.value)} required className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата замены</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Причина</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading && <Loader2 size={18} className="animate-spin" />} Подтвердить замену
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}