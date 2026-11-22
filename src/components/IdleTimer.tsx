'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 минут
const WARNING_BEFORE = 60 * 1000; // Предупреждение за 1 минуту

export default function IdleTimer({ logoutUrl }: { logoutUrl: string }) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const performLogout = useCallback(async () => {
    try {
      // redirect: 'manual' не дает fetch следовать за редиректом сервера, просто гасит сессию
      await fetch(logoutUrl, { method: 'POST', redirect: 'manual' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      // Жесткий редирект на публичную главную
      window.location.href = '/';
    }
  }, [logoutUrl]);

  const resetTimer = useCallback(() => {
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);
    setCountdown(60);
    
    // Ставим таймер на появление предупреждения (9 минут)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Запускаем обратный отсчет 60 секунд
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            performLogout(); // Время вышло — выходим
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT - WARNING_BEFORE);
  }, [performLogout]);

  useEffect(() => {
    resetTimer();
    
    // Слушаем любую активность (клик, движение мыши, ввод с клавиатуры, скролл, тач)
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // Троттлинг (защита от слишком частого сброса таймера)
    let lastCall = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastCall > 5000) { // Не чаще 1 раза в 5 секунд
        lastCall = now;
        resetTimer();
      }
    };
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    
    // Если вкладка скрыта, а потом открыта — сбрасываем таймер (значит, человек вернулся)
    const handleVisibility = () => {
      if (!document.hidden) resetTimer();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimer]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-in fade-in zoom-in duration-200">
        <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Сессия завершится через {countdown} сек.
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Вы неактивны долгое время. В целях безопасности мы выйдем из системы.
        </p>
        <button
          onClick={resetTimer}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Я здесь, продолжить работу
        </button>
      </div>
    </div>
  );
}