'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/app/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка выхода:', error);
    } finally {
      // Всегда перекидываем на главную
      window.location.href = '/';
    }
  };

  return (
    <button 
      type="button"
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