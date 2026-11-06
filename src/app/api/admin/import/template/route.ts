import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'owners';

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('ДАННЫЕ');
  const defaultDataColor = 'FF1F2937';

  if (type === 'owners') {
    worksheet.columns = [
      { header: 'Ряд', key: 'row', width: 10, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Блок', key: 'block', width: 10, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Бокс', key: 'number', width: 10, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Этажность', key: 'floors', width: 15, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Площадь', key: 'area', width: 15, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Кадастровый номер', key: 'cadastral', width: 25, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'ФИО', key: 'fullName', width: 35, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Телефон', key: 'phone', width: 20, style: { font: { color: { argb: defaultDataColor } } } },
    ];
    worksheet.addRow({ row: 6, block: '1', number: 1, floors: 1, area: 18.5, cadastral: '29:01:000000:00', fullName: 'Иванов Иван Иванович', phone: '+79001234567' });
  } 
  else if (type === 'readings') {
    worksheet.columns = [
      { header: 'Ряд', key: 'row', width: 10, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Блок', key: 'block', width: 10, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Бокс', key: 'number', width: 10, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Показание T1', key: 't1', width: 20, style: { font: { color: { argb: defaultDataColor } } } },
      { header: 'Показание T2', key: 't2', width: 20, style: { font: { color: { argb: defaultDataColor } } } },
    ];
    worksheet.addRow({ row: 6, block: '1', number: 1, t1: 12200, t2: 4500 });
  }

  // Стилизация шапки
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.getCell('A1').note = 'ВНИМАНИЕ!\nНе изменяйте названия колонок в первой строке.\nПорядок колонок можно менять как угодно.';
  
  const exampleRow = worksheet.getRow(2);
  exampleRow.font = { italic: true, color: { argb: 'FF64748B' } };

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template_${type}.xlsx"`,
    },
  });
}