'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteMeterButton({ meterId, serialNumber }: { meterId: string, serialNumber: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/meters/${meterId}`, { method: 'DELETE' });
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
        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex"
        title="Удалить счётчик"
      >
        <Trash2 size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Удаление ПУ</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-4">
                <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <p className="text-slate-800 font-medium mb-2">Удалить счётчик № {serialNumber}?</p>
                <p className="text-sm text-slate-500">
                  Все показания, привязанные к этому счётчику, также будут удалены. Это действие нельзя отменить.
                </p>
              </div>
              
              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</div>}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">Отмена</button>
              <button onClick={handleDelete} disabled={loading} className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}