'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'password' | 'code';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/step1-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message || 'Ошибка');
        return;
      }
      setStep('password');
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/step2-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
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

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/step3-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message || 'Ошибка');
        return;
      }
      router.push(data.data.redirect || '/admin');
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <p className="text-gray-500 text-sm mt-1">ГСК «Контакт»</p>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Телефон</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 123-45-67" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-700 outline-none" required autoFocus />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 transition">{loading ? 'Проверка...' : 'Продолжить'}</button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-700 outline-none" required autoFocus />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 transition">{loading ? 'Проверка...' : 'Продолжить'}</button>
            <button type="button" onClick={() => { setStep('phone'); setPassword(''); setError(''); }} className="w-full text-sm text-gray-500 hover:text-gray-700">← Назад</button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleStep3} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Код из SMS (2FA)</label>
              <input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="______" className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-gray-700 outline-none" required autoFocus />
              <p className="text-xs text-gray-500 mt-2">Код отправлен на {phone}</p>
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 transition">{loading ? 'Проверка...' : 'Войти'}</button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← На главную</a>
        </div>
      </div>
    </main>
  );
}