'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function AcknowledgeButton({ newsId }: { newsId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      await fetch(`/api/app/news/${newsId}/acknowledge`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAcknowledge}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 shrink-0"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
      Я ознакомлен
    </button>
  );
}