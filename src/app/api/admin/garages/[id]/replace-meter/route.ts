import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Проверка прав доступа (Электрик, Председатель или Админ)
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const allowedRoles = ['electrician', 'chairman', 'admin'];
    
    if (!session.userId || !session.role || !allowedRoles.includes(session.role)) {
      return NextResponse.json({ ok: false, error: { message: 'Доступ запрещен' } }, { status: 403 });
    }

    const { id: garageId } = await params;
    const formData = await request.formData();
    
    // 2. Извлекаем данные из формы
    const oldMeterId = formData.get('oldMeterId') as string;
    const oldFinalT1 = formData.get('oldFinalT1') as string;
    const oldFinalT2 = formData.get('oldFinalT2') as string | null;
    const sealStatus = formData.get('sealStatus') as string;
    const reason = formData.get('reason') as string;
    
    const newSerial = formData.get('newSerial') as string;
    const newInitialT1 = formData.get('newInitialT1') as string;
    const newInitialT2 = formData.get('newInitialT2') as string | null;
    
    const oldPhoto = formData.get('oldPhoto') as File | null;
    const newPhoto = formData.get('newPhoto') as File | null;

    // Базовая валидация
    if (!oldMeterId || !oldFinalT1 || !sealStatus || !newSerial || !newInitialT1) {
      return NextResponse.json({ ok: false, error: { message: 'Заполнены не все обязательные поля' } }, { status: 400 });
    }

    if (!oldPhoto || !newPhoto) {
      return NextResponse.json({ ok: false, error: { message: 'Необходимо прикрепить фото старого и нового ПУ' } }, { status: 400 });
    }

    // 3. Сохранение файлов (в локальную папку public/uploads)
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const saveFile = async (file: File, prefix: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${prefix}_${crypto.randomUUID()}.${ext}`;
      await writeFile(join(uploadDir, fileName), buffer);
      return `/uploads/${fileName}`;
    };

    const oldMeterPhotoUrl = await saveFile(oldPhoto, 'meter_old');
    const newMeterPhotoUrl = await saveFile(newPhoto, 'meter_new');

    // 4. Транзакция
    const result = await prisma.$transaction(async (tx) => {
      // А) Архивация старого счетчика
      await tx.meter.update({
        where: { id: oldMeterId },
        data: { 
          status: 'replaced', 
          removedAt: new Date() 
        }
      });

      // Б) Создание нового счетчика
      const isDual = !!oldFinalT2 || !!newInitialT2;
      const newMeter = await tx.meter.create({
        data: {
          garageId,
          serialNumber: newSerial,
          meteringType: isDual ? 'dual' : 'single',
          initialReadingT1: Number(newInitialT1),
          initialReadingT2: newInitialT2 ? Number(newInitialT2) : null,
          initialReadingDate: new Date(),
          status: 'active'
        }
      });

      // В) Создание записи о замене
      const replacement = await tx.meterReplacement.create({
        data: {
          oldMeterId,
          newMeterId: newMeter.id,
          replacedAt: new Date(),
          oldFinalReadingT1: Number(oldFinalT1),
          oldFinalReadingT2: oldFinalT2 ? Number(oldFinalT2) : null,
          reason: reason || 'Плановая замена',
          sealStatus,
          oldMeterPhotoUrl,
          newMeterPhotoUrl,
          performedById: session.userId
        }
      });

      // Г) Логика Протокола-2 (Если пломба нарушена)
      if (sealStatus === 'compromised') {
        // Ищем Председателя для назначения проблемы
        const chairman = await tx.user.findFirst({ 
          where: { role: 'chairman', status: 'active' } 
        });

        // Создаем запись в журнале проблем
        await tx.problemGarage.create({
          data: {
            garageId,
            type: 'seal_violation',
            severity: 'high',
            details: { 
              comment: 'Пломба нарушена/отсутствует. Замена ПУ по протоколу-2',
              oldMeterId: oldMeterId,
              newMeterId: newMeter.id,
              performedBy: session.userId,
              oldMeterPhotoUrl: oldMeterPhotoUrl
            },
            status: 'new',
            assignedToId: chairman?.id 
          }
        });

        // Создаем уведомление для Председателя (если он найден)
        if (chairman) {
          await tx.notification.create({
            data: {
              userId: chairman.id,
              type: 'SYSTEM_ALERT',
              channel: 'internal',
              payload: {
                title: 'Нарушение целостности ПУ',
                message: `Электрик зафиксировал нарушение пломбы. Замена ПУ по протоколу-2.`,
                url: `/admin/garages/${garageId}`
              },
              status: 'queued'
            }
          });
        }
      }

      return { replacement, newMeter };
    });

    return NextResponse.json({ 
      ok: true, 
      data: { 
        message: 'Замена ПУ успешно оформлена',
        newMeterId: result.newMeter.id
      } 
    });

  } catch (error) {
    console.error('Replace meter error:', error);
    return NextResponse.json({ ok: false, error: { message: 'Ошибка сервера при замене ПУ' } }, { status: 500 });
  }
}