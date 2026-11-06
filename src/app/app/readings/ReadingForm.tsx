'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// Описываем, какие данные придут из базы
type MeterData = {
  id: string;
  serialNumber: string;
  meteringType: 'single' | 'dual';
  garage: { block: string; number: number };
  previousReading: { t1: number; t2: number | null } | null;
};

export default function ReadingForm({ meters }: { meters: MeterData[] }) {
  const router = useRouter();
  
  const [selectedMeterId, setSelectedMeterId] = useState(meters[0]?.id || '');
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  const selectedMeter = meters.find(m => m.id === selectedMeterId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter) return;

    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const res = await fetch('/api/app/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterId: selectedMeterId,
          readingT1: Number(t1),
          readingT2: selectedMeter.meteringType === 'dual' ? Number(t2) : undefined,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setSuccess(data.data);
        setT1('');
        setT2('');
        router.refresh(); // Обновляем данные на странице (чтобы подтянулись новые предыдущие показания)
      } else {
        setError(data.error?.message || 'Ошибка при передаче');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (meters.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
        <p className="text-slate-500">У вас нет зарегистрированных счётчиков.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Выбор гаража/счетчика */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Выберите гараж</label>
          <select
            value={selectedMeterId}
            onChange={(e) => {
              setSelectedMeterId(e.target.value);
              setT1('');
              setT2('');
              setError('');
              setSuccess(null);
            }}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {meters.map((m) => (
              <option key={m.id} value={m.id}>
                Блок {m.garage.block} · Бокс {m.garage.number} (Счётчик № {m.serialNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Информация о предыдущих показаниях */}
        {selectedMeter && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Предыдущие показания:</p>
            <div className="flex gap-6 font-medium text-slate-900">
              <span>T1: {selectedMeter.previousReading?.t1 || 0} кВт·ч</span>
              {selectedMeter.meteringType === 'dual' && (
                <span>T2: {selectedMeter.previousReading?.t2 || 0} кВт·ч</span>
              )}
            </div>
          </div>
        )}

        {/* Поля ввода */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Текущее показание T1 {selectedMeter?.meteringType === 'dual' && '(День)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={t1}
              onChange={(e) => setT1(e.target.value)}
              placeholder="Например: 12500"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {selectedMeter?.meteringType === 'dual' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Текущее показание T2 (Ночь)
              </label>
              <input
                type="number"
                step="0.01"
                value={t2}
                onChange={(e) => setT2(e.target.value)}
                placeholder="Например: 4500"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          )}
        </div>

        {/* Сообщения об ошибках или успехе */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium">{success.message}</p>
              <p className="text-xs mt-1">
                Расход: {success.reading.consumptionT1} кВт·ч
                {success.reading.consumptionT2 !== null && ` (День) / ${success.reading.consumptionT2} кВт·ч (Ночь)`}
              </p>
            </div>
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={loading || !t1 || (selectedMeter?.meteringType === 'dual' && !t2)}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition flex justify-center items-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Отправка...' : 'Передать показания'}
        </button>
      </form>
    </div>
  );
}