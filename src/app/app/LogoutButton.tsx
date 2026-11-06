'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Отправляем запрос на очистку сессии
      await fetch('/api/app/auth/logout', { method: 'POST' });
      // Перекидываем на страницу входа
      router.push('/login');
      router.refresh(); // Очищаем кэш роутера Next.js
    } catch (error) {
      console.error('Ошибка выхода:', error);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
      title="Выйти"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
      <span className="hidden sm:inline">Выйти</span>
    </button>
  );
}