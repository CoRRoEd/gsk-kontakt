import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'garages'; // По умолчанию шаблон гаражей

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Шаблон');

  // Настраиваем заголовки в зависимости от типа
  if (type === 'garages') {
    worksheet.columns = [
      { header: 'Блок', key: 'block', width: 10 },
      { header: 'Ряд', key: 'row', width: 10 },
      { header: 'Номер', key: 'number', width: 10 },
      { header: 'Площадь (кв.м)', key: 'area', width: 15 },
    ];
    // Добавляем пример строки
    worksheet.addRow({ block: 'А', row: 1, number: 17, area: 18.5 });
  } 
  else if (type === 'owners') {
    worksheet.columns = [
      { header: 'ФИО', key: 'fullName', width: 30 },
      { header: 'Телефон', key: 'phone', width: 20 },
      { header: 'Блок', key: 'block', width: 10 },
      { header: 'Ряд', key: 'row', width: 10 },
      { header: 'Номер', key: 'number', width: 10 },
    ];
    worksheet.addRow({ fullName: 'Иванов Иван Иванович', phone: '+79001234567', block: 'А', row: 1, number: 17 });
  }

  // Стилизуем шапку (делаем её жирной и серой)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Генерируем файл в буфер
  const buffer = await workbook.xlsx.writeBuffer();

  // Отдаем файл пользователю
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template_${type}.xlsx"`,
    },
  });
}