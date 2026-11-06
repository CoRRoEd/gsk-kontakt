'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eraser, AlertTriangle, X } from 'lucide-react';

export default function DeleteGarageButton({ garageId, hasDebt }: { garageId: string, hasDebt: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmChoice, setConfirmChoice] = useState<'yes' | 'no'>('no');

  const handleOpen = () => {
    setIsOpen(true);
    setError('');
    setConfirmChoice('no');
  };

  const handleClearData = async () => {
    if (confirmChoice !== 'yes') return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/garages/${garageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          floors: 1,           
          areaSqm: null,       
          cadastralNumber: null, 
          notes: null,
          clearOwner: true // <-- Отвязываем собственника
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

  return (
    <>
      <button 
        onClick={handleOpen}
        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition font-medium"
      >
        <Eraser size={16} />
        Очистить характеристики
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {hasDebt ? 'Ошибка' : 'Подтверждение'}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {hasDebt ? (
                <div className="text-center">
                  <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-red-600" />
                  </div>
                  <p className="text-slate-800 font-medium mb-2">Задолженность!</p>
                  <p className="text-sm text-slate-500">
                    Оплатив долги, можно очистить характеристики гаража.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <p className="text-slate-800 font-medium mb-2">Очистить все данные?</p>
                    <p className="text-sm text-slate-500">
                      Будут удалены: площадь, этажность, кадастровый номер, примечания и привязка собственника. Сам гараж (Ряд, Блок, Бокс) останется в реестре.
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-8 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="confirmClear" checked={confirmChoice === 'yes'} onChange={() => setConfirmChoice('yes')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                      <span className="text-sm font-medium text-slate-700">Да</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="confirmClear" checked={confirmChoice === 'no'} onChange={() => setConfirmChoice('no')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium text-slate-700">Нет</span>
                    </label>
                  </div>
                </div>
              )}
              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-4">{error}</div>}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              {hasDebt ? (
                <button onClick={() => setIsOpen(false)} className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition">Понятно</button>
              ) : (
                <>
                  <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">Отмена</button>
                  <button onClick={handleClearData} disabled={loading || confirmChoice !== 'yes'} className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Очистить'}
                  </button>
                </>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}