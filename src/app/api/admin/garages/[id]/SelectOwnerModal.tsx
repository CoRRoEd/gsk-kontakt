'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X, Loader2 } from 'lucide-react';

type OwnerOption = { id: string; fullName: string; phone: string };

export default function SelectOwnerModal({ garageId, owners }: { garageId: string, owners: OwnerOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState(owners[0]?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/garages/${garageId}/owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: selectedOwnerId }),
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

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        <UserPlus size={14} />
        Сменить
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Смена собственника</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <form id="owner-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Выберите нового собственника</label>
                  <select 
                    value={selectedOwnerId} 
                    onChange={(e) => setSelectedOwnerId(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.fullName} ({o.phone})</option>
                    ))}
                  </select>
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
                
                <p className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <strong>Внимание:</strong> Смена собственника невозможна, если у текущего владельца есть непогашенная задолженность.
                </p>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition text-sm">
                Отмена
              </button>
              <button type="submit" form="owner-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                {loading && <Loader2 size={16} className="animate-spin" />} Сменить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}