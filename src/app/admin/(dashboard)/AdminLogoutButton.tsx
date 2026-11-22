'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка выхода:', error);
    } finally {
      // Жесткий редирект на публичную главную
      window.location.href = '/';
    }
  };

  return (
    <button 
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
    >
      {loading ? <Loader2 size={20} className="animate-spin shrink-0" /> : <LogOut size={20} className="shrink-0" />}
      <span className="font-medium">Выйти</span>
    </button>
  );
}