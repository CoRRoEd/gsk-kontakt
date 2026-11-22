import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { renderToBuffer } from '@react-pdf/renderer';
import ReceiptDocument from '@/lib/pdf/ReceiptDocument';
import React from 'react';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Проверяем авторизацию
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ ok: false, error: { message: 'Не авторизован' } }, { status: 401 });
    }

    const { id } = await params;

    // 2. Находим квитанцию и подтягиваем данные пользователя (для ФИО в PDF)
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: { user: true } 
    });

    if (!receipt) {
      return NextResponse.json({ ok: false, error: { message: 'Квитанция не найдена' } }, { status: 404 });
    }

    // 3. Проверка прав доступа: либо это владелец квитанции, либо сотрудник
    const isOwner = receipt.userId === session.userId;
    const isStaff = session.role && ['accountant', 'chairman', 'admin'].includes(session.role);

    if (!isOwner && !isStaff) {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    // 4. Получаем актуальные настройки ГСК для шапки квитанции
    const settings = await prisma.cooperativeSettings.findFirst();

    // 5. Формируем React-элемент для PDF
    const doc = React.createElement(ReceiptDocument, {
      receipt: {
        number: receipt.number,
        issuedAt: receipt.issuedAt,
        amount: Number(receipt.amount),
        paymentId: receipt.paymentId
      },
      ownerName: receipt.user?.fullName || 'Собственник',
      cooperative: {
        name: settings?.name || 'ГСК «Контакт»',
        inn: settings?.inn || 'ИНН не указан',
        address: settings?.address || 'Адрес не указан'
      }
    });

    // 6. Генерируем PDF в буфер (в памяти)
    const buffer = await renderToBuffer(doc);

    // 7. Отдаем файл браузеру
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt_${receipt.number}.pdf"`,
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка при генерации PDF' } }, { status: 500 });
  }
}