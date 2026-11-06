'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/app/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!data.ok) {
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

      router.push(data.data.redirect || '/app');
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
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 900 123-45-67"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
                autoFocus
              />
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
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Получить код'}
            </button>
          </form>
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
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
            >
              Изменить номер
            </button>
          </form>
        )}

      </div>
    </main>
  );
}