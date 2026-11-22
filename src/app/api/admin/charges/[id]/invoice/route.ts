import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { drawPdk4Sheet } from '@/lib/excel/pdk4';

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

    if (!charge) return NextResponse.json({ ok: false, error: { message: 'Не найдено' } }, { status: 404 });

    const settings = await prisma.cooperativeSettings.findFirst();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Квитанция');

    drawPdk4Sheet(worksheet, charge, settings);

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="invoice_${charge.id.substring(0,8)}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { message: 'Ошибка' } }, { status: 500 });
  }
}