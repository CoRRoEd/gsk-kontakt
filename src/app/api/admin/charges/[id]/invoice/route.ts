import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoiceDocument from '@/lib/pdf/InvoiceDocument'; // <-- Импортируем наш шаблон
import React from 'react';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id } = await params;

    const charge = await prisma.charge.findUnique({
      where: { id },
      include: { owner: true, garage: true }
    });

    if (!charge) {
      return NextResponse.json({ ok: false, error: { message: 'Начисление не найдено' } }, { status: 404 });
    }

    const settings = await prisma.cooperativeSettings.findFirst();

    // Создаем React-элемент из нашего шаблона
    const doc = React.createElement(InvoiceDocument, {
      charge: { 
        id: charge.id, 
        period: charge.period, 
        amount: Number(charge.amount), 
        consumptionT1: charge.consumptionT1, 
        tariffT1: charge.tariffT1 
      },
      owner: { fullName: charge.owner.fullName },
      garage: { row: charge.garage.row, block: charge.garage.block, number: charge.garage.number },
      cooperative: {
        name: settings?.name || 'ГСК «Контакт»',
        inn: settings?.inn || 'ИНН не указан',
        address: settings?.address || 'Адрес не указан'
      }
    });

    const buffer = await renderToBuffer(doc as any);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${charge.id.substring(0,8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice PDF error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка генерации счета' } }, { status: 500 });
  }
}