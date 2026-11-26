'use client';

import { useState } from 'react';
import ReplaceMeterForm from './ReplaceMeterForm';
import { Wrench, ChevronDown, ChevronUp, Gauge, CheckCircle2 } from 'lucide-react';

// Описываем тип данных, который приходит из серверного компонента (page.tsx)
interface MeterData {
  id: string;
  serialNumber: string;
  meteringType: string;
  initialReadingT1: number;
  initialReadingT2: number | null;
  status: string;
  prevReadingT1: number;
  prevReadingT2: number | null;
}

export default function GarageMeterAction({ 
  garageId, 
  activeMeter 
}: { 
  garageId: string; 
  activeMeter: MeterData; 
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      
      {/* Информационная карточка текущего счетчика */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-5 rounded-xl border border-slate-200 gap-4">
        
        <div className="flex items-start gap-4">
          <div className="bg-white p-3 rounded-full border border-slate-200 shadow-sm text-blue-600">
            <Gauge size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg text-slate-900">
                Заводской №: {activeMeter.serialNumber}
              </p>
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                Активен
              </span>
            </div>
            
            <div className="text-sm text-slate-600 mt-1 space-y-0.5">
              <p>
                Тип: <span className="font-medium text-slate-800">{activeMeter.meteringType === 'single' ? 'Однотарифный' : 'Двухтарифный'}</span>
              </p>
              <p>
                Начальные показания: <span className="font-medium text-slate-800">
                  T1={activeMeter.initialReadingT1}
                  {activeMeter.initialReadingT2 !== null ? ` / T2=${activeMeter.initialReadingT2}` : ''}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-green-500" />
                Последние переданные: T1={activeMeter.prevReadingT1}
                {activeMeter.prevReadingT2 !== null ? ` / T2=${activeMeter.prevReadingT2}` : ''}
              </p>
            </div>
          </div>
        </div>
        
        {/* Кнопка открытия/закрытия формы */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm shrink-0 ${
            showForm 
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Wrench size={18} />
          {showForm ? 'Отменить замену' : 'Заменить ПУ'}
          {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Форма замены (появляется по клику) */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <ReplaceMeterForm 
            garageId={garageId} 
            activeMeterId={activeMeter.id} 
          />
        </div>
      )}
      
    </div>
  );
}