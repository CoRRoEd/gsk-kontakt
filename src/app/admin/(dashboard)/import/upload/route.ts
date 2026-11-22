import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db';
import { normalizePhone, isValidPhone } from '@/lib/phone';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ ok: false, error: { message: 'Файл не найден' } }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    // Берем первый лист
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return NextResponse.json({ ok: false, error: { message: 'В файле нет листов' } }, { status: 400 });
    }

    // ==========================================
    // ЗАЩИТА: Проверка содержимого (шапки) таблицы
    // ==========================================
    const headerRow = worksheet.getRow(1);
    const secondColumnHeader = headerRow.getCell(2).text?.trim(); // Берем название 2-й колонки

    if (type === 'garages') {
      if (secondColumnHeader !== 'Ряд') {
        return NextResponse.json({ 
          ok: false, 
          error: { message: `Вы выбрали "Гаражи", но файл не похож на шаблон гаражей. Во 2-й колонке должно быть слово "Ряд", а у вас "${secondColumnHeader || 'пусто'}". Пожалуйста, проверьте галочку.` } 
        }, { status: 400 });
      }
    } 
    else if (type === 'owners') {
      if (secondColumnHeader !== 'Телефон') {
        return NextResponse.json({ 
          ok: false, 
          error: { message: `Вы выбрали "Собственники", но файл не похож на шаблон собственников. Во 2-й колонке должно быть слово "Телефон", а у вас "${secondColumnHeader || 'пусто'}". Пожалуйста, проверьте галочку.` } 
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ ok: false, error: { message: 'Неизвестный тип импорта' } }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Обработка ГАРАЖЕЙ
    if (type === 'garages') {
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (!row.hasValues) continue; // Пропускаем пустые строки

        const block = row.getCell(1).text?.trim();
        const rowNum = parseInt(row.getCell(2).text?.trim(), 10);
        const number = parseInt(row.getCell(3).text?.trim(), 10);
        const areaStr = row.getCell(4).text?.trim();
        const area = areaStr ? parseFloat(areaStr) : null;

        if (!block || isNaN(rowNum) || isNaN(number)) {
          errorCount++;
          errors.push(`Строка ${i}: Неверные данные (Блок, Ряд или Номер)`);
          continue;
        }

        try {
          await prisma.garage.upsert({
            where: { block_row_number: { block, row: rowNum, number } },
            update: { areaSqm: area ? area : undefined },
            create: { block, row: rowNum, number, areaSqm: area ? area : null, status: 'active' }
          });
          successCount++;
        } catch (e) {
          errorCount++;
          errors.push(`Строка ${i}: Ошибка при сохранении в БД`);
        }
      }
    } 
    
    // Обработка СОБСТВЕННИКОВ
    else if (type === 'owners') {
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (!row.hasValues) continue; // Пропускаем пустые строки

        const fullName = row.getCell(1).text?.trim();
        const rawPhone = row.getCell(2).text?.trim();
        const block = row.getCell(3).text?.trim();
        const rowNum = parseInt(row.getCell(4).text?.trim(), 10);
        const number = parseInt(row.getCell(5).text?.trim(), 10);

        if (!fullName || !rawPhone || !block || isNaN(rowNum) || isNaN(number)) {
          errorCount++;
          errors.push(`Строка ${i}: Заполнены не все поля`);
          continue;
        }

        const phone = normalizePhone(rawPhone);
        if (!isValidPhone(phone)) {
          errorCount++;
          errors.push(`Строка ${i}: Неверный формат телефона (${rawPhone})`);
          continue;
        }

        try {
          // 1. Ищем гараж
          const garage = await prisma.garage.findUnique({
            where: { block_row_number: { block, row: rowNum, number } }
          });

          if (!garage) {
            errorCount++;
            errors.push(`Строка ${i}: Гараж ${block}-${rowNum}-${number} не найден. Сначала загрузите гаражи.`);
            continue;
          }

          // 2. Создаем или ищем пользователя (аккаунт для входа)
          let user = await prisma.user.findUnique({ where: { phone } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                phone,
                fullName,
                role: 'owner',
                status: 'active',
                phones: {
                  create: { phone, status: 'confirmed', confirmedAt: new Date() }
                }
              }
            });
          }

          // 3. Создаем или ищем профиль собственника
          let owner = await prisma.owner.findUnique({ where: { userId: user.id } });
          if (!owner) {
            owner = await prisma.owner.create({
              data: { userId: user.id, fullName, status: 'active' }
            });
          }

          // 4. Привязываем к гаражу (если еще не привязан)
          const existingLink = await prisma.ownerGarage.findFirst({
            where: { ownerId: owner.id, garageId: garage.id }
          });

          if (!existingLink) {
            await prisma.ownerGarage.create({
              data: {
                ownerId: owner.id,
                garageId: garage.id,
                ownershipType: 'owner',
                share: 1.0
              }
            });
          }

          successCount++;
        } catch (dbError) {
          errorCount++;
          errors.push(`Строка ${i}: Ошибка БД`);
        }
      }
    }

    // Возвращаем успешный результат
    return NextResponse.json({
      ok: true,
      data: {
        message: `Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`,
        rows: successCount,
        errors: errors.slice(0, 10) // Отдаем первые 10 ошибок
      }
    });

  } catch (error) {
    console.error('Import upload error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка при чтении файла' } }, { status: 500 });
  }
}