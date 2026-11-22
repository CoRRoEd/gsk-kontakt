'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ConfirmButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirm('Вы уверены, что деньги поступили на счет ГСК?')) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        alert('Ошибка при подтверждении');
      }
    } catch {
      alert('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleConfirm} 
      disabled={loading}
      className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 w-full sm:w-auto"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
      Подтвердить
    </button>
  );
}