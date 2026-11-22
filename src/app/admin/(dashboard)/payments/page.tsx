import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import ConfirmButton from './ConfirmButton';
import { FileText, ExternalLink } from 'lucide-react';

export default async function AdminPaymentsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/admin/login');

  const payments = await prisma.payment.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    include: {
      charge: { include: { garage: true } },
      user: true,
    }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Заявки на оплату</h1>
        <p className="text-sm text-slate-500">Чеки, ожидающие проверки бухгалтером</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Дата</th>
              <th className="p-4 font-medium">Собственник</th>
              <th className="p-4 font-medium">Гараж</th>
              <th className="p-4 font-medium">Сумма</th>
              <th className="p-4 font-medium">Чек</th>
              <th className="p-4 font-medium">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">Нет новых заявок на оплату.</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">{p.createdAt.toLocaleDateString('ru-RU')}</td>
                  <td className="p-4 font-medium text-slate-900">{p.user?.fullName || 'Неизвестно'}</td>
                  <td className="p-4 text-slate-600">
                    {p.charge ? `Блок ${p.charge.garage.block} · ${p.charge.garage.number}` : '—'}
                  </td>
                  <td className="p-4 font-bold text-slate-900">{Number(p.amount).toFixed(2)} ₽</td>
                  <td className="p-4">
                    {p.receiptUrl ? (
                      <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <FileText size={16} /> Открыть <ExternalLink size={14} />
                      </a>
                    ) : 'Нет файла'}
                  </td>
                  <td className="p-4">
                    <ConfirmButton paymentId={p.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}