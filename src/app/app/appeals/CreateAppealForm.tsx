'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, AlertCircle } from 'lucide-react';

export default function CreateAppealForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [topic, setTopic] = useState('other');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/app/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, body }),
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setSubject('');
        setBody('');
        router.refresh(); // Обновляем список обращений
        setTimeout(() => setSuccess(false), 5000); // Скрываем успех через 5 сек
      } else {
        setError(data.error.message);
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Новое обращение</h2>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Тема обращения</label>
        <select 
          value={topic} 
          onChange={e => setTopic(e.target.value)} 
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="access">Доступ в личный кабинет</option>
          <option value="metering">Проблема с показаниями / счётчиком</option>
          <option value="payment">Вопрос по оплате</option>
          <option value="negative_reading">Отрицательный расход</option>
          <option value="meter_replacement">Замена ПУ</option>
          <option value="other">Другое</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Краткий заголовок</label>
        <input 
          type="text" 
          value={subject} 
          onChange={e => setSubject(e.target.value)} 
          placeholder="Например: Неверно указан расход" 
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          required 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Сообщение</label>
        <textarea 
          value={body} 
          onChange={e => setBody(e.target.value)} 
          placeholder="Опишите ситуацию подробно..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          rows={4}
          required
        />
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
      {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">✅ Обращение успешно отправлено!</div>}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        Отправить обращение
      </button>
    </form>
  );
}