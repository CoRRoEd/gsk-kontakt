'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Printer, QrCode, X } from 'lucide-react';
import AdjustChargeButton from './AdjustChargeButton';

export default function AdminChargeActions({ charge }: { charge: any }) {
  const [showQR, setShowQR] = useState(false);

  const amount = Number(charge.amount);
  const sumInKopecks = Math.round(amount * 100);
  const payerName = charge.owner.fullName;
  const garageInfo = `${charge.garage.row}-${charge.garage.number}`;
  
  // БЕЗОПАСНАЯ ДАТА ДЛЯ QR (формат 11.2026)
  const safePeriod = new Date(charge.period).toLocaleDateString('ru-RU', { month: '2-digit', year: 'numeric' });

  const qrData = `ST00012|Name=ГСК Контакт|PersonalAcc=40703810804000000059|BankName=Отделение 8637 Сбербанка России г. Архангельск|BIC=041117601|CorrespAcc=30101810100000000601|PayeeINN=2902027646|KPP=290202001|Purpose=Оплата электроэнергии, л/с ${garageInfo}, за ${safePeriod}|Sum=${sumInKopecks}|Payer=${payerName}|PersAcc=${garageInfo}`;

  return (
    <div className="flex justify-center items-center gap-1">
      <a
        href={`/api/admin/charges/${charge.id}/invoice`}
        target="_blank"
        rel="noreferrer"
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        title="Скачать счёт (PDF)"
      >
        <Printer size={18} />
      </a>

      <button
        onClick={() => setShowQR(true)}
        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
        title="Показать QR-код"
      >
        <QrCode size={18} />
      </button>

      {charge.status === 'awaiting_payment' && (
        <AdjustChargeButton chargeId={charge.id} amount={amount} />
      )}

      {showQR && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
            <button onClick={() => setShowQR(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700">
              <X size={20}/>
            </button>
            <h3 className="font-bold text-slate-900 mb-1">QR-код для оплаты</h3>
            <p className="text-sm text-slate-500 mb-4">{payerName}</p>
            
            <div className="bg-white p-4 rounded-xl border border-slate-100 inline-block mb-4 shadow-sm">
              <QRCode value={qrData} size={200} />
            </div>
            
            <p className="font-bold text-2xl text-slate-900">{amount.toFixed(2)} ₽</p>
            <p className="text-xs text-slate-400 mt-2">Гараж: Ряд {charge.garage.row} · Бокс {charge.garage.number}</p>
          </div>
        </div>
      )}
    </div>
  );
}