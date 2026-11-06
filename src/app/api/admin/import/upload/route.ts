import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) return NextResponse.json({ ok: false, error: { message: 'Файл не найден' } }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) return NextResponse.json({ ok: false, error: { message: 'В файле нет листов' } }, { status: 400 });

    // ==========================================
    // УМНЫЙ ПОИСК КОЛОНОК ПО ЗАГОЛОВКАМ
    // ==========================================
    const headerRow = worksheet.getRow(1);
    const colMap: Record<string, number> = {};

    // Функция нормализации (меняет русские буквы-двойники на английские и убирает пробелы)
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/[т]/g, 't')
        .replace(/[р]/g, 'p')
        .replace(/[а]/g, 'a')
        .replace(/[е]/g, 'e')
        .replace(/[о]/g, 'o')
        .replace(/\s+/g, ''); 
    };

    headerRow.eachCell((cell, colNumber) => {
      const headerText = cell.text?.trim();
      if (headerText) {
        colMap[normalizeText(headerText)] = colNumber;
      }
    });

    // Хелпер для проверки, есть ли колонка (использует нормализацию)
    const hasCol = (name: string) => !!colMap[normalizeText(name)];

    // Проверка наличия обязательных колонок
    if (type === 'garages' && (!hasCol('Блок') || !hasCol('Ряд') || (!hasCol('Номер') && !hasCol('Бокс')))) {
      return NextResponse.json({ ok: false, error: { message: 'В файле не найдены колонки "Блок", "Ряд" или "Номер/Бокс"' } }, { status: 400 });
    }
    if (type === 'readings' && (!hasCol('Блок') || !hasCol('Ряд') || (!hasCol('Бокс') && !hasCol('Номер')) || (!hasCol('Показание T1') && !hasCol('T1')))) {
      return NextResponse.json({ ok: false, error: { message: 'В файле не найдены нужные колонки для показаний (Блок, Ряд, Бокс, Показание T1)' } }, { status: 400 });
    }
    if (type === 'owners' && (!hasCol('Блок') || !hasCol('Ряд') || (!hasCol('Номер') && !hasCol('Бокс')))) {
      return NextResponse.json({ ok: false, error: { message: 'В файле не найдены колонки "Блок", "Ряд" или "Номер/Бокс"' } }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // ==========================================
    // ОБРАБОТКА ДАННЫХ
    // ==========================================
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row.hasValues) continue;

      // Хелпер для получения значения (тоже использует нормализацию)
      const getVal = (name: string) => {
        const colIdx = colMap[normalizeText(name)];
        return colIdx ? row.getCell(colIdx).text?.trim() : undefined;
      };

        const rowNum = parseInt(getVal('Ряд') || '', 10);
        const block = getVal('Блок');

       if (isNaN(rowNum) || !block) {
        errorCount++;
        errors.push(`Строка ${i}: Неверные данные (Ряд или Блок)`); // <-- Теперь Ряд первый 
        continue;
      }

       if (type === 'garages' || type === 'owners') {
        const boxStr = getVal('Бокс') || getVal('Номер');
        const number = parseInt(boxStr || '', 10);
        const floors = parseInt(getVal('Этажность') || '1', 10);
        const cadastral = getVal('Кадастровый номер') || getVal('Кадастр') || null;
        const areaStr = getVal('Площадь');
        const area = areaStr ? parseFloat(areaStr.replace(',', '.')) : null;

        if (isNaN(number)) {
          errorCount++;
          errors.push(`Строка ${i}: Неверный Бокс`);
          continue;
        }

        try {
          const garage = await prisma.garage.upsert({
            // БЫЛО: where: { block_row_number: { block, row: rowNum, number } },
            // СТАЛО:
            where: { row_block_number: { row: rowNum, block, number } },
            update: { areaSqm: area, floors, cadastralNumber: cadastral },
            create: { block, row: rowNum, number, floors, cadastralNumber: cadastral, areaSqm: area, status: 'active' }
          });

          if (type === 'owners') {
            const fullName = getVal('ФИО');
            const rawPhone = getVal('Телефон');

            if (!fullName || !rawPhone) {
              errorCount++;
              errors.push(`Строка ${i}: Нет ФИО или Телефона`);
              continue;
            }

            const phone = normalizePhone(rawPhone);
            if (!isValidPhone(phone)) {
              errorCount++;
              errors.push(`Строка ${i}: Неверный телефон (${rawPhone})`);
              continue;
            }

            let user = await prisma.user.findUnique({ where: { phone } });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  phone, fullName, role: 'owner', status: 'active',
                  phones: { create: { phone, status: 'confirmed', confirmedAt: new Date() } }
                }
              });
            }
            let owner = await prisma.owner.findUnique({ where: { userId: user.id } });
            if (!owner) owner = await prisma.owner.create({ data: { userId: user.id, fullName, status: 'active' } });

            const existingLink = await prisma.ownerGarage.findFirst({ where: { ownerId: owner.id, garageId: garage.id, endedAt: null } });
            if (!existingLink) {
              await prisma.ownerGarage.create({ data: { ownerId: owner.id, garageId: garage.id, ownershipType: 'owner', share: 1.0 } });
            }
          }
          successCount++;
        } catch (e) {
          errorCount++;
          errors.push(`Строка ${i}: Ошибка сохранения`);
        }
      } 
      
      else if (type === 'readings') {
        const boxStr = getVal('Бокс') || getVal('Номер');
        const t1Str = (getVal('Показание T1') || getVal('T1'))?.replace(',', '.');
        const t2Str = (getVal('Показание T2') || getVal('T2'))?.replace(',', '.');
        
        const number = parseInt(boxStr || '', 10);
        const readingT1 = t1Str ? Number(t1Str) : null;
        const readingT2 = t2Str ? Number(t2Str) : null;

        if (isNaN(number) || readingT1 === null) {
          errorCount++;
          errors.push(`Строка ${i}: Неверные данные (Бокс или T1)`);
          continue;
        }

        try {
          const garage = await prisma.garage.findUnique({
            where: { row_block_number: { row: rowNum, block, number } },
            include: { meters: { where: { status: 'active' } } }
          });

          if (!garage || garage.meters.length === 0) {
            errorCount++;
            errors.push(`Строка ${i}: Гараж не найден или нет ПУ`);
            continue;
          }
          
          const meter = garage.meters[0];
          const now = new Date();
          const currentPeriod = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

          await prisma.reading.upsert({
            where: { meterId_period: { meterId: meter.id, period: currentPeriod } },
            update: { readingT1, readingT2, source: 'import', status: 'submitted' },
            create: { meterId: meter.id, period: currentPeriod, readingT1, readingT2, source: 'import', status: 'submitted' }
          });
          successCount++;
        } catch (dbError) {
          errorCount++;
          errors.push(`Строка ${i}: Ошибка БД`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: { message: `Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`, rows: successCount, errors: errors.slice(0, 10) }
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера' } }, { status: 500 });
  }
}