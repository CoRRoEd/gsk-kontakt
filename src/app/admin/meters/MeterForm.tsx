'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, AlertCircle, Search, ChevronDown } from 'lucide-react';

type GarageOption = { id: string; label: string };

export default function MeterForm({ garages }: { garages: GarageOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Состояния формы
  const [garageId, setGarageId] = useState(garages[0]?.id || '');
  const [serialNumber, setSerialNumber] = useState('');
  const [meteringType, setMeteringType] = useState<'single' | 'dual'>('single');
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Состояния для кастомного поиска гаража
  const [isGarageDropdownOpen, setIsGarageDropdownOpen] = useState(false);
  const [garageSearch, setGarageSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем выпадающий список при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGarageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGarages = garages.filter(g => 
    g.label.toLowerCase().includes(garageSearch.toLowerCase())
  );

  const selectedGarageLabel = garages.find(g => g.id === garageId)?.label || 'Выберите гараж';

  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    let formatted = value.replace(',', '.');
    if (formatted.length > 1 && formatted.startsWith('0') && !formatted.startsWith('0.')) {
      formatted = formatted.replace(/^0+/, '');
    }
    setter(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garageId,
          serialNumber,
          meteringType,
          initialReadingT1: Number(t1),
          initialReadingT2: meteringType === 'dual' ? Number(t2) : undefined,
          initialReadingDate: date,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setIsOpen(false);
        setSerialNumber('');
        setT1('');
        setT2('');
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        <Plus size={18} />
        Добавить счётчик
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Шапка */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Новый прибор учёта</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        {/* Тело формы */}
        <div className="p-6 overflow-y-auto">
          <form id="meter-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК ГАРАЖЕЙ */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Гараж</label>
              <button
                type="button"
                onClick={() => setIsGarageDropdownOpen(!isGarageDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-white text-left text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <span className="truncate">{selectedGarageLabel}</span>
                <ChevronDown size={16} className="text-slate-400 shrink-0" />
              </button>

              {isGarageDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 flex flex-col">
                  {/* Поле поиска внутри списка */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Поиск по номеру (например, 32)..."
                        value={garageSearch}
                        onChange={(e) => setGarageSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  {/* Список отфильтрованных гаражей */}
                  <div className="overflow-y-auto flex-1 p-1">
                    {filteredGarages.length === 0 ? (
                      <div className="p-3 text-sm text-center text-slate-500">Ничего не найдено</div>
                    ) : (
                      filteredGarages.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setGarageId(g.id);
                            setIsGarageDropdownOpen(false);
                            setGarageSearch('');
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            garageId === g.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Серийный номер</label>
              <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Например: 12345678" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Тип счётчика</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={meteringType === 'single'} onChange={() => setMeteringType('single')} className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-700">Однотарифный</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={meteringType === 'dual'} onChange={() => setMeteringType('dual')} className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-700">Двухтарифный</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Показание T1</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={t1} 
                  onChange={(e) => handleNumberInput(e.target.value, setT1)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  required 
                />
                {meteringType === 'dual' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Показание T2</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={t2} 
                      onChange={(e) => handleNumberInput(e.target.value, setT2)} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      required 
                    />
                  </div>
                )}
              </div>

              <div className="text-xs text-red-600 border border-red-200 bg-red-50 p-3 rounded-lg flex gap-2">
                <AlertCircle size={20} className="shrink-0 text-red-500" />
                <ul className="space-y-1">
                  <li>• Вносите показания ПУ целым числом с запятой (или точкой).</li>
                  <li>• Не указывайте незначащие нули впереди целого числа показаний ПУ.</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата начального показания</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          </form>
        </div>

        {/* Футер с кнопками */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">
            Отмена
          </button>
          <button type="submit" form="meter-form" disabled={loading || !t1 || (meteringType === 'dual' && !t2)} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading && <Loader2 size={18} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}