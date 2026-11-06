import { PrismaClient, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (optional, comment out if you want to preserve)
  // await prisma.conversationState.deleteMany({});
  // await prisma.transaction.deleteMany({});
  // await prisma.business.deleteMany({});
  // await prisma.user.deleteMany({});

  // Create 1 User
  const user = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      phoneNumber: '628123456789',
    },
  });
  console.log('✅ User created:', user);

  // Create 1 Business
  const business = await prisma.business.create({
    data: {
      userId: user.id,
      name: 'Toko Budi Elektronik',
    },
  });
  console.log('✅ Business created:', business);

  // Create 5 Transactions (mix of Income and Expense)
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        businessId: business.id,
        type: TransactionType.INCOME,
        amount: new Decimal('500000'),
        category: 'Penjualan',
        description: 'Penjualan 5 unit speaker',
        transactionDate: new Date('2026-10-10'),
      },
    }),
    prisma.transaction.create({
      data: {
        businessId: business.id,
        type: TransactionType.EXPENSE,
        amount: new Decimal('150000'),
        category: 'Operasional',
        description: 'Bayar listrik dan internet',
        transactionDate: new Date('2026-10-11'),
      },
    }),
    prisma.transaction.create({
      data: {
        businessId: business.id,
        type: TransactionType.INCOME,
        amount: new Decimal('750000'),
        category: 'Penjualan',
        description: 'Penjualan 10 unit headphone',
        transactionDate: new Date('2026-10-12'),
      },
    }),
    prisma.transaction.create({
      data: {
        businessId: business.id,
        type: TransactionType.EXPENSE,
        amount: new Decimal('200000'),
        category: 'Bahan Baku',
        description: 'Pembelian stok kabel USB',
        transactionDate: new Date('2026-10-12'),
      },
    }),
    prisma.transaction.create({
      data: {
        businessId: business.id,
        type: TransactionType.EXPENSE,
        amount: new Decimal('50000'),
        category: 'Transportasi',
        description: 'Bensin dan parkir pengiriman',
        transactionDate: new Date('2026-10-13'),
      },
    }),
  ]);

  console.log('✅ Transactions created:', transactions.length, 'items');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
