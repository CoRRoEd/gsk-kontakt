'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Gauge } from 'lucide-react';
import ReplaceMeterForm from './ReplaceMeterForm';

export default function EditGarageForm({ garage, meters }: { garage: any, meters: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [floors, setFloors] = useState(garage.floors.toString());
  const [area, setArea] = useState(garage.areaSqm ? garage.areaSqm.toString() : '');
  const [cadastral, setCadastral] = useState(garage.cadastralNumber || '');
  const [notes, setNotes] = useState(garage.notes || '');

  // ВОТ ЭТОТ БЛОК: Он срабатывает, когда данные на сервере обновились (например, после очистки)
  useEffect(() => {
    setFloors(garage.floors.toString());
    setArea(garage.areaSqm ? garage.areaSqm.toString() : '');
    setCadastral(garage.cadastralNumber || '');
    setNotes(garage.notes || '');
  }, [garage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/garages/${garage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          floors: Number(floors), 
          areaSqm: area ? Number(area) : null, 
          cadastralNumber: cadastral || null, 
          notes: notes || null 
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
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
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-4">Характеристики объекта</h2>
      
      <form onSubmit={handleSubmit} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Этажность</label>
            <select value={floors} onChange={e => setFloors(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="1">1 этаж</option>
              <option value="2">2 этажа</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Площадь (кв.м)</label>
            <input type="number" step="0.1" value={area} onChange={e => setArea(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Кадастровый номер</label>
            <input type="text" value={cadastral} onChange={e => setCadastral(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Приборы учёта</label>
          <div className="flex flex-wrap gap-2">
            {meters.length === 0 ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-400 italic">
                Нет активных счётчиков.
              </div>
            ) : (
              meters.map((m) => (
                <div key={m.id} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white shadow-sm flex items-center gap-2">
                  <Gauge size={14} className="text-slate-400" />
                  <span className="font-medium text-slate-700">№ {m.serialNumber}</span>
                  <span className="text-xs text-slate-400">({m.meteringType === 'single' ? '1-тар.' : '2-тар.'})</span>
                </div>
              ))
            )}
            <ReplaceMeterForm 
              garageId={garage.id} 
              oldMeter={meters[0] ? { id: meters[0].id, serialNumber: meters[0].serialNumber } : null} 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Примечания</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Нет примечаний..." />
        </div>

        {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}
        
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
            Сохранить
          </button>
          {success && <span className="text-sm text-green-600 font-medium">Сохранено!</span>}
        </div>
      </form>
    </div>
  );
}