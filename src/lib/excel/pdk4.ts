import ExcelJS from 'exceljs';

export function drawPdk4Sheet(worksheet: ExcelJS.Worksheet, charge: any, settings: any) {
  // Задаем ширину колонок (чтобы визуально соответствовало бланку)
  const colWidths = [5, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
  colWidths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  const periodStr = new Date(charge.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const amountStr = Number(charge.amount).toFixed(2);
  const [rub, kop] = amountStr.split('.');
  const todayStr = new Date().toLocaleDateString('ru-RU');
  const garageInfo = `Ряд ${charge.garage.row} · Блок ${charge.garage.block} · Бокс ${charge.garage.number}`;

  const drawHalf = (startRow: number, title: string) => {
    let r = startRow;

    // Верхний правый угол: Форма № ПД-4
    worksheet.mergeCells(`P${r}:R${r}`);
    worksheet.getCell(`P${r}`).value = 'Форма № ПД-4';
    worksheet.getCell(`P${r}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`P${r}`).font = { size: 10 };
    r += 1;

    // Строка с Идентификатором и КПП
    worksheet.getCell(`J${r}`).value = 'Идентификатор';
    worksheet.getCell(`P${r}`).value = 'КПП';
    r += 1;

    // Заголовок (Извещение / Квитанция)
    worksheet.mergeCells(`B${r}:D${r}`);
    worksheet.getCell(`B${r}`).value = title;
    worksheet.getCell(`B${r}`).font = { size: 14 };
    r += 2;

    // Наименование получателя
    worksheet.mergeCells(`B${r}:M${r}`);
    worksheet.getCell(`B${r}`).value = settings?.name || 'ГСК «Контакт»';
    worksheet.getCell(`B${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
    
    worksheet.mergeCells(`B${r + 1}:J${r + 1}`);
    worksheet.getCell(`B${r + 1}`).value = '(наименование получателя платежа)';
    worksheet.getCell(`B${r + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`B${r + 1}`).alignment = { horizontal: 'center' };
    r += 3;

    // ИНН и Р/с
    worksheet.mergeCells(`B${r}:F${r}`);
    worksheet.getCell(`B${r}`).value = settings?.inn || '2902027646';
    worksheet.getCell(`B${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`B${r}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`H${r}:M${r}`);
    worksheet.getCell(`H${r}`).value = '40703810804000000059';
    worksheet.getCell(`H${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`H${r}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`B${r + 1}`).value = '(ИНН получателя)';
    worksheet.getCell(`B${r + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`H${r + 1}`).value = '(номер счета)';
    worksheet.getCell(`H${r + 1}`).font = { size: 8, color: 'gray' };
    
    worksheet.mergeCells(`P${r}:R${r}`);
    worksheet.getCell(`P${r}`).value = '(код ОКТМО)';
    worksheet.getCell(`P${r}`).font = { size: 8, color: 'gray' };
    r += 3;

    // Банк
    worksheet.mergeCells(`B${r}:M${r}`);
    worksheet.getCell(`B${r}`).value = 'Отделение 8637 Сбербанка России г. Архангельск';
    worksheet.getCell(`B${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
    
    worksheet.mergeCells(`B${r + 1}:J${r + 1}`);
    worksheet.getCell(`B${r + 1}`).value = '(наименование банка получателя платежа)';
    worksheet.getCell(`B${r + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`B${r + 1}`).alignment = { horizontal: 'center' };
    r += 3;

    // БИК и Кор/счет
    worksheet.getCell(`B${r}`).value = 'БИК:';
    worksheet.mergeCells(`C${r}:F${r}`);
    worksheet.getCell(`C${r}`).value = '041117601';
    worksheet.getCell(`C${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`C${r}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`H${r}`).value = 'Кор./сч.:';
    worksheet.mergeCells(`I${r}:M${r}`);
    worksheet.getCell(`I${r}`).value = '30101810100000000601';
    worksheet.getCell(`I${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`I${r}`).alignment = { horizontal: 'center' };
    r += 3;

    // Назначение
    worksheet.mergeCells(`B${r}:M${r}`);
    worksheet.getCell(`B${r}`).value = `Оплата электроэнергии за ${periodStr}`;
    worksheet.getCell(`B${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`B${r}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`B${r + 1}:J${r + 1}`);
    worksheet.getCell(`B${r + 1}`).value = '(наименование платежа)';
    worksheet.getCell(`B${r + 1}`).font = { size: 8, color: 'gray' };
    worksheet.getCell(`B${r + 1}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`P${r}:R${r}`);
    worksheet.getCell(`P${r}`).value = '(КБК)';
    worksheet.getCell(`P${r}`).font = { size: 8, color: 'gray' };
    r += 3;

    // ФИО
    worksheet.getCell(`B${r}`).value = 'Ф.И.О. плательщика:';
    worksheet.mergeCells(`E${r}:M${r}`);
    worksheet.getCell(`E${r}`).value = charge.owner.fullName;
    worksheet.getCell(`E${r}`).border = { bottom: { style: 'thin' } };
    r += 2;

    // Адрес
    worksheet.getCell(`B${r}`).value = 'Адрес плательщика:';
    worksheet.mergeCells(`E${r}:M${r}`);
    worksheet.getCell(`E${r}`).value = garageInfo;
    worksheet.getCell(`E${r}`).border = { bottom: { style: 'thin' } };
    r += 2;

    // Сумма
    worksheet.getCell(`B${r}`).value = 'Сумма платежа:';
    
    worksheet.mergeCells(`E${r}:H${r}`);
    worksheet.getCell(`E${r}`).value = rub;
    worksheet.getCell(`E${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`E${r}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`I${r}`).value = 'руб.';
    
    worksheet.mergeCells(`J${r}:L${r}`);
    worksheet.getCell(`J${r}`).value = kop;
    worksheet.getCell(`J${r}`).border = { bottom: { style: 'thin' } };
    worksheet.getCell(`J${r}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`M${r}`).value = 'коп.';

    worksheet.mergeCells(`P${r}:R${r}`);
    worksheet.getCell(`P${r}`).value = `Дата: ${todayStr}`;
    r += 2;

    // Подпись
    worksheet.getCell(`B${r}`).value = 'Подпись плательщика:';
    worksheet.mergeCells(`E${r}:M${r}`);
    worksheet.getCell(`E${r}`).border = { bottom: { style: 'thin' } };
    r += 2;

    // Кассир
    worksheet.getCell(`B${r}`).value = 'Кассир';
    worksheet.mergeCells(`E${r}:M${r}`);
    worksheet.getCell(`E${r}`).border = { bottom: { style: 'thin' } };
    
    return r + 2;
  };

  // Рисуем Извещение
  let nextRow = drawHalf(1, 'И з в е щ е н и е');

  // Линия отреза
  worksheet.mergeCells(`A${nextRow}:R${nextRow}`);
  worksheet.getCell(`A${nextRow}`).border = { bottom: { style: 'dashed' } };
  nextRow += 1;

  // Рисуем Квитанцию
  drawHalf(nextRow, 'К в и т а н ц и я');

  // Настройки печати
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0, footer: 0 }
  };
}