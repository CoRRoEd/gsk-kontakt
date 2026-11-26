'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Wallet, Receipt } from 'lucide-react';
import Link from 'next/link';

interface ActiveCharge {
  id: string;
  amount: number;
  paymentType: string;
}

export default function RequestInvoiceButton({ 
  garageId, 
  activeCharges = [] 
}: { 
  garageId: string; 
  activeCharges: ActiveCharge[]; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Если есть неоплаченные счета
  if (activeCharges.length > 0) {
    // Если счет один — ведем на страницу оплаты этого счета
    if (activeCharges.length === 1) {
      return (
        <Link
          href={`/app/charges/${activeCharges[0].id}/pay`}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Wallet size={16} />
          Оплатить счёт
        </Link>
      );
    }

    // Если долгов несколько — ведем на страницу массовой оплаты
    const totalAmount = activeCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
    
    return (
      <Link
        href={`/app/charges/pay-all?garageId=${garageId}`}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
      >
        <Receipt size={16} />
        Оплатить долги ({activeCharges.length}) на {totalAmount.toLocaleString('ru-RU')} ₽
      </Link>
    );
  }

  // 2. Если счетов нет, но есть переданные показания, запрашиваем формирование счёта
  const handleRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/app/charges/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garageId })
      });
      const data = await res.json();
      
      if (data.ok) {
        // После расчета перекидываем сразу на страницу оплаты
        router.push(`/app/charges/${data.data.chargeId}/pay`);
      } else {
        setError(data.error.message);
        setLoading(false);
      }
    } catch {
      setError('Ошибка сети');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleRequest}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition border border-slate-200 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        Получить счёт
      </button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </div>
  );
}