'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Upload, Loader2, ArrowLeft, CheckCircle2, Copy } from 'lucide-react';
import Link from 'next/link';

export default function PayForm({ chargeId, amount, period }: { chargeId: string, amount: number, period: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Формируем строку для QR-кода по стандарту ГОСТ (ST00012)
  // Сумма должна быть в копейках!
  const sumInKopecks = Math.round(amount * 100);
  const qrData = `ST00012|Name=ГСК Контакт|PersonalAcc=40703810804000000059|BankName=Отделение 8637 Сбербанка России г. Архангельск|BIC=041117601|CorrespAcc=30101810100000000601|PayeeINN=2902027646|KPP=290202001|Purpose=Оплата электроэнергии за ${period}|Sum=${sumInKopecks}`;

  // 2. Функция для копирования реквизитов
  const copyToClipboard = () => {
    const text = `Получатель: ГСК "Контакт"\nИНН: 2902027646\nКПП: 290202001\nБИК: 041117601\nР/с: 40703810804000000059\nБанк: Отделение 8637 Сбербанка России г. Архангельск\nК/с: 30101810100000000601\nСумма: ${amount} руб.\nНазначение: Оплата электроэнергии за ${period}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chargeId', chargeId);

    try {
      const res = await fetch('/api/app/payments/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/app/charges'), 2000);
      } else {
        setError(data.error?.message || 'Ошибка загрузки');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Чек отправлен!</h2>
        <p className="text-slate-500 text-sm">Бухгалтер проверит его, и оплата будет учтена.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      
      {/* QR-код */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-sm text-slate-500 mb-4 text-center">
          Отсканируйте QR-код в приложении банка.<br/>
          Сумма и реквизиты подставятся автоматически.
        </p>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <QRCode value={qrData} size={180} />
        </div>
        <p className="mt-4 font-bold text-slate-900 text-2xl">{amount.toLocaleString('ru-RU')} ₽</p>
      </div>

      {/* Реквизиты текстом */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Реквизиты для перевода</p>
          <button type="button" onClick={copyToClipboard} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700">
            <Copy size={14} /> {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          <p><span className="font-medium">Получатель:</span> ГСК "Контакт"</p>
          <p><span className="font-medium">ИНН:</span> 2902027646, <span className="font-medium">КПП:</span> 290202001</p>
          <p><span className="font-medium">Р/с:</span> 40703810804000000059</p>
          <p><span className="font-medium">Банк:</span> Отделение 8637 Сбербанка России г. Архангельск</p>
          <p><span className="font-medium">БИК:</span> 041117601, <span className="font-medium">К/с:</span> 30101810100000000601</p>
          <p><span className="font-medium">Назначение:</span> Оплата электроэнергии за {period}</p>
        </div>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">Затем</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* Загрузка чека */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-700 font-medium">
          После оплаты прикрепите чек из банка:
        </p>
        
        <input 
          type="file" 
          accept="image/*,.pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => e.target.files && setFile(e.target.files[0])}
        />

        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
            file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <Upload className={`mx-auto mb-2 ${file ? 'text-blue-500' : 'text-slate-400'}`} size={28} />
          <p className="text-sm font-medium text-slate-700">
            {file ? file.name : 'Нажмите, чтобы выбрать чек'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Фото или PDF</p>
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

        <button 
          type="submit"
          disabled={!file || loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition flex justify-center items-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Отправка...' : 'Я оплатил, отправить чек'}
        </button>
      </form>
    </div>
  );
}