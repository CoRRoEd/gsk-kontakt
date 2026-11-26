'use client';

import { useState } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Тип уведомления, который мы будем передавать из серверного компонента
type NotificationPayload = {
  id: string;
  title: string;
  message: string;
  url: string;
};

export default function NotificationBell({ notifications }: { notifications: NotificationPayload[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
          <div className="p-3 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">
            Уведомления ({notifications.length})
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">Нет новых уведомлений</p>
            ) : (
              notifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={notif.url}
                  onClick={() => setIsOpen(false)}
                  className="block p-4 border-b border-slate-50 hover:bg-red-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm group-hover:text-red-700">{notif.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}