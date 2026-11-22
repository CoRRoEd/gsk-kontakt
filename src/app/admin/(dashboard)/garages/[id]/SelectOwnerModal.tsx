'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X, Loader2, AlertCircle } from 'lucide-react';

type OwnerOption = {
  id: string;
  fullName: string;
  phone: string;
};

export default function SelectOwnerModal({ garageId, owners }: { garageId: string, owners: OwnerOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState(owners[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId) return;

    if (!confirm('Вы уверены, что хотите сменить собственника? Старый владелец будет отвязан от этого гаража.')) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/garages/${garageId}/change-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: selectedOwnerId }),
      });
      
      const data = await res.json();

      if (data.ok) {
        setIsOpen(false);
        router.refresh(); // Обновляем данные на странице (карточка гаража перерисуется с новым владельцем)
      } else {
        // Сюда попадет сообщение про долг, которое вернет наш API
        setError(data.error?.message || 'Ошибка при смене собственника');
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
        className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <UserPlus size={14} />
        Сменить
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Смена собственника</h2>
          <button onClick={() => { setIsOpen(false); setError(''); }} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Выберите нового собственника</label>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName} ({o.phone})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl flex gap-2 items-start text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setError(''); }}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !selectedOwnerId}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Сохранить
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}