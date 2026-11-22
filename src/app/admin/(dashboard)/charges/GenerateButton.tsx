'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GenerateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleGenerate = async () => {
    if (!confirm('Сформировать начисления на основе новых показаний и действующего тарифа?')) return;
    
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/charges/generate', { method: 'POST' });
      const data = await res.json();
      
      setResult({ ok: data.ok, message: data.ok ? data.data.message : data.error.message });
      
      if (data.ok) router.refresh();
    } catch {
      setResult({ ok: false, message: 'Ошибка сети' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button 
        onClick={handleGenerate} 
        disabled={loading}
        className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50 font-medium"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
        Сформировать начисления
      </button>
      {result && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${result.ok ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
          {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {result.message}
        </div>
      )}
    </div>
  );
}