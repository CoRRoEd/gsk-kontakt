'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Преобразуем Decimal из Prisma в обычные числа для инпутов
  const [formData, setFormData] = useState({
    name: initialData?.name || 'ГСК «Контакт»',
    address: initialData?.address || '',
    inn: initialData?.inn || '',
    ogrn: initialData?.ogrn || '',
    normKwhPerMonth: initialData?.normKwhPerMonth ? Number(initialData.normKwhPerMonth).toString() : '200',
    averageMonths: initialData?.averageMonths?.toString() || '3',
    maxMonthsWithoutReadings: initialData?.maxMonthsWithoutReadings?.toString() || '3',
    readingPeriodStartDay: initialData?.readingPeriodStartDay?.toString() || '25',
    readingPeriodEndDay: initialData?.readingPeriodEndDay?.toString() || '5',
    paymentDueDays: initialData?.paymentDueDays?.toString() || '10',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Преобразуем строки обратно в числа для API
    const payload = {
      ...formData,
      normKwhPerMonth: Number(formData.normKwhPerMonth),
      averageMonths: Number(formData.averageMonths),
      maxMonthsWithoutReadings: Number(formData.maxMonthsWithoutReadings),
      readingPeriodStartDay: Number(formData.readingPeriodStartDay),
      readingPeriodEndDay: Number(formData.readingPeriodEndDay),
      paymentDueDays: Number(formData.paymentDueDays),
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      } else {
        setError(data.error?.message || 'Ошибка сохранения');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Реквизиты */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Реквизиты организации</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Название</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Адрес</label>
            <input name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">ИНН</label>
            <input name="inn" value={formData.inn} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">ОГРН</label>
            <input name="ogrn" value={formData.ogrn} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Правила расчетов */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Правила расчётов и подачи показаний ПУ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Норматив (кВт·ч/мес)</label>
            <input type="number" name="normKwhPerMonth" value={formData.normKwhPerMonth} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Среднее за (мес)</label>
            <input type="number" name="averageMonths" value={formData.averageMonths} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Лимит без показаний (мес)</label>
            <input type="number" name="maxMonthsWithoutReadings" value={formData.maxMonthsWithoutReadings} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Начало приема (день)</label>
            <input type="number" name="readingPeriodStartDay" value={formData.readingPeriodStartDay} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Конец приема (день)</label>
            <input type="number" name="readingPeriodEndDay" value={formData.readingPeriodEndDay} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Срок оплаты (дней)</label>
            <input type="number" name="paymentDueDays" value={formData.paymentDueDays} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
      
      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
          Сохранить настройки
        </button>
        {success && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={16}/> Сохранено!</span>}
      </div>
    </form>
  );
}