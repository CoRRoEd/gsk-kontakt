'use client';

import { useState } from 'react';
import { Printer, Loader2, X } from 'lucide-react';

export default function PrintAllButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // По умолчанию ставим с 1 по 1 ряд
  const [startRow, setStartRow] = useState('1');
  const [endRow, setEndRow] = useState('1');

  const handlePrint = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Переходим по ссылке API с параметрами
    window.location.href = `/api/admin/charges/print-all?startRow=${startRow}&endRow=${endRow}`;
    
    // Закрываем окно через 3 секунды (когда файл начнет скачиваться)
    setTimeout(() => {
      setLoading(false);
      setIsOpen(false);
    }, 3000);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
      >
        <Printer size={18} />
        Печать пачкой
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Пакетная печать</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-500 mb-4">
            Будет сформирован Excel-файл, где каждая квитанция лежит на отдельном листе. Укажите диапазон рядов для печати.
          </p>
          
          <form id="print-form" onSubmit={handlePrint} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">С ряда</label>
                <input 
                  type="number" 
                  min="1"
                  value={startRow} 
                  onChange={e => setStartRow(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">По ряд</label>
                <input 
                  type="number" 
                  min={startRow}
                  value={endRow} 
                  onChange={e => setEndRow(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  required 
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
          <button type="submit" form="print-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} 
            Сформировать
          </button>
        </div>
      </div>
    </div>
  );
}