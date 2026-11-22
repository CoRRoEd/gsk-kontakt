import ExcelJS from 'exceljs';

export function drawPdk4Sheet(worksheet: ExcelJS.Worksheet, charge: any, settings: any) {
  worksheet.columns = [
    { width: 5 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 5 }
  ];

  const periodStr = new Date(charge.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const amountStr = Number(charge.amount).toFixed(2);
  const [rub, kop] = amountStr.split('.');
  const todayStr = new Date().toLocaleDateString('ru-RU');
  const garageInfo = `Ряд ${charge.garage.row} · Блок ${charge.garage.block} · Бокс ${charge.garage.number}`;

  const drawBlock = (startRow: number, title: string) => {
    let row = startRow;

    worksheet.mergeCells(`A${row}:G${row}`);
    worksheet.getCell(`A${row}`).value = title;
    worksheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    
    worksheet.getCell(`H${row}`).value = 'Форма № ПД-4';
    worksheet.getCell(`H${row}`).font = { size: 10 };
    row += 2;

    worksheet.mergeCells(`A${row}:G${row}`);
    worksheet.getCell(`A${row}`).value = settings?.name || 'ГСК «Контакт»';
    worksheet.getCell(`A${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    
    worksheet.mergeCells(`A${row + 1}:G${row + 1}`);
    worksheet.getCell(`A${row + 1}`).value = '(наименование получателя платежа)';
    worksheet.getCell(`A${row + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`A${row + 1}`).alignment = { horizontal: 'center' };
    row += 3;

    worksheet.mergeCells(`A${row}:C${row}`);
    worksheet.getCell(`A${row}`).value = settings?.inn || '2902027646';
    worksheet.getCell(`A${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`E${row}:G${row}`);
    worksheet.getCell(`E${row}`).value = '40703810804000000059';
    worksheet.getCell(`E${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`E${row}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`A${row + 1}`).value = '(ИНН получателя)';
    worksheet.getCell(`A${row + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`E${row + 1}`).value = '(номер счета)';
    worksheet.getCell(`E${row + 1}`).font = { size: 8, color: 'gray' };
    row += 3;

    worksheet.mergeCells(`A${row}:G${row}`);
    worksheet.getCell(`A${row}`).value = 'Отделение 8637 Сбербанка России г. Архангельск';
    worksheet.getCell(`A${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    
    worksheet.mergeCells(`A${row + 1}:G${row + 1}`);
    worksheet.getCell(`A${row + 1}`).value = '(наименование банка)';
    worksheet.getCell(`A${row + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`A${row + 1}`).alignment = { horizontal: 'center' };
    row += 3;

    worksheet.mergeCells(`A${row}:C${row}`);
    worksheet.getCell(`A${row}`).value = '041117601';
    worksheet.getCell(`A${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`E${row}:G${row}`);
    worksheet.getCell(`E${row}`).value = '30101810100000000601';
    worksheet.getCell(`E${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`E${row}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`A${row + 1}`).value = 'БИК';
    worksheet.getCell(`A${row + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`E${row + 1}`).value = 'Кор./сч.';
    worksheet.getCell(`E${row + 1}`).font = { size: 8, color: 'gray' };
    row += 3;

    worksheet.mergeCells(`A${row}:G${row}`);
    worksheet.getCell(`A${row}`).value = `Оплата электроэнергии за ${periodStr}`;
    worksheet.getCell(`A${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    
    worksheet.mergeCells(`A${row + 1}:G${row + 1}`);
    worksheet.getCell(`A${row + 1}`).value = '(наименование платежа)';
    worksheet.getCell(`A${row + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`A${row + 1}`).alignment = { horizontal: 'center' };
    row += 3;

    worksheet.getCell(`A${row}`).value = 'Ф.И.О. плательщика:';
    worksheet.mergeCells(`B${row}:G${row}`);
    worksheet.getCell(`B${row}`).value = charge.owner.fullName;
    worksheet.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
    row += 2;

    worksheet.getCell(`A${row}`).value = 'Адрес плательщика:';
    worksheet.mergeCells(`B${row}:G${row}`);
    worksheet.getCell(`B${row}`).value = garageInfo;
    worksheet.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
    row += 3;

    worksheet.getCell(`A${row}`).value = 'Сумма платежа:';
    worksheet.getCell(`B${row}`).value = rub;
    worksheet.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`B${row}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`C${row}`).value = 'руб.';
    
    worksheet.getCell(`D${row}`).value = kop;
    worksheet.getCell(`D${row}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`D${row}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`E${row}`).value = 'коп.';
    
    worksheet.getCell(`G${row}`).value = `Дата: ${todayStr}`;
    worksheet.getCell(`G${row}`).alignment = { horizontal: 'right' };
    row += 3;

    worksheet.getCell(`A${row}`).value = 'Плательщик (подпись):';
    worksheet.mergeCells(`B${row}:D${row}`);
    worksheet.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
    
    worksheet.getCell(`E${row}`).value = 'Кассир:';
    worksheet.mergeCells(`F${row}:G${row}`);
    worksheet.getCell(`F${row}`).border = { bottom: { style: 'thin' } };
    
    return row + 3;
  };

  let nextRow = drawBlock(1, 'И з в е щ е н и е');
  worksheet.mergeCells(`A${nextRow}:H${nextRow}`);
  worksheet.getCell(`A${nextRow}`).border = { bottom: { style: 'dashed' } };
  nextRow += 2;
  drawBlock(nextRow, 'К в и т а н ц и я');

  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0, footer: 0 }
  };
}