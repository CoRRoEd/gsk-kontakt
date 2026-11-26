import { PrismaClient, UserRole, UserStatus, GarageStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы...');

  const passwordHash = await bcrypt.hash('admin123', 12);

  // 1. Создаем Председателя (без профиля собственника)
  await prisma.user.upsert({
    where: { phone: '+79007654321' },
    update: {},
    create: {
      phone: '+79007654321',
      fullName: 'Сидоров Петр Петрович',
      role: UserRole.chairman,
      status: UserStatus.active,
      passwordHash: passwordHash,
      phones: {
        create: { phone: '+79007654321', status: 'confirmed', confirmedAt: new Date() },
      },
    },
  });

  // 2. Создаем Бухгалтера
  await prisma.user.upsert({
    where: { phone: '+79007654322' },
    update: {},
    create: {
      phone: '+79007654322',
      fullName: 'Петрова Анна Сергеевна',
      role: UserRole.accountant,
      status: UserStatus.active,
      passwordHash: passwordHash,
      phones: {
        create: { phone: '+79007654322', status: 'confirmed', confirmedAt: new Date() },
      },
    },
  });

  // 3. Создаем Электрика
  await prisma.user.upsert({
    where: { phone: '+79007654323' },
    update: {},
    create: {
      phone: '+79007654323',
      fullName: 'Николаев Николай Николаевич',
      role: UserRole.electrician,
      status: UserStatus.active,
      passwordHash: passwordHash,
      phones: {
        create: { phone: '+79007654323', status: 'confirmed', confirmedAt: new Date() },
      },
    },
  });

  // 4. Создаем Собственника (Иванова) и его гараж
  const ownerUser = await prisma.user.upsert({
    where: { phone: '+79001234567' },
    update: {},
    create: {
      phone: '+79001234567',
      fullName: 'Иванов Иван Иванович',
      role: UserRole.owner,
      status: UserStatus.active,
      phones: {
        create: { phone: '+79001234567', status: 'confirmed', confirmedAt: new Date() },
      },
    },
  });

  const owner = await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: { userId: ownerUser.id, fullName: 'Иванов Иван Иванович', status: 'active' },
  });

  // 5. Создаем гараж
  let garage1 = await prisma.garage.findFirst({
    where: { row: '1', block: '1', number: 17 }
  });

  if (!garage1) {
    garage1 = await prisma.garage.create({
      data: { 
        row: '1', 
        block: '1', 
        number: 17, 
        status: GarageStatus.active, 
        floors: 1 
      },
    });
  }

  const existingLink = await prisma.ownerGarage.findFirst({
    where: { ownerId: owner.id, garageId: garage1.id, endedAt: null }
  });
  
  if (!existingLink) {
    await prisma.ownerGarage.create({
      data: { 
        ownerId: owner.id, 
        garageId: garage1.id, 
        ownershipType: 'owner', 
        share: '1.0' 
      },
    });
  }

  console.log('✅ База заполнена!');
  console.log('👑 Председатель: +79007654321 (Пароль: admin123)');
  console.log('💰 Бухгалтер:    +79007654322 (Пароль: admin123)');
  console.log('⚡ Электрик:     +79007654323 (Пароль: admin123)');
  console.log('👤 Собственник:  +79001234567 (Иванов, гараж №17)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });