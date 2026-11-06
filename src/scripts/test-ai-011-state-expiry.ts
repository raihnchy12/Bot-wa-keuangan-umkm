import { prisma } from '../config/db';
import { pendingTransactionManager, PendingTransactionPayload } from '../services/ai/pendingTransaction.service';
import { stateExpiryHandlerService } from '../services/ai/stateExpiryHandler.service';
import { messageHandlerService } from '../services/whatsapp/messageHandler.service';

const TEST_PHONE = '628991234011';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

async function runStateExpiryTests() {
  console.log('🧪 Memulai pengujian AI-011 — State Expiry Handler & Notification\n');

  try {
    // 0. Cleanup data uji sebelumnya
    const existingUser = await prisma.user.findUnique({ where: { phoneNumber: TEST_PHONE } });
    if (existingUser) {
      await prisma.transaction.deleteMany({ where: { business: { userId: existingUser.id } } });
      await prisma.business.deleteMany({ where: { userId: existingUser.id } });
      await prisma.conversationState.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // 1. Buat User & Business uji
    const user = await prisma.user.create({
      data: {
        name: 'Tester Expiry',
        phoneNumber: TEST_PHONE,
        businesses: {
          create: {
            name: 'Usaha Uji Expiry',
          },
        },
      },
      include: {
        businesses: true,
      },
    });

    const business = user.businesses[0];
    console.log(`👤 User & Business Uji Siap: User ID=${user.id}, Business ID=${business.id}`);

    const oldDraft: PendingTransactionPayload = {
      type: 'EXPENSE',
      amount: 50000,
      category: 'Operasional',
      description: 'Beli token listrik lama',
      transactionDate: '2026-10-28',
    };

    // ========================================================
    // Skenario 1: Deteksi dan Pembersihan Otomatis State Kadaluarsa
    // ========================================================
    console.log('\n--- Test 1: Deteksi & Pembersihan Otomatis State Kadaluarsa ---');
    // Simpan pending transaksi dengan TTL 600 detik (10 menit)
    await pendingTransactionManager.savePendingTransaction(user.id, oldDraft, 600);

    // Simulasi waktu 15 menit kemudian (900 detik)
    const futureTime = new Date(Date.now() + 900 * 1000);

    const expiryResult = await stateExpiryHandlerService.checkAndCleanupExpiredState(user.id, futureTime);
    console.log('Hasil checkAndCleanupExpiredState:', expiryResult);

    assert(expiryResult.wasExpired === true, 'wasExpired harus true');
    assert(expiryResult.expiredState === 'WAITING_CONFIRMATION', 'expiredState harus WAITING_CONFIRMATION');
    assert(expiryResult.notificationMessage !== undefined, 'notificationMessage harus tersedia');
    assert(expiryResult.notificationMessage!.toLowerCase().includes('kadaluarsa'), 'Pesan harus menyebutkan kadaluarsa');

    // Verifikasi di database bahwa state gantung sudah benar-benar dihapus
    const dbStateAfterCleanup = await prisma.conversationState.findUnique({
      where: { userId: user.id },
    });
    assert(dbStateAfterCleanup === null, 'State gantung di database harus terhapus tuntas (IDLE)');
    console.log('✅ Test 1 LULUS: State kadaluarsa terdeteksi, dibersihkan dari DB, dan notifikasi disiapkan!');

    // ========================================================
    // Skenario 2: Pengguna Mengirim "YA" ke Sesi yang Sudah Kadaluarsa
    // ========================================================
    console.log('\n--- Test 2: Pengguna Mengirim "YA" ke Sesi Kadaluarsa ---');
    // Set ulang state gantung
    await pendingTransactionManager.savePendingTransaction(user.id, oldDraft, 600);

    // Pengguna merespon "YA" 12 menit kemudian
    const replyExpiredConfirm = await messageHandlerService.handleIncomingMessage(
      TEST_PHONE,
      'YA',
      'Tester Expiry',
      futureTime
    );

    console.log('Bot Reply saat konfirmasi kadaluarsa:\n', replyExpiredConfirm);
    assert(replyExpiredConfirm !== null, 'Bot harus membalas');
    assert(replyExpiredConfirm!.toLowerCase().includes('kadaluarsa'), 'Bot harus menolak dan memberi tahu sesi kadaluarsa');
    assert(replyExpiredConfirm!.toLowerCase().includes('kirimkan ulang') || replyExpiredConfirm!.toLowerCase().includes('kirim ulang'), 'Bot harus meminta mengirimkan ulang pesan transaksi');

    // Pastikan tidak ada transaksi yang tersimpan di DB
    const txCount = await prisma.transaction.count({
      where: { businessId: business.id },
    });
    assert(txCount === 0, 'Transaksi tidak boleh disimpan saat konfirmasi sudah kadaluarsa');
    console.log('✅ Test 2 LULUS: Konfirmasi kadaluarsa ditolak dengan notifikasi ramah tanpa menyimpan transaksi!');

    // ========================================================
    // Skenario 3: Pengguna Mengirim Transaksi Baru Setelah Sesi Lama Kadaluarsa
    // ========================================================
    console.log('\n--- Test 3: Pengguna Mengirim Transaksi Baru Setelah Sesi Lama Kadaluarsa ---');
    // Set kembali state gantung lama
    await pendingTransactionManager.savePendingTransaction(user.id, oldDraft, 600);

    // Pengguna mengirimkan transaksi baru: "Beli bensin motor 20rb" 15 menit kemudian
    const replyNewTx = await messageHandlerService.handleIncomingMessage(
      TEST_PHONE,
      'Beli bensin motor 20rb',
      'Tester Expiry',
      futureTime
    );

    console.log('Bot Reply saat kirim transaksi baru:\n', replyNewTx);
    assert(replyNewTx !== null, 'Bot harus membalas');
    assert(replyNewTx!.toLowerCase().includes('kadaluarsa'), 'Bot harus menyertakan notifikasi bahwa sesi lama telah kadaluarsa');
    assert(replyNewTx!.toLowerCase().includes('bensin'), 'Bot harus memproses transaksi baru (Beli bensin)');
    assert(replyNewTx!.includes('20.000'), 'Nominal transaksi baru harus 20.000');

    // Verifikasi bahwa state di database sekarang adalah draf transaksi BARU yang masih aktif saat ini
    const newPending = await pendingTransactionManager.getPendingTransaction(user.id);
    assert(newPending !== null, 'Harus ada pending transaction baru yang aktif');
    assert(newPending!.draft.description.toLowerCase().includes('bensin'), 'Draf harus berupa bensin');
    assert(newPending!.draft.amount === 20000, 'Nominal draf baru harus 20000');
    console.log('✅ Test 3 LULUS: Sesi lama dibersihkan dan input baru langsung diproses menjadi draf konfirmasi baru!');

    // Cleanup
    await prisma.transaction.deleteMany({ where: { business: { userId: user.id } } });
    await prisma.business.deleteMany({ where: { userId: user.id } });
    await prisma.conversationState.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('\n✨ Seluruh pengujian Task AI-011 LULUS SEMPURNA!');
  } catch (error) {
    console.error('❌ Pengujian gagal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStateExpiryTests();
