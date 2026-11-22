'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';

export default function AdjustChargeButton({ chargeId, amount }: { chargeId: string, amount: number }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [type, setType] = useState('penalty');
  const [adjAmount, setAdjAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Вы уверены, что хотите применить корректировку? Это изменит баланс и сумму начисления.')) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/charges/${chargeId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: Number(adjAmount),
          reason,
        }),
      });
      const data = await res.json();
      
      if (data.ok) {
        setIsOpen(false);
        setAdjAmount('');
        setReason('');
        router.refresh(); // Обновляем таблицу
      } else {
        setError(data.error?.message || 'Ошибка при корректировке');
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
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        title="Сделать корректировку"
      >
        <SlidersHorizontal size={18} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Корректировка</h2>
            <p className="text-xs text-slate-500">Текущая сумма: {amount.toFixed(2)} ₽</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <form id="adjust-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип операции</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                <option value="penalty">Начислить пеню (+)</option>
                <option value="write_off">Списание долга (-)</option>
                <option value="recalculation">Перерасчет</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Сумма (руб.)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                value={adjAmount} 
                onChange={e => setAdjAmount(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                placeholder="Например: 150.00"
                required 
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {type === 'write_off' ? 'Эта сумма будет вычтена из долга.' : 'Эта сумма будет добавлена к долгу.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Причина (обязательно)</label>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                rows={2} 
                placeholder="Например: Пени за просрочку по решению Правления №5"
                required 
              />
            </div>

            {error && (
              <div className="text-red-600 text-xs bg-red-50 p-2 rounded-lg flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="adjust-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />} Применить
          </button>
        </div>
      </div>
    </div>
  );
}