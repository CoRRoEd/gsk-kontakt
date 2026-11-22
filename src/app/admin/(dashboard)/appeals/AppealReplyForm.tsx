'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

export default function AppealReplyForm({ appealId, currentStatus, currentResolution }: { appealId: string, currentStatus: string, currentResolution: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [status, setStatus] = useState(currentStatus === 'new' ? 'in_progress' : currentStatus);
  const [resolution, setResolution] = useState(currentResolution || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/appeals/${appealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution }),
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
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
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Статус</label>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="in_progress">В работе</option>
            <option value="resolved">Решено</option>
            <option value="rejected">Отклонено</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Ответ собственнику</label>
          <input 
            type="text" 
            value={resolution} 
            onChange={e => setResolution(e.target.value)}
            placeholder="Напишите ответ..." 
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required 
          />
        </div>
      </div>

      {error && <div className="text-red-600 text-xs bg-red-50 p-2 rounded">{error}</div>}
      {success && <div className="text-green-600 text-xs bg-green-50 p-2 rounded flex items-center gap-1"><CheckCircle2 size={14}/> Ответ отправлен!</div>}

      <button 
        type="submit" 
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Отправить ответ
      </button>
    </form>
  );
}