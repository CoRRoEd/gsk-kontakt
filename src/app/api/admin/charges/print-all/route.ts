import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { drawPdk4Sheet } from '@/lib/excel/pdk4';

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId || session.role === 'owner') {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startRowParam = searchParams.get('startRow');
    const endRowParam = searchParams.get('endRow');

    // Получаем все неоплаченные счета
    let charges = await prisma.charge.findMany({
      where: { status: 'awaiting_payment' },
      include: { owner: true, garage: true },
      orderBy: [{ garage: { row: 'asc' } }, { garage: { number: 'asc' } }]
    });

    // Фильтруем по диапазону рядов, если он задан
    if (startRowParam && endRowParam) {
      const startRow = parseInt(startRowParam, 10);
      const endRow = parseInt(endRowParam, 10);
      
      if (!isNaN(startRow) && !isNaN(endRow)) {
        charges = charges.filter(c => {
          // Извлекаем число из ряда (например, из "6/1" берем 6)
          const rowNum = parseInt(c.garage.row, 10);
          return !isNaN(rowNum) && rowNum >= startRow && rowNum <= endRow;
        });
      }
    }

    if (charges.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: { message: 'В выбранном диапазоне нет неоплаченных счетов' } 
      }, { status: 400 });
    }

    const settings = await prisma.cooperativeSettings.findFirst();
    const workbook = new ExcelJS.Workbook();

    // Для каждого счета создаем отдельный лист
    charges.forEach((charge) => {
      // Название листа: Р1-Б17 (Ряд-Бокс)
      const sheetName = `Р${charge.garage.row}-Б${charge.garage.number}`;
      const worksheet = workbook.addWorksheet(sheetName);
      drawPdk4Sheet(worksheet, charge, settings);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="invoices_rows_${startRowParam}-${endRowParam}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Print all error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка генерации файла' } }, { status: 500 });
  }
}