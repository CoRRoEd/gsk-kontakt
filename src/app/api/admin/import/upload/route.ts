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

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // ==========================================
    // ИМПОРТ ГАРАЖЕЙ
    // ==========================================
    if (type === 'garages') {
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (!row.hasValues) continue;

        // 1:Ряд, 2:Блок, 3:Бокс, 4:Этажность, 5:Площадь
        const rowVal = row.getCell(1).text?.trim();
        const blockVal = row.getCell(2).text?.trim();
        const number = parseInt(row.getCell(3).text?.trim(), 10);
        const floorsNum = parseInt(row.getCell(4).text?.trim(), 10) || 1;
        const areaStr = row.getCell(5).text?.trim();
        const area = areaStr ? parseFloat(areaStr.replace(',', '.')) : null;

        if (!rowVal || !blockVal || isNaN(number)) {
          errorCount++;
          errors.push(`Строка ${i}: Неверные данные (Ряд, Блок или Бокс)`);
          continue;
        }

        try {
          await prisma.garage.upsert({
            where: { row_block_number: { row: rowVal, block: blockVal, number } },
            update: { areaSqm: area ? area : undefined, floors: floorsNum },
            create: { row: rowVal, block: blockVal, number, floors: floorsNum, areaSqm: area ? area : null, status: 'active' }
          });
          successCount++;
        } catch (e) {
          errorCount++;
          errors.push(`Строка ${i}: Ошибка БД`);
        }
      }
    } 
    
    // ==========================================
    // ИМПОРТ СОБСТВЕННИКОВ (создает и гаражи, и людей)
    // ==========================================
        else if (type === 'owners') {
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (!row.hasValues) continue;

        // 1:Ряд, 2:Блок, 3:Бокс, 4:ФИО, 5:Этажность, 6:Площадь, 7:Кадастр, 8:Телефон
        const rowVal = row.getCell(1).text?.trim();
        const blockVal = row.getCell(2).text?.trim();
        const number = parseInt(row.getCell(3).text?.trim(), 10);
        const fullName = row.getCell(4).text?.trim();
        const floorsNum = parseInt(row.getCell(5).text?.trim(), 10) || 1;
        const areaStr = row.getCell(6).text?.trim();
        const area = areaStr ? parseFloat(areaStr.replace(',', '.')) : null;
        const cadastralNumber = row.getCell(7).text?.trim() || null;
        const rawPhone = row.getCell(8).text?.trim();

        // Проверяем только данные ГАРАЖА (Ряд, Блок, Бокс) — они обязательны всегда
        if (!rowVal || !blockVal || isNaN(number)) {
          errorCount++;
          errors.push(`Строка ${i}: Неверные данные гаража (Ряд, Блок или Бокс)`);
          continue;
        }

        try {
          // 1. Создаем или обновляем ГАРАЖ
          const garage = await prisma.garage.upsert({
            where: { row_block_number: { row: rowVal, block: blockVal, number } },
            update: { 
              areaSqm: area ? area : undefined,
              floors: floorsNum,
              cadastralNumber: cadastralNumber || undefined
            },
            create: { 
              row: rowVal, block: blockVal, number, floors: floorsNum, 
              areaSqm: area ? area : null, cadastralNumber: cadastralNumber || null, status: 'active' 
            }
          });

          // 2. Если ФИО или Телефон пустые — гараж создан, идем к следующей строке
          if (!fullName || !rawPhone) {
            successCount++;
            continue; 
          }

          // 3. Если данные есть, проверяем телефон и привязываем собственника
          const phone = normalizePhone(rawPhone);
          if (!isValidPhone(phone)) {
            errorCount++;
            errors.push(`Строка ${i}: Неверный телефон, но гараж создан.`);
            continue;
          }

          let user = await prisma.user.findUnique({ where: { phone } });
          if (!user) {
            user = await prisma.user.create({
              data: { phone, fullName, role: 'owner', status: 'active', phones: { create: { phone, status: 'confirmed', confirmedAt: new Date() } } }
            });
          }

          let owner = await prisma.owner.findUnique({ where: { userId: user.id } });
          if (!owner) {
            owner = await prisma.owner.create({ data: { userId: user.id, fullName, status: 'active' } });
          }

          const existingLink = await prisma.ownerGarage.findFirst({
            where: { ownerId: owner.id, garageId: garage.id, endedAt: null }
          });

          if (!existingLink) {
            await prisma.ownerGarage.create({ data: { ownerId: owner.id, garageId: garage.id, ownershipType: 'owner', share: 1.0 } });
          }

          successCount++;
        } catch (dbError) {
          errorCount++;
          errors.push(`Строка ${i}: Ошибка БД`);
        }
      }
    }
    
    // ==========================================
    // ИМПОРТ ПОКАЗАНИЙ ПУ
    // ==========================================
    else if (type === 'readings') {
      const now = new Date();
      const currentPeriod = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (!row.hasValues) continue;

        // 1:Ряд, 2:Блок, 3:Бокс, 4:Показание T1, 5:Показание T2
        const rowVal = row.getCell(1).text?.trim();
        const blockVal = row.getCell(2).text?.trim();
        const number = parseInt(row.getCell(3).text?.trim(), 10);
        const t1Str = row.getCell(4).text?.trim().replace(',', '.');
        const t2Str = row.getCell(5).text?.trim().replace(',', '.');
        
        const readingT1 = t1Str ? Number(t1Str) : null;
        const readingT2 = t2Str ? Number(t2Str) : null;

        if (!rowVal || !blockVal || isNaN(number) || readingT1 === null) {
          errorCount++;
          errors.push(`Строка ${i}: Неверные данные (Ряд, Блок, Бокс или Показание T1)`);
          continue;
        }

        try {
          const garage = await prisma.garage.findUnique({
            where: { row_block_number: { row: rowVal, block: blockVal, number } },
            include: { meters: { where: { status: 'active' } } }
          });

          if (!garage || garage.meters.length === 0) {
            errorCount++;
            errors.push(`Строка ${i}: Гараж не найден или у него нет активного ПУ`);
            continue;
          }
          
          const meter = garage.meters[0];
          await prisma.reading.upsert({
            where: { meterId_period: { meterId: meter.id, period: currentPeriod } },
            update: { readingT1, readingT2, source: 'import', status: 'submitted' },
            create: { meterId: meter.id, period: currentPeriod, readingT1, readingT2, source: 'import', status: 'submitted' }
          });
          successCount++;
        } catch (e) {
          errorCount++;
          errors.push(`Строка ${i}: Ошибка БД`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        message: `Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`,
        rows: successCount,
        errors: errors.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Import upload error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка при чтении файла' } }, { status: 500 });
  }
}