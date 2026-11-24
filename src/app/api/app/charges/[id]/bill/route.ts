import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { renderToBuffer } from '@react-pdf/renderer';
import OwnerBillDocument from '@/lib/pdf/OwnerBillDocument';
import QRCode from 'qrcode';
import React from 'react';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ ok: false }, { status: 401 });

    const { id } = await params;

    const charge = await prisma.charge.findUnique({
      where: { id },
      include: { 
        owner: true, 
        garage: true,
        reading: true 
      }
    });

    if (!charge || charge.owner.userId !== session.userId) {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    let prevT1 = 0;
    
    // ПРОВЕРКА: если есть счетчик (электричество), ищем предыдущие показания
    if (charge.meterId) {
      const prevReading = await prisma.reading.findFirst({
        where: { meterId: charge.meterId, period: { lt: charge.period } },
        orderBy: { period: 'desc' }
      });
      
      if (prevReading) {
        prevT1 = Number(prevReading.readingT1);
      } else if (charge.reading) {
        prevT1 = Number(charge.reading.readingT1) - Number(charge.consumptionT1 || 0);
      }
    }

    // Формируем QR
    const amount = Number(charge.amount);
    const sumInKopecks = Math.round(amount * 100);
    const lcStr = `${charge.garage.row}-${charge.garage.number}`;
    const qrString = `ST00012|Name=ГСК Контакт|PersonalAcc=40703810804000000059|BankName=Отделение 8637 Сбербанка России г. Архангельск|BIC=041117601|CorrespAcc=30101810100000000601|PayeeINN=2902027646|KPP=290202001|Purpose=Оплата по л/с ${lcStr}|Sum=${sumInKopecks}|Payer=${charge.owner.fullName}|PersAcc=${lcStr}`;

    const qrDataUrl = await QRCode.toDataURL(qrString, { margin: 1, width: 200 });

    // Данные для PDF
    const doc = React.createElement(OwnerBillDocument, {
      charge: { 
        period: charge.period, 
        amount: amount, 
        consumptionT1: charge.consumptionT1, 
        tariffT1: charge.tariffT1,
        prevT1: prevT1,
        paymentType: charge.paymentType // <-- Передаем тип платежа
      },
      owner: { fullName: charge.owner.fullName },
      garage: { row: charge.garage.row, number: charge.garage.number },
      qrDataUrl: qrDataUrl
    });

    const buffer = await renderToBuffer(doc as any);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bill_${lcStr}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Bill PDF error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка генерации' } }, { status: 500 });
  }
}