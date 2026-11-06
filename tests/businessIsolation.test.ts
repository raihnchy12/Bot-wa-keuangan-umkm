import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Repositories & Business Isolation Tests (TEST-002)', () => {

    const testPhoneA = '6281111111111';
    const testPhoneB = '6282222222222';

    let userAId: string;
    let userBId: string;
    let businessAId: string;
    let businessBId: string;

    // Set timeout 15 detik khusus untuk beforeAll agar tidak timeout
    beforeAll(async () => {
        try {
            // 1. Bersihkan data tes sebelumnya berdasarkan nomor telepon
            await prisma.transaction.deleteMany({
                where: {
                    business: {
                        user: {
                            phoneNumber: { in: [testPhoneA, testPhoneB] }
                        }
                    }
                }
            });
            await prisma.business.deleteMany({
                where: {
                    user: {
                        phoneNumber: { in: [testPhoneA, testPhoneB] }
                    }
                }
            });
            await prisma.user.deleteMany({
                where: { phoneNumber: { in: [testPhoneA, testPhoneB] } }
            });

            // 2. Buat User A & User B
            const userA = await prisma.user.create({
                data: { name: 'User A', phoneNumber: testPhoneA }
            });
            userAId = userA.id;

            const userB = await prisma.user.create({
                data: { name: 'User B', phoneNumber: testPhoneB }
            });
            userBId = userB.id;

            // 3. Buat Business untuk masing-masing User
            const businessA = await prisma.business.create({
                data: { name: 'Toko UMKM A', userId: userAId }
            });
            businessAId = businessA.id;

            const businessB = await prisma.business.create({
                data: { name: 'Toko UMKM B', userId: userBId }
            });
            businessBId = businessB.id;

            // 4. Masukkan transaksi dummy untuk Bisnis A
            await prisma.transaction.create({
                data: {
                    businessId: businessAId,
                    type: TransactionType.INCOME,
                    amount: 50000,
                    category: 'Penjualan',
                    description: 'Penjualan Produk A',
                    transactionDate: new Date(),
                }
            });

            // 5. Masukkan transaksi dummy untuk Bisnis B
            await prisma.transaction.create({
                data: {
                    businessId: businessBId,
                    type: TransactionType.INCOME,
                    amount: 100000,
                    category: 'Penjualan',
                    description: 'Penjualan Produk B',
                    transactionDate: new Date(),
                }
            });
        } catch (error) {
            console.error('Error during beforeAll setup:', error);
            throw error;
        }
    }, 15000); // <-- Timeout dinaikkan jadi 15 detik

    afterAll(async () => {
        // Hanya jalankan delete jika ID sudah berhasil dibuat (tidak undefined)
        if (businessAId || businessBId) {
            const validBusinessIds = [businessAId, businessBId].filter(Boolean);
            if (validBusinessIds.length > 0) {
                await prisma.transaction.deleteMany({
                    where: { businessId: { in: validBusinessIds } }
                });
                await prisma.business.deleteMany({
                    where: { id: { in: validBusinessIds } }
                });
            }
        }

        if (userAId || userBId) {
            const validUserIds = [userAId, userBId].filter(Boolean);
            if (validUserIds.length > 0) {
                await prisma.user.deleteMany({
                    where: { id: { in: validUserIds } }
                });
            }
        }

        await prisma.$disconnect();
    });

    // Acceptance Criteria: Query transaksi Bisnis A tidak boleh memuat data Bisnis B
    it('Query transaksi yang dikunci berdasarkan businessId Bisnis A tidak boleh memuat data Bisnis B', async () => {
        const transactionsOfA = await prisma.transaction.findMany({
            where: { businessId: businessAId }
        });

        expect(transactionsOfA.length).toBeGreaterThan(0);

        // Verifikasi mutlak bahwa tidak ada data Bisnis B yang tercampur
        transactionsOfA.forEach((trx) => {
            expect(trx.businessId).toBe(businessAId);
            expect(trx.businessId).not.toBe(businessBId);
            expect(trx.description).not.toContain('Produk B');
        });
    });

});