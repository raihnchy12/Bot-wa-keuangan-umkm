import { prisma } from '../config/db';
import { 
  confirmationHandlerService, 
  formatBatchConfirmationPrompt 
} from '../services/ai/confirmationHandler.service';
import { 
  pendingTransactionManager, 
  PendingTransactionPayload 
} from '../services/ai/pendingTransaction.service';
import { messageHandlerService } from '../services/whatsapp/messageHandler.service';

const TEST_PHONE = '628991234013';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

async function runBatchConfirmationTests() {
  console.log('🧪 Memulai pengujian AI-013 — Batch Confirmation & Multi-Transaction Persistence\n');

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
        name: 'Tester Batch AI-013',
        phoneNumber: TEST_PHONE,
        businesses: {
          create: {
            name: 'Toko Kelontong Berkah 13',
          },
        },
      },
      include: {
        businesses: true,
      },
    });

    const business = user.businesses[0];
    console.log(`👤 User & Business Uji Siap: User ID=${user.id}, Business ID=${business.id}`);

    // Data batch multi-transaksi sesuai PRD
    const batchDrafts: PendingTransactionPayload[] = [
      {
        type: 'INCOME',
        amount: 100000,
        category: 'Penjualan',
        description: 'Jual beras',
        transactionDate: '2026-10-29',
      },
      {
        type: 'INCOME',
        amount: 50000,
        category: 'Penjualan',
        description: 'Jual minyak',
        transactionDate: '2026-10-29',
      },
      {
        type: 'EXPENSE',
        amount: 20000,
        category: 'Transportasi',
        description: 'Beli bensin',
        transactionDate: '2026-10-29',
      },
    ];

    // ========================================================
    // Skenario 1: Format Pesan Ringkasan Konfirmasi Batch
    // ========================================================
    console.log('\n--- Test 1: Format Pesan Ringkasan Konfirmasi Batch ---');
    const promptMessage = formatBatchConfirmationPrompt(batchDrafts);
    console.log('Format Pesan Konfirmasi:\n', promptMessage);

    assert(promptMessage.includes('Ditemukan 3 transaksi:'), 'Harus menyebutkan 3 transaksi');
    assert(promptMessage.includes('[PEMASUKAN] Jual beras - Rp 100.000 (Penjualan)'), 'Rincian item 1 harus sesuai');
    assert(promptMessage.includes('[PEMASUKAN] Jual minyak - Rp 50.000 (Penjualan)'), 'Rincian item 2 harus sesuai');
    assert(promptMessage.includes('[PENGELUARAN] Beli bensin - Rp 20.000 (Transportasi)'), 'Rincian item 3 harus sesuai');
    assert(promptMessage.includes('Total Pemasukan: Rp 150.000'), 'Total Pemasukan harus Rp 150.000');
    assert(promptMessage.includes('Total Pengeluaran: Rp 20.000'), 'Total Pengeluaran harus Rp 20.000');
    assert(promptMessage.includes("Apakah data di atas sudah benar?"), 'Harus ada instruksi konfirmasi');
    console.log('✅ Test 1 LULUS: Format pesan ringkasan konfirmasi batch 100% rapi dan akurat!');

    // ========================================================
    // Skenario 2: Pembatalan Batch Transaksi
    // ========================================================
    console.log('\n--- Test 2: Pembatalan Batch Transaksi ---');
    await pendingTransactionManager.saveBatchPendingTransactions(user.id, batchDrafts);

    const cancelResult = await confirmationHandlerService.handleConfirmationResponse(
      user.id,
      'BATAL',
      { isBatch: true, transactions: batchDrafts }
    );

    console.log('Hasil Respon Batal:', cancelResult.replyMessage);
    assert(cancelResult.decision === 'CANCEL', 'Decision harus CANCEL');
    assert(cancelResult.success === true, 'Success harus true');
    assert(cancelResult.replyMessage.includes('Dibatalkan'), 'Pesan harus menyatakan pembatalan');

    // Verifikasi database tidak ada transaksi yang disimpan
    const txCountAfterCancel = await prisma.transaction.count({
      where: { businessId: business.id },
    });
    assert(txCountAfterCancel === 0, 'Tidak boleh ada transaksi tersimpan saat dibatalkan');

    const stateAfterCancel = await pendingTransactionManager.getPendingTransaction(user.id);
    assert(stateAfterCancel === null, 'State harus bersih setelah dibatalkan');
    console.log('✅ Test 2 LULUS: Pembatalan batch membersihkan state dan tidak ada data tersimpan!');

    // ========================================================
    // Skenario 3: Atomik Batch Persistence (prisma.$transaction) saat Konfirmasi "YA"
    // ========================================================
    console.log('\n--- Test 3: Atomik Batch Persistence saat Konfirmasi "YA" ---');
    await pendingTransactionManager.saveBatchPendingTransactions(user.id, batchDrafts);

    const confirmResult = await confirmationHandlerService.handleConfirmationResponse(
      user.id,
      'YA',
      { isBatch: true, transactions: batchDrafts }
    );

    console.log('Hasil Respon Sukses Simpan:\n', confirmResult.replyMessage);
    assert(confirmResult.decision === 'CONFIRM', 'Decision harus CONFIRM');
    assert(confirmResult.success === true, 'Success harus true');
    assert(confirmResult.totalSaved === 3, 'Total saved harus 3');
    assert(confirmResult.replyMessage.includes('Berhasil Menyimpan 3 Transaksi'), 'Pesan sukses harus menyebutkan 3 transaksi');

    // Verifikasi data di tabel Transaction PostgreSQL Neon
    const savedTransactions = await prisma.transaction.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'asc' },
    });

    assert(savedTransactions.length === 3, `Harus ada 3 transaksi di database, got ${savedTransactions.length}`);
    assert(savedTransactions[0].type === 'INCOME' && Number(savedTransactions[0].amount) === 100000, 'Item 1 di DB harus Income 100k');
    assert(savedTransactions[1].type === 'INCOME' && Number(savedTransactions[1].amount) === 50000, 'Item 2 di DB harus Income 50k');
    assert(savedTransactions[2].type === 'EXPENSE' && Number(savedTransactions[2].amount) === 20000, 'Item 3 di DB harus Expense 20k');

    // Verifikasi state telah di-reset ke IDLE
    const stateAfterConfirm = await pendingTransactionManager.getPendingTransaction(user.id);
    assert(stateAfterConfirm === null, 'State harus bersih ke IDLE setelah simpan');
    console.log('✅ Test 3 LULUS: Seluruh transaksi tersimpan atomik di DB dan state dibersihkan!');

    // ========================================================
    // Skenario 4: End-to-End Chat Multi-Transaksi via messageHandlerService
    // ========================================================
    console.log('\n--- Test 4: End-to-End Chat Multi-Transaksi ---');
    // Hapus transaksi dari test 3
    await prisma.transaction.deleteMany({ where: { businessId: business.id } });

    // Step 4.1: Pengguna kirim chat panjang 3 transaksi
    const reply1 = await messageHandlerService.handleIncomingMessage(
      TEST_PHONE,
      'Hari ini jual beras 100rb, minyak 50rb, lalu beli bensin 20rb',
      'Tester Batch AI-013'
    );
    console.log('Step 4.1 Bot Reply:\n', reply1);
    assert(reply1 !== null, 'Bot harus membalas');
    assert(reply1!.includes('Ditemukan 3 transaksi:'), 'Bot harus merespon dengan ringkasan 3 transaksi');
    assert(reply1!.includes('Total Pemasukan: Rp 150.000'), 'Ringkasan total pemasukan harus ada');
    assert(reply1!.includes('Total Pengeluaran: Rp 20.000'), 'Ringkasan total pengeluaran harus ada');

    // Step 4.2: Pengguna mengonfirmasi "YA"
    const reply2 = await messageHandlerService.handleIncomingMessage(
      TEST_PHONE,
      'YA',
      'Tester Batch AI-013'
    );
    console.log('Step 4.2 Bot Reply:\n', reply2);
    assert(reply2 !== null, 'Bot harus membalas');
    assert(reply2!.includes('Berhasil Menyimpan 3 Transaksi'), 'Bot harus mengonfirmasi penyimpanan 3 transaksi');

    const totalInDb = await prisma.transaction.count({ where: { businessId: business.id } });
    assert(totalInDb === 3, 'Total transaksi di DB harus 3');
    console.log('✅ Test 4 LULUS: Alur End-to-End Chat Multi-Transaksi berjalan sempurna!');

    // Cleanup
    await prisma.transaction.deleteMany({ where: { business: { userId: user.id } } });
    await prisma.business.deleteMany({ where: { userId: user.id } });
    await prisma.conversationState.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('\n✨ Seluruh pengujian Task AI-013 LULUS SEMPURNA!');
  } catch (error) {
    console.error('❌ Pengujian gagal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBatchConfirmationTests();

