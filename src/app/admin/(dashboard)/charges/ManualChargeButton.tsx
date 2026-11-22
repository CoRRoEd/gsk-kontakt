'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ManualChargeButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean, msg: string } | null>(null);

  const [paymentType, setPaymentType] = useState('membership_fee');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Выставить этот взнос ВСЕМ гаражам с собственниками?')) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/charges/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType,
          amount: Number(amount),
          period,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setResult({ ok: true, msg: data.data.message });
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
          setAmount('');
          router.refresh();
        }, 3000);
      } else {
        setResult({ ok: false, msg: data.error.message });
      }
    } catch {
      setResult({ ok: false, msg: 'Ошибка сети' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
      >
        <Plus size={18} />
        Выставить взнос
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col text-left">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Новый массовый взнос</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <form id="manual-charge-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип взноса</label>
              <select 
                value={paymentType} 
                onChange={e => setPaymentType(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="membership_fee">Членский взнос</option>
                <option value="targeted_fee">Целевой взнос</option>
                <option value="maintenance_fee">Содержание и ремонт</option>
                <option value="penalty">Пени / Штраф</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Сумма с одного гаража (₽)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="Например: 1000" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">За какой период</label>
              <input 
                type="month" 
                value={period} 
                onChange={e => setPeriod(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                required 
              />
            </div>

            {result && (
              <div className={`p-3 rounded-lg text-sm flex gap-2 items-center ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {result.msg}
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)} 
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            form="manual-charge-form" 
            disabled={loading} 
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading && <Loader2 size={18} className="animate-spin" />} 
            Начислить всем
          </button>
        </div>
      </div>
    </div>
  );
}