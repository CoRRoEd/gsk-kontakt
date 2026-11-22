'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, CheckCircle2, Info } from 'lucide-react';

export default function ExportPage() {
  // По умолчанию выбираем текущий месяц (например, 2026-11)
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    // Переходим по ссылке API, браузер сам начнет скачивание
    window.location.href = `/api/admin/export/finance?period=${period}`;
    
    // Сбрасываем индикатор загрузки через 2 секунды
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="text-slate-400" />
          Экспорт данных для 1С
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Выгрузка начислений и подтвержденных оплат в формате Excel.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        
        <div className="flex items-start gap-4 mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
          <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Что будет в файле?</p>
            <p>Скачанный Excel-файл будет содержать <strong>два листа</strong>:</p>
            <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5">
              <li>Лист «Начисления» — все сформированные счета за месяц.</li>
              <li>Лист «Оплаты» — все чеки, которые вы подтвердили.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Выберите расчетный период
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full pl-10 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={!period || loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition font-medium disabled:opacity-50"
          >
            {loading ? (
              <CheckCircle2 size={18} className="animate-pulse" />
            ) : (
              <Download size={18} />
            )}
            {loading ? 'Формирование файла...' : 'Скачать отчет для 1С'}
          </button>
        </div>
      </div>
    </div>
  );
}