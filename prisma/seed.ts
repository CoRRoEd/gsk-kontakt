import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы...');

  // 1. Создаем Председателя
  const adminPassword = 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { phone: '+79007654321' },
    update: {},
    create: {
      phone: '+79007654321',
      fullName: 'Сидоров Петр Петрович',
      role: 'chairman',
      status: 'active',
      passwordHash: passwordHash,
      phones: {
        create: { phone: '+79007654321', status: 'confirmed', confirmedAt: new Date() },
      },
    },
  });

  // 2. Создаем Собственника (Иванова)
  const ownerUser = await prisma.user.upsert({
    where: { phone: '+79001234567' },
    update: {},
    create: {
      phone: '+79001234567',
      fullName: 'Иванов Иван Иванович',
      role: 'owner',
      status: 'active',
      phones: {
        create: { phone: '+79001234567', status: 'confirmed', confirmedAt: new Date() },
      },
    },
  });

  const owner = await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      fullName: 'Иванов Иван Иванович',
      status: 'active',
    },
  });

  // 3. Создаем Гараж
  const garage = await prisma.garage.upsert({
    where: { block_row_number: { block: 'А', row: 1, number: 17 } },
    update: {},
    create: {
      block: 'А',
      row: 1,
      number: 17,
      status: 'active',
    },
  });

  // Привязываем гараж к Иванову
  const existingLink = await prisma.ownerGarage.findFirst({
    where: { ownerId: owner.id, garageId: garage.id }
  });

  if (!existingLink) {
    await prisma.ownerGarage.create({
      data: { ownerId: owner.id, garageId: garage.id, ownershipType: 'owner', share: 1.0 },
    });
  }

  console.log('✅ База заполнена!');
  console.log('👑 Председатель: +79007654321 (Пароль: admin123)');
  console.log('👤 Собственник: +79001234567');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });