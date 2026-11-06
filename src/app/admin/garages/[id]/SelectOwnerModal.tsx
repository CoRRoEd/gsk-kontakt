'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X, Loader2, Search } from 'lucide-react';

type OwnerOption = { id: string; fullName: string; phone: string };

export default function SelectOwnerModal({ garageId, owners }: { garageId: string, owners: OwnerOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Фильтруем список собственников по поиску
  const filteredOwners = owners.filter(owner => 
    owner.fullName.toLowerCase().includes(search.toLowerCase()) || 
    owner.phone.includes(search)
  );

  const handleAttach = async (ownerId: string) => {
    if (!ownerId) {
      setError('Ошибка: ID собственника не найден');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/garages/${garageId}/owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: ownerId }), // <--- ВОТ ЗДЕСЬ ПЕРЕДАЕТСЯ ID
      });
      const data = await res.json();

      if (data.ok) {
        setIsOpen(false);
        setSearch('');
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
        Сменить / Привязать
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Выбор собственника</h2>
              <button onClick={() => { setIsOpen(false); setError(''); }} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex flex-col overflow-hidden">
              
              {/* Поле поиска */}
              <div className="relative mb-4 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск по ФИО или телефону..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Блок ошибки */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4 shrink-0 border border-red-100">
                  {error}
                </div>
              )}
              
              {/* Список найденных собственников */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {filteredOwners.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-4">Никого не найдено</p>
                ) : (
                  filteredOwners.map((owner) => (
                    <div key={owner.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{owner.fullName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{owner.phone}</p>
                      </div>
                      <button
                        onClick={() => handleAttach(owner.id)} // <--- ВОТ ЗДЕСЬ ВЫЗЫВАЕТСЯ ФУНКЦИЯ С ID
                        disabled={loading}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : 'Привязать'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button type="button" onClick={() => { setIsOpen(false); setError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}