'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Состояние для проверки "Сотрудник + Собственник"
  const [isStaffOwner, setIsStaffOwner] = useState(false);

  async function handleRequestCode(confirmOwner = false) {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/app/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, isOwnerConfirm: confirmOwner }),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.error?.code === 'STAFF_IS_OWNER') {
          setIsStaffOwner(true);
          setError(data.error.message);
          return;
        }
        setError(data.error?.message || 'Ошибка');
        return;
      }

      setStep('code');
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/app/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error?.message || 'Ошибка');
        return;
      }

      window.location.href = data.data.redirect || '/app';
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-600 transition">
            <ArrowLeft size={16} /> На главную
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center text-slate-900">
          Вход в личный кабинет
        </h1>
        <p className="text-slate-500 text-center mb-8 text-sm">
          ГСК «Контакт»
        </p>

        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setIsStaffOwner(false); // Сбрасываем выбор при изменении номера
                  setError('');
                }}
                placeholder="+7 900 123-45-67"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className={`text-sm p-3 rounded-xl border ${isStaffOwner ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error}
              </div>
            )}

            {/* ЛОГИКА ВЫБОРА ДЛЯ СОТРУДНИКА-СОБСТВЕННИКА */}
            {isStaffOwner ? (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-2">
                <p className="text-sm text-amber-900 mb-3 font-medium flex items-center gap-2">
                  <ShieldAlert size={18} /> Выберите способ входа:
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    type="button" 
                    onClick={() => handleRequestCode(true)} 
                    disabled={loading} 
                    className="w-full bg-amber-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-amber-600 transition flex justify-center items-center gap-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Войти как Собственник
                  </button>
                  <a 
                    href="/admin/login" 
                    className="w-full bg-white text-amber-700 border border-amber-300 py-3 rounded-lg text-sm font-medium hover:bg-amber-100 transition text-center flex justify-center items-center"
                  >
                    Войти как Администратор
                  </a>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestCode(false)}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition flex justify-center items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Получить код'}
              </button>
            )}
          </div>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Код из SMS
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="______"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                Код отправлен на {phone}
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Войти'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setCode('');
                setError('');
                setIsStaffOwner(false);
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
            >
              Изменить номер
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
          <a href="/" className="text-sm text-slate-400 hover:text-slate-600 transition">
            ← На главную
          </a>
          <a href="/admin/login" className="text-xs text-slate-300 hover:text-slate-500 transition">
            Вход для персонала (Админ)
          </a>
        </div>

      </div>
    </main>
  );
}