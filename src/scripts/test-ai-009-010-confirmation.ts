import { prisma } from '../config/db';
import { confirmationHandlerService } from '../services/ai/confirmationHandler.service';
import { pendingTransactionManager, PendingTransactionPayload } from '../services/ai/pendingTransaction.service';
import { messageHandlerService } from '../services/whatsapp/messageHandler.service';

const TEST_PHONE = '628991234009';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

async function runConfirmationTests() {
  console.log('🧪 Memulai pengujian AI-009 & AI-010 — Confirmation Response Handler & Persistence\n');

  try {
    // 0. Cleanup awal
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
        name: 'Tester Konfirmasi',
        phoneNumber: TEST_PHONE,
        businesses: {
          create: {
            name: 'Toko Berkah Uji',
          },
        },
      },
      include: {
        businesses: true,
      },
    });

    const business = user.businesses[0];
    console.log(`👤 User & Business Uji Siap: User ID=${user.id}, Business ID=${business.id}`);

    const draft: PendingTransactionPayload = {
      type: 'EXPENSE',
      amount: 75000,
      category: 'Bahan Baku',
      description: 'Beli minyak goreng 2L',
      transactionDate: '2026-10-28',
    };

    // ==========================================
    // Skenario 1: Pesan Tidak Relevan / Di Luar Konfirmasi
    // ==========================================
    console.log('\n--- Test 1: Respon Tidak Relevan saat WAITING_CONFIRMATION ---');
    await pendingTransactionManager.savePendingTransaction(user.id, draft);

    const unrelatedResult = await confirmationHandlerService.handleConfirmationResponse(
      user.id,
      'Berapa total saldo saya?',
      draft
    );

    console.log('Hasil Respon:', unrelatedResult);
    assert(unrelatedResult.decision === 'UNKNOWN', 'Decision harus UNKNOWN');
    assert(unrelatedResult.success === false, 'Success harus false');
    assert(unrelatedResult.replyMessage.includes('Konfirmasi Transaksi Diperlukan'), 'Harus mengingatkan konfirmasi');

    // Pastikan state di database tetap WAITING_CONFIRMATION
    const stateStillActive = await pendingTransactionManager.getPendingTransaction(user.id);
    assert(stateStillActive !== null, 'State harus tetap aktif');
    console.log('✅ Test 1 LULUS: Pengguna diingatkan dengan sopan dan state tetap terjaga!');

    // ==========================================
    // Skenario 2: Jawaban TIDAK / BATAL
    // ==========================================
    console.log('\n--- Test 2: Respon BATAL / TIDAK ---');
    const cancelResult = await confirmationHandlerService.handleConfirmationResponse(
      user.id,
      'batal deh',
      draft
    );

    console.log('Hasil Respon:', cancelResult);
    assert(cancelResult.decision === 'CANCEL', 'Decision harus CANCEL');
    assert(cancelResult.success === true, 'Success harus true');
    assert(cancelResult.replyMessage.includes('Dibatalkan'), 'Pesan harus menyatakan pembatalan');

    // Pastikan state di database sudah bersih
    const stateAfterCancel = await pendingTransactionManager.getPendingTransaction(user.id);
    assert(stateAfterCancel === null, 'State harus bersih setelah dibatalkan');

    // Pastikan tidak ada transaksi yang tersimpan di DB
    const txCountAfterCancel = await prisma.transaction.count({
      where: { businessId: business.id },
    });
    assert(txCountAfterCancel === 0, 'Tidak boleh ada transaksi tersimpan saat dibatalkan');
    console.log('✅ Test 2 LULUS: State dibersihkan dan transaksi tidak disimpan!');

    // ==========================================
    // Skenario 3: Jawaban YA / BENAR (Persistence Flow AI-010)
    // ==========================================
    console.log('\n--- Test 3: Respon YA / BENAR (Simpan ke DB) ---');
    await pendingTransactionManager.savePendingTransaction(user.id, draft);

    const confirmResult = await confirmationHandlerService.handleConfirmationResponse(
      user.id,
      'Ya, simpan',
      draft
    );

    console.log('Hasil Respon:', confirmResult);
    assert(confirmResult.decision === 'CONFIRM', 'Decision harus CONFIRM');
    assert(confirmResult.success === true, 'Success harus true');
    assert(confirmResult.transaction !== undefined, 'Objek transaksi hasil simpan harus ada');
    assert(confirmResult.replyMessage.includes('Berhasil Disimpan'), 'Pesan harus sukses disimpan');

    // Pastikan state sudah bersih (IDLE)
    const stateAfterConfirm = await pendingTransactionManager.getPendingTransaction(user.id);
    assert(stateAfterConfirm === null, 'State harus bersih setelah konfirmasi YA');

    // Verifikasi data benar-benar tersimpan di database PostgreSQL
    const savedTx = await prisma.transaction.findFirst({
      where: { businessId: business.id },
    });
    assert(savedTx !== null, 'Transaksi harus ditemukan di tabel Transaction');
    assert(Number(savedTx!.amount) === 75000, 'Nominal di DB harus 75000');
    assert(savedTx!.type === 'EXPENSE', 'Tipe di DB harus EXPENSE');
    assert(savedTx!.category === 'Bahan Baku', 'Kategori di DB harus Bahan Baku');
    assert(savedTx!.description === 'Beli minyak goreng 2L', 'Deskripsi di DB harus sesuai');
    console.log('✅ Test 3 LULUS: Transaksi berhasil disimpan ke DB, state dibersihkan, dan respon sukses dikirim!');

    // ==========================================
    // Skenario 4: End-to-End via messageHandlerService
    // ==========================================
    console.log('\n--- Test 4: End-to-End Chat via messageHandlerService ---');
    // Step 4.1: Pengguna kirim chat transaksi
    const reply1 = await messageHandlerService.handleIncomingMessage(
      TEST_PHONE,
      'Kemarin jual buket bunga 150rb',
      'Tester Konfirmasi'
    );
    console.log('Step 4.1 Bot Reply:', reply1);
    assert(reply1 !== null && reply1.includes('Konfirmasi Transaksi'), 'Bot harus minta konfirmasi');

    // Step 4.2: Pengguna kirim chat pertanyaan lain saat WAITING_CONFIRMATION
    const reply2 = await messageHandlerService.handleIncomingMessage(
      TEST_PHONE,
      'Halo bot',
      'Tester Konfirmasi'
    );
    console.log('Step 4.2 Bot Reply:', reply2);
    assert(reply2 !== null && reply2.includes('Konfirmasi Transaksi Diperlukan'), 'Bot harus ingatkan konfirmasi');

    // Step 4.3: Pengguna kirim "YA"
    const reply3 = await messageHandlerService.handleIncomingMessage(
      TEST_PHONE,
      'YA',
      'Tester Konfirmasi'
    );
    console.log('Step 4.3 Bot Reply:', reply3);
    assert(reply3 !== null && reply3.includes('Berhasil Disimpan'), 'Bot harus konfirmasi tersimpan');

    // Verifikasi transaksi total di DB menjadi 2
    const totalTransactions = await prisma.transaction.count({
      where: { businessId: business.id },
    });
    assert(totalTransactions === 2, `Total transaksi di DB harus 2, got ${totalTransactions}`);
    console.log('✅ Test 4 LULUS: Seluruh alur end-to-end percakapan berhasil!');

    // Cleanup
    await prisma.transaction.deleteMany({ where: { business: { userId: user.id } } });
    await prisma.business.deleteMany({ where: { userId: user.id } });
    await prisma.conversationState.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('\n✨ Seluruh pengujian AI-009 & AI-010 LULUS SEMPURNA!');
  } catch (error) {
    console.error('❌ Pengujian gagal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runConfirmationTests();

