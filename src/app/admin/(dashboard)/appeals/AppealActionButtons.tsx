'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wrench, Send, Warehouse } from 'lucide-react';
import Link from 'next/link';

export default function AppealActionButtons({ 
  appealId, 
  status, 
  isElectrician, 
  isChairman, 
  assignedToId,
  garageId // <-- Прокидываем ID гаража, чтобы электрик знал, куда идти
}: { 
  appealId: string; 
  status: string; 
  isElectrician: boolean; 
  isChairman: boolean; 
  assignedToId: string | null;
  garageId?: string; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [comment, setComment] = useState('');

  // === ДЕЙСТВИЕ: ПРЕДСЕДАТЕЛЬ ПЕРЕДАЕТ ЭЛЕКТРИКУ ===
  const handleAssign = async () => {
    setLoading(true);
    await fetch(`/api/admin/appeals/${appealId}/assign`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }) 
    });
    setLoading(false);
    setShowAssignForm(false);
    router.refresh();
  };

  // Если заявка уже решена
  if (status === 'resolved') {
    return <p className="text-sm text-green-600 font-medium text-center bg-green-50 p-2 rounded-lg">Заявка закрыта</p>;
  }

  // ==========================================
  // ЛОГИКА ДЛЯ ПРЕДСЕДАТЕЛЯ
  // ==========================================
  if (isChairman) {
    if (status === 'new') {
      if (showAssignForm) {
        return (
          <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <textarea
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={3}
              placeholder="Комментарий для электрика (например: взять новый ПУ, приехать после 18:00...)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={handleAssign} disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Отправить
              </button>
              <button onClick={() => setShowAssignForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
                Отмена
              </button>
            </div>
          </div>
        );
      }
      return (
        <button onClick={() => setShowAssignForm(true)} className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition">
          <Wrench size={16} /> Передать Электрику
        </button>
      );
    }
    return <p className="text-xs text-slate-500 text-center bg-slate-50 p-2 rounded-lg border border-slate-100">Ожидает действий электрика</p>;
  }

  // ==========================================
  // ЛОГИКА ДЛЯ ЭЛЕКТРИКА
  // ==========================================
  if (isElectrician && status === 'in_progress' && assignedToId) {
    // Просто ведем его в карточку гаража, где он сделает замену и нажмет "Сохранить"
    return (
      <Link 
        href={`/admin/garages/${garageId}`}
        className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition"
      >
        <Warehouse size={16} /> Перейти к гаражу
      </Link>
    );
  }

  return null;
}