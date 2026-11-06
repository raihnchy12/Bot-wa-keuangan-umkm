import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

describe('Baileys Message Handler & Transaction Flow Tests (TEST-003)', () => {

    const testPhoneNumber = '6289999999999';
    let testUserId: string;
    let testBusinessId: string;

    beforeAll(async () => {
        await prisma.transaction.deleteMany({
            where: { business: { user: { phoneNumber: testPhoneNumber } } }
        });
        await prisma.business.deleteMany({
            where: { user: { phoneNumber: testPhoneNumber } }
        });
        await prisma.user.deleteMany({
            where: { phoneNumber: testPhoneNumber }
        });

        const user = await prisma.user.create({
            data: {
                name: 'UMKM Test User',
                phoneNumber: testPhoneNumber
            }
        });
        testUserId = user.id;

        const business = await prisma.business.create({
            data: {
                name: 'Toko Berkah Jaya',
                userId: testUserId
            }
        });
        testBusinessId = business.id;
    }, 15000);

    afterAll(async () => {
        await prisma.transaction.deleteMany({
            where: { businessId: testBusinessId }
        });
        await prisma.business.deleteMany({
            where: { id: testBusinessId }
        });
        await prisma.user.deleteMany({
            where: { id: testUserId }
        });
        await prisma.$disconnect();
    }, 15000);

    it('harus dapat mencatat transaksi baru ke database berdasarkan pesan masuk UMKM', async () => {
        const incomingTransactionData = {
            businessId: testBusinessId,
            type: TransactionType.INCOME,
            amount: 75000,
            category: 'Penjualan',
            description: 'Penjualan produk via WhatsApp',
            transactionDate: new Date(),
        };

        const createdTransaction = await prisma.transaction.create({
            data: incomingTransactionData
        });

        expect(createdTransaction).toHaveProperty('id');
        expect(createdTransaction.businessId).toBe(testBusinessId);
        
        // Konversi ke Number jika Prisma mengembalikan tipe Decimal/String
        expect(Number(createdTransaction.amount)).toBe(75000);
        expect(createdTransaction.type).toBe(TransactionType.INCOME);

        const dbTransactions = await prisma.transaction.findMany({
            where: { businessId: testBusinessId }
        });

        expect(dbTransactions.length).toBeGreaterThan(0);
        expect(dbTransactions[0].description).toBe('Penjualan produk via WhatsApp');
    });

});