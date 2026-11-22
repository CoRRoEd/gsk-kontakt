'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, Loader2 } from 'lucide-react';

export default function ChangeOwnerForm({ garageId, currentOwner }: { garageId: string, currentOwner: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      setError('Пожалуйста, заполните ФИО и телефон');
      return;
    }

    if (!confirm('Вы уверены, что хотите сменить собственника? Старый владелец будет отправлен в архив.')) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/garages/${garageId}/change-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newOwnerName: name.trim(), 
          newOwnerPhone: phone.trim() 
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setName('');
        setPhone('');
        router.refresh();
      } else {
        setError(data.error.message);
      }
    } catch {
      setError('Ошибка сети при смене собственника');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 mb-2">Создать нового собственника</h3>
      <p className="text-xs text-slate-500 mb-4">
        Используйте эту форму, если нужно добавить совершенно нового человека в базу (например, наследника) и сразу привязать его к этому гаражу.
        <br/>
        <span className="text-red-500 font-medium mt-1 inline-block">
          Внимание: система не даст сменить владельца, если на гараже висит долг.
        </span>
      </p>
      
      {currentOwner && (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          Текущий владелец: <span className="font-semibold text-slate-900">{currentOwner.fullName}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">ФИО нового владельца</label>
            <input 
              type="text" 
              placeholder="Иванов Иван Иванович" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Телефон</label>
            <input 
              type="tel" 
              placeholder="+7 900 123-45-67" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              required 
            />
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-start gap-2 border border-red-100">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
            <span>{error}</span>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading} 
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} 
          Создать и привязать
        </button>
      </form>
    </div>
  );
}