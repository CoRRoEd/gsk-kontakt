'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLogoLink() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // 1. Уничтожаем сессию администратора на сервере
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      // 2. Жестко перекидываем на публичную главную страницу
      window.location.href = '/';
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={loading}
      className="w-full text-left block p-6 border-b border-slate-800 shrink-0 hover:bg-slate-800/50 transition-colors group"
      title="Выйти и перейти на главную"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide whitespace-nowrap group-hover:text-blue-400 transition-colors">
            ГСК «Контакт»
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider whitespace-nowrap">
            {loading ? 'Выход...' : 'Панель управления'}
          </p>
        </div>
        {loading && <Loader2 size={16} className="text-blue-400 animate-spin" />}
      </div>
    </button>
  );
}