import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    // Получаем период из запроса (например, ?period=2026-10)
    const searchParams = request.nextUrl.searchParams;
    const periodStr = searchParams.get('period'); 
    
    if (!periodStr) {
      return NextResponse.json({ ok: false, error: { message: 'Не указан период' } }, { status: 400 });
    }

    const [year, month] = periodStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // 1. Собираем НАЧИСЛЕНИЯ за этот период
    const charges = await prisma.charge.findMany({
      where: {
        period: startDate,
      },
      include: {
        garage: true,
        owner: true,
      }
    });

    // 2. Собираем ОПЛАТЫ (подтвержденные) за этот период
    const payments = await prisma.payment.findMany({
      where: {
        status: 'succeeded',
        paidAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        user: true,
        charge: {
          include: { garage: true }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();

    // ==========================================
    // ЛИСТ 1: Начисления
    // ==========================================
    const sheetCharges = workbook.addWorksheet('Начисления');
    sheetCharges.columns = [
      { header: 'Период', key: 'period', width: 15 },
      { header: 'Блок', key: 'block', width: 10 },
      { header: 'Ряд', key: 'row', width: 10 },
      { header: 'Бокс', key: 'number', width: 10 },
      { header: 'ФИО Собственника', key: 'owner', width: 30 },
      { header: 'Расход T1', key: 't1', width: 15 },
      { header: 'Расход T2', key: 't2', width: 15 },
      { header: 'Тариф T1', key: 'tariff1', width: 15 },
      { header: 'Итоговая сумма', key: 'amount', width: 15 },
    ];

    charges.forEach(c => {
      sheetCharges.addRow({
        period: c.period.toLocaleDateString('ru-RU', { month: '2-digit', year: 'numeric' }),
        block: c.garage.block,
        row: c.garage.row,
        number: c.garage.number,
        owner: c.owner.fullName,
        t1: Number(c.consumptionT1 || 0),
        t2: c.consumptionT2 ? Number(c.consumptionT2) : '',
        tariff1: Number(c.tariffT1 || 0),
        amount: Number(c.amount),
      });
    });

    // ==========================================
    // ЛИСТ 2: Оплаты
    // ==========================================
    const sheetPayments = workbook.addWorksheet('Оплаты');
    sheetPayments.columns = [
      { header: 'Дата оплаты', key: 'date', width: 15 },
      { header: 'ФИО Собственника', key: 'owner', width: 30 },
      { header: 'Блок', key: 'block', width: 10 },
      { header: 'Ряд', key: 'row', width: 10 },
      { header: 'Бокс', key: 'number', width: 10 },
      { header: 'Сумма оплаты', key: 'amount', width: 15 },
      { header: 'Способ', key: 'provider', width: 15 },
    ];

    payments.forEach(p => {
      sheetPayments.addRow({
        date: p.paidAt ? p.paidAt.toLocaleDateString('ru-RU') : '',
        owner: p.user?.fullName || 'Неизвестно',
        block: p.charge?.garage.block || '',
        row: p.charge?.garage.row || '',
        number: p.charge?.garage.number || '',
        amount: Number(p.amount),
        provider: p.provider === 'manual' ? 'Чек по QR' : p.provider,
      });
    });

    // Стилизация обеих шапок
    [sheetCharges, sheetPayments].forEach(sheet => {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="finance_report_${periodStr}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export finance error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка экспорта' } }, { status: 500 });
  }
}