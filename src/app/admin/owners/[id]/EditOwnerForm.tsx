'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

export default function EditOwnerForm({ ownerId, initialName, initialPhone }: { ownerId: string, initialName: string, initialPhone: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await res.json();

      if (data.ok) {
        setIsEditing(false);
        router.refresh(); // Обновляем данные на странице
      } else {
        setError(data.error.message);
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)} 
        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition"
      >
        Редактировать данные
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">ФИО</label>
        <input 
          type="text" 
          value={fullName} 
          onChange={e => setFullName(e.target.value)} 
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          required 
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Телефон</label>
        <input 
          type="tel" 
          value={phone} 
          onChange={e => setPhone(e.target.value)} 
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          required 
        />
      </div>
      
      {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}
      
      <div className="flex gap-2 pt-2">
        <button 
          type="submit" 
          disabled={loading} 
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
          Сохранить
        </button>
        <button 
          type="button" 
          onClick={() => setIsEditing(false)} 
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}