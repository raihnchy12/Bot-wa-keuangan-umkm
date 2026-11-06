import { prisma } from '../config/db';
import { 
  pendingTransactionManager, 
  PendingTransactionPayload,
  DEFAULT_PENDING_TX_TTL_SECONDS 
} from '../services/ai/pendingTransaction.service';
import { ConversationStateName } from '../services/conversationState.service';

const TEST_PHONE = '628991234008';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

async function runPendingTransactionTests() {
  console.log('🧪 Memulai pengujian AI-008 — Pending Transaction State Manager\n');

  try {
    // 0. Cleanup data uji sebelumnya
    await prisma.user.deleteMany({ where: { phoneNumber: TEST_PHONE } });

    // 1. Buat User Uji
    const user = await prisma.user.create({
      data: {
        name: 'Tester AI-008',
        phoneNumber: TEST_PHONE,
      },
    });

    console.log(`👤 User Uji dibuat: ID=${user.id}, Phone=${user.phoneNumber}`);

    // Draf transaksi hasil ekstraksi AI yang lolos validasi
    const draftTransaction: PendingTransactionPayload = {
      type: 'EXPENSE',
      amount: 100000,
      category: 'Bahan Baku',
      description: 'Beli beras pandan wangi',
      transactionDate: '2026-10-28',
    };

    // === Test 1: Simpan draf transaksi ke ConversationState ===
    console.log('\n--- Test 1: savePendingTransaction ---');
    const stateRecord = await pendingTransactionManager.savePendingTransaction(
      user.id,
      draftTransaction,
      DEFAULT_PENDING_TX_TTL_SECONDS
    );

    console.log('Hasil simpan state:', {
      userId: stateRecord.userId,
      state: stateRecord.state,
      payload: stateRecord.payload,
      expiresAt: stateRecord.expiresAt,
    });

    // Verifikasi kriteria 1 & 2: state WAITING_CONFIRMATION dan payload tersimpan
    assert(stateRecord.state === ConversationStateName.WAITING_CONFIRMATION, 'State harus WAITING_CONFIRMATION');
    assert(stateRecord.payload !== null, 'Payload tidak boleh null');
    const savedPayload = stateRecord.payload as unknown as PendingTransactionPayload;
    assert(savedPayload.amount === 100000, 'Payload amount harus 100000');
    assert(savedPayload.type === 'EXPENSE', 'Payload type harus EXPENSE');
    assert(savedPayload.description === 'Beli beras pandan wangi', 'Payload description harus sesuai');

    // Verifikasi kriteria 3: Waktu kadaluarsa (TTL 10 menit / 600 detik)
    assert(stateRecord.expiresAt !== null, 'expiresAt harus diset');
    const now = Date.now();
    const expiryTime = new Date(stateRecord.expiresAt!).getTime();
    const diffSeconds = Math.round((expiryTime - now) / 1000);
    console.log(`⏱️ Sisa waktu TTL: ${diffSeconds} detik (Ekspektasi mendekati 600 detik)`);
    assert(diffSeconds >= 595 && diffSeconds <= 605, 'TTL harus sekitar 600 detik');
    console.log('✅ Test 1 LULUS: State tersimpan dengan WAITING_CONFIRMATION, payload draf lengkap, dan TTL 10 menit!');

    // === Test 2: getPendingTransaction saat masih aktif ===
    console.log('\n--- Test 2: getPendingTransaction saat state aktif ---');
    const pendingActive = await pendingTransactionManager.getPendingTransaction(user.id);
    assert(pendingActive !== null, 'Pending transaction harus ditemukan');
    assert(pendingActive!.state === ConversationStateName.WAITING_CONFIRMATION, 'State harus WAITING_CONFIRMATION');
    assert(pendingActive!.draft.amount === 100000, 'Draf amount harus 100000');
    console.log('✅ Test 2 LULUS: Draf transaksi pending berhasil dibaca dengan benar!');

    // === Test 3: Evaluasi state kadaluarsa (now > expiresAt) ===
    console.log('\n--- Test 3: Evaluasi kadaluarsa otomatis saat TTL terlewati ---');
    const futureTime = new Date(Date.now() + 650 * 1000); // 650 detik ke depan (> 600 detik)
    const expiredPending = await pendingTransactionManager.getPendingTransaction(user.id, futureTime);
    assert(expiredPending === null, 'Draf pending harus otomatis bernilai null karena sudah expired');

    // Verifikasi di database bahwa state otomatis direset
    const dbStateAfterExpiry = await prisma.conversationState.findUnique({
      where: { userId: user.id },
    });
    assert(dbStateAfterExpiry === null, 'State expired di database harus otomatis terhapus');
    console.log('✅ Test 3 LULUS: State kadaluarsa otomatis di-reset dan dibersihkan dari database!');

    // === Test 4: clearPendingTransaction ===
    console.log('\n--- Test 4: clearPendingTransaction secara eksplisit ---');
    // Set ulang state
    await pendingTransactionManager.savePendingTransaction(user.id, draftTransaction);
    const cleared = await pendingTransactionManager.clearPendingTransaction(user.id);
    assert(cleared === true, 'clearPendingTransaction harus mengembalikan true');

    const dbStateAfterClear = await prisma.conversationState.findUnique({
      where: { userId: user.id },
    });
    assert(dbStateAfterClear === null, 'State harus kosong setelah di-clear');
    console.log('✅ Test 4 LULUS: clearPendingTransaction berhasil mengembalikan user ke status IDLE!');

    // Cleanup
    await prisma.user.deleteMany({ where: { phoneNumber: TEST_PHONE } });
    console.log('\n✨ Seluruh pengujian AI-008 berhasil dijalankan tanpa error!');
  } catch (error) {
    console.error('❌ Pengujian gagal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPendingTransactionTests();

