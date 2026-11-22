'use client';

import { useState } from 'react';
import { ArrowUpFromLine, FileSpreadsheet, Calendar } from 'lucide-react';

export default function ExportPage() {
  // Устанавливаем текущий месяц по умолчанию (например, 2026-10)
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const handleDownload = () => {
    window.location.href = `/api/admin/export/finance?period=${period}`;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Экспорт для 1С</h1>
        <p className="text-sm text-slate-500 mt-1">
          Выгрузка начислений и оплат за выбранный месяц в едином файле Excel.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Финансовый отчет</h2>
            <p className="text-sm text-slate-500">Внутри файла 2 листа: «Начисления» и «Оплаты».</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Выберите расчетный месяц</label>
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
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition font-medium mt-4"
          >
            <ArrowUpFromLine size={18} />
            Скачать отчет для 1С
          </button>
        </div>
      </div>
    </div>
  );
}