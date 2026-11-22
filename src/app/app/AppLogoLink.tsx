'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLogoLink() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Обычный POST без лишних параметров, которые могут блокироваться браузером
      await fetch('/api/app/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      // В любом случае (даже если сервер упал) перекидываем на главную
      window.location.href = '/';
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={loading}
      className="flex items-center gap-2 text-blue-600 font-bold text-lg hover:text-blue-800 transition-colors shrink-0"
      title="Выйти и перейти на главную"
    >
      <img 
        src="/garage-icon.png" 
        alt="ГСК Контакт" 
        className="w-10 h-10 object-contain" 
      />
      <span className="hidden md:inline">
        {loading ? 'Выход...' : 'ГСК «Контакт»'}
      </span>
      {loading && <Loader2 size={16} className="animate-spin ml-1" />}
    </button>
  );
}