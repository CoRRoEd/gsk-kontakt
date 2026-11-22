'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

export default function ReplaceMeterForm({ garageId, oldMeter }: { garageId: string, oldMeter: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [oldFinalT1, setOldFinalT1] = useState('');
  const [oldFinalT2, setOldFinalT2] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newInitialT1, setNewInitialT1] = useState('');
  const [newInitialT2, setNewInitialT2] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('failure');

  if (!oldMeter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/meters/${oldMeter.id}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldFinalT1: Number(oldFinalT1),
          oldFinalT2: oldFinalT2 ? Number(oldFinalT2) : null,
          newSerialNumber: newSerial,
          newInitialT1: Number(newInitialT1),
          newInitialT2: newInitialT2 ? Number(newInitialT2) : null,
          replacedAt: date,
          reason,
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

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} type="button" className="px-3 py-1.5 border border-dashed border-blue-300 rounded-lg text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-2">
        <RefreshCw size={14} /> Заменить ПУ
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-900">Замена прибора учёта</h2>
          <button onClick={() => setIsOpen(false)} type="button" className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="replace-meter-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg border border-amber-100">
              Старый счётчик №{oldMeter.serialNumber} будет переведён в архив. Введите его финальные показания на момент демонтажа.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Финальное T1 *</label>
                <input type="number" step="0.01" value={oldFinalT1} onChange={e => setOldFinalT1(e.target.value)} className="w-full p-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Финальное T2</label>
                <input type="number" step="0.01" value={oldFinalT2} onChange={e => setOldFinalT2(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
              </div>
            </div>
            
            <hr className="border-slate-100" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Новый серийный № *</label>
                <input type="text" value={newSerial} onChange={e => setNewSerial(e.target.value)} className="w-full p-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Начальное T1 *</label>
                <input type="number" step="0.01" value={newInitialT1} onChange={e => setNewInitialT1(e.target.value)} className="w-full p-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Начальное T2</label>
                <input type="number" step="0.01" value={newInitialT2} onChange={e => setNewInitialT2(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Дата замены *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm" required />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500">Причина замены</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white">
                <option value="failure">Выход из строя</option>
                <option value="verification">Истечение срока поверки</option>
                <option value="upgrade">Модернизация</option>
              </select>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
          </form>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="replace-meter-form" disabled={loading} className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />} Заменить ПУ
          </button>
        </div>
      </div>
    </div>
  );
}