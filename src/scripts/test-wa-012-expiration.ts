import { isDeepStrictEqual } from 'util';
import { prisma } from '../config/db';
import whatsappClient from '../config/whatsapp';
import {
  conversationStateService,
  ConversationStateName,
} from '../services/conversationState.service';
import { conversationStateRepository } from '../repositories/conversationState.repository';
import { handleIncomingMessage } from '../services/whatsapp/messageHandler.service';
import { ParsedMessage } from '../utils/messageParser';
import { AppError } from '../utils/appError';

/**
 * WA-012: Conversation State Expiration Logic
 *
 * Verifikasi:
 * 1. State aktif yang belum expired dapat dibaca dengan benar.
 * 2. State yang sudah melewati expiresAt secara otomatis ter-reset ke IDLE saat dibaca
 *    dan datanya di database ikut ter-clear.
 * 3. Pesan konfirmasi lama yang dikirim setelah expired diabaikan atau ditangani
 *    sebagai perintah baru/IDLE (mencegah aksi lanjutan atau transaksi tidak sengaja).
 * 4. Pengecekan simulasi waktu dengan parameter `now`.
 * 5. State tanpa TTL (expiresAt = null) tidak pernah kadaluarsa.
 * 6. Helper functions (isExpired, getUserState, getEffectiveState, cleanExpiredStates).
 */

const PHONE_A = '62899012001';
const PHONE_B = '62899012002';

const makeMsg = (from: string, name: string, textBody: string, msgId: string): ParsedMessage => ({
  from,
  name,
  msgId,
  timestamp: String(Math.floor(Date.now() / 1000)),
  type: 'text',
  textBody,
});

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

const cleanup = async () => {
  // Menghapus data user pengujian (Cascade menghapus Business, Transaction, & ConversationState)
  await prisma.user.deleteMany({
    where: { phoneNumber: { in: [PHONE_A, PHONE_B] } },
  });
};

const testWA012Expiration = async () => {
  console.log('🧪 Testing WA-012: Conversation State Expiration Logic\n');

  const originalPost = whatsappClient.post;
  // Mock whatsappClient agar tidak mengirim request asli ke WhatsApp Cloud API
  whatsappClient.post = (async () => ({
    status: 200,
    data: { messaging_product: 'whatsapp', messages: [{ id: 'wamid.mock' }] },
  })) as any;

  try {
    await cleanup();

    // Buat 2 user uji
    const userA = await prisma.user.create({
      data: {
        name: 'User Expiration A',
        phoneNumber: PHONE_A,
        businesses: { create: { name: 'Usaha A' } },
      },
      include: { businesses: true },
    });

    const userB = await prisma.user.create({
      data: {
        name: 'User Expiration B',
        phoneNumber: PHONE_B,
        businesses: { create: { name: 'Usaha B' } },
      },
      include: { businesses: true },
    });

    const draftA = {
      transactions: [
        {
          type: 'EXPENSE',
          amount: 50000,
          category: 'Operasional',
          description: 'Beli pulsa listrik',
          transactionDate: '2026-10-22',
        },
      ],
      source: 'text',
    };

    // === Test 1: State aktif yang belum expired ===
    console.log('📝 Test 1: State aktif yang belum kadaluarsa terbaca utuh');
    const activeState: any = await conversationStateService.setState(
      userA.id,
      ConversationStateName.WAITING_CONFIRMATION,
      draftA,
      600 // 10 menit
    );

    assert(activeState.userId === userA.id, 'userId harus sesuai');
    assert(activeState.state === 'WAITING_CONFIRMATION', 'state harus WAITING_CONFIRMATION');
    assert(activeState.expiresAt !== null, 'expiresAt harus terisi');

    const readActive: any = await conversationStateService.getState(userA.id);
    assert(readActive !== null, 'state aktif harus ditemukan (tidak null)');
    assert(readActive!.state === 'WAITING_CONFIRMATION', 'state harus tetap WAITING_CONFIRMATION');
    assert(isDeepStrictEqual(readActive!.payload, draftA), 'payload harus utuh');

    const dbActiveCount = await prisma.conversationState.count({ where: { userId: userA.id } });
    assert(dbActiveCount === 1, 'record di database harus tetap ada');
    console.log('✅ PASS\n');

    // === Test 2: State yang sudah melewati expiresAt otomatis ter-reset ke IDLE dan DB ter-clear ===
    console.log('📝 Test 2: State kadaluarsa (now > expiresAt) otomatis reset ke IDLE dan DB ter-clear');
    const pastDate = new Date(Date.now() - 5000); // 5 detik yang lalu
    await conversationStateRepository.upsert({
      userId: userB.id,
      state: ConversationStateName.WAITING_CONFIRMATION,
      payload: { draft: 'Pengeluaran kadaluarsa' },
      expiresAt: pastDate,
    });

    // Pastikan baris tersimpan sebelum dibaca
    const preCheckCount = await prisma.conversationState.count({ where: { userId: userB.id } });
    assert(preCheckCount === 1, 'baris state kadaluarsa harus ada sebelum dibaca');

    // getState mendeteksi kadaluarsa, menghapus dari DB, dan mengembalikan null (IDLE)
    const expiredRead = await conversationStateService.getState(userB.id);
    assert(expiredRead === null, 'getState untuk state kadaluarsa harus mengembalikan null (IDLE)');

    // Verifikasi database sudah bersih
    const postCheckCount = await prisma.conversationState.count({ where: { userId: userB.id } });
    assert(postCheckCount === 0, 'baris state kadaluarsa di database harus otomatis terhapus');

    // Pemanggilan kedua tetap mengembalikan null dengan aman
    const secondRead = await conversationStateService.getState(userB.id);
    assert(secondRead === null, 'pemanggilan kedua harus tetap mengembalikan null');
    console.log('✅ PASS\n');

    // === Test 3: Simulasi waktu acuan dengan parameter `now` ===
    console.log('📝 Test 3: Pengecekan kadaluarsa dengan waktu acuan fleksibel (parameter `now`)');
    await conversationStateService.setState(
      userA.id,
      ConversationStateName.WAITING_AMOUNT,
      { pendingDescription: 'Beli minyak goreng' },
      300 // TTL 300 detik (5 menit)
    );

    // Cek pada menit ke-2 (120 detik kemudian) -> belum kadaluarsa
    const midTime = new Date(Date.now() + 120_000);
    const midCheck: any = await conversationStateService.getState(userA.id, midTime);
    assert(midCheck !== null, 'pada menit ke-2 state harus masih aktif');
    assert(midCheck!.state === 'WAITING_AMOUNT', 'state harus tetap WAITING_AMOUNT');

    // Cek pada menit ke-6 (360 detik kemudian) -> sudah kadaluarsa
    const futureTime = new Date(Date.now() + 360_000);
    const expiredFutureCheck = await conversationStateService.getState(userA.id, futureTime);
    assert(expiredFutureCheck === null, 'pada menit ke-6 state harus sudah kadaluarsa (null)');

    const countAfterFuture = await prisma.conversationState.count({ where: { userId: userA.id } });
    assert(countAfterFuture === 0, 'state di database harus ikut terhapus saat simulasi kadaluarsa');
    console.log('✅ PASS\n');

    // === Test 4: State tanpa TTL tidak pernah kadaluarsa ===
    console.log('📝 Test 4: State tanpa TTL (expiresAt = null) tidak pernah kadaluarsa');
    await conversationStateService.setState(
      userA.id,
      ConversationStateName.IDLE,
      { notes: 'State permanen' }
      // tanpa TTL
    );

    const farFuture = new Date(Date.now() + 86400 * 365 * 1000); // 1 tahun kemudian
    const permanentCheck: any = await conversationStateService.getState(userA.id, farFuture);
    assert(permanentCheck !== null, 'state tanpa TTL tidak boleh kadaluarsa di masa depan');
    assert(permanentCheck!.expiresAt === null, 'expiresAt harus null');
    console.log('✅ PASS\n');

    // === Test 5: Mencegah konfirmasi transaksi lama yang tertunda terproses (AC #3) ===
    console.log('📝 Test 5: Pesan konfirmasi lama yang dikirim setelah expired diabaikan (mencegah aksi tidak sengaja)');
    // Skenario: User B sebelumnya memiliki draf konfirmasi transaksi senilai Rp150.000,
    // namun pengguna baru membalas "Ya" setelah batas waktu (expiresAt) habis.
    const expiredDraft = {
      transactions: [
        {
          type: 'EXPENSE',
          amount: 150000,
          category: 'Bahan Baku',
          description: 'Beli tepung & minyak',
          transactionDate: '2026-10-22',
        },
      ],
    };

    await conversationStateRepository.upsert({
      userId: userB.id,
      state: ConversationStateName.WAITING_CONFIRMATION,
      payload: expiredDraft,
      expiresAt: new Date(Date.now() - 60_000), // Kadaluarsa 1 menit lalu
    });

    // Sebelum pesan dikirim, belum ada transaksi tersimpan
    const txCountBefore = await prisma.transaction.count({
      where: { businessId: userB.businesses[0].id },
    });
    assert(txCountBefore === 0, 'belum ada transaksi di database');

    // User mengirim pesan WhatsApp "Ya, saya konfirmasi" setelah kadaluarsa
    const incomingResult: any = await handleIncomingMessage(
      makeMsg(PHONE_B, 'User Expiration B', 'Ya, saya konfirmasi', 'wamid.late_confirm')
    );

    // Verifikasi: state percakapan otomatis di-reset ke IDLE (null)
    assert(
      incomingResult.conversationState === null,
      'conversationState harus null (IDLE) karena state lama sudah expired'
    );

    // Verifikasi: state di DB sudah dibersihkan
    const dbStateUserB = await prisma.conversationState.findUnique({
      where: { userId: userB.id },
    });
    assert(dbStateUserB === null, 'record state di database harus bersih');

    // Verifikasi: tidak ada transaksi yang tersimpan secara tidak sengaja
    const txCountAfter = await prisma.transaction.count({
      where: { businessId: userB.businesses[0].id },
    });
    assert(txCountAfter === 0, 'transaksi lama tidak boleh tersimpan karena state sudah kadaluarsa');
    console.log('✅ PASS\n');

    // === Test 6: Integrasi Message Handler saat state masih aktif ===
    console.log('📝 Test 6: Integrasi Message Handler saat state aktif → conversationState terbaca utuh');
    await conversationStateService.setState(
      userB.id,
      ConversationStateName.WAITING_CONFIRMATION,
      draftA,
      600 // Masih aktif 10 menit
    );

    const activeIncomingResult: any = await handleIncomingMessage(
      makeMsg(PHONE_B, 'User Expiration B', 'Ya', 'wamid.valid_confirm')
    );

    assert(activeIncomingResult.conversationState !== null, 'conversationState harus aktif');
    assert(
      activeIncomingResult.conversationState!.state === ConversationStateName.WAITING_CONFIRMATION,
      'state harus WAITING_CONFIRMATION'
    );
    assert(
      isDeepStrictEqual(activeIncomingResult.conversationState!.payload, draftA),
      'payload draf transaksi harus tersedia untuk diproses'
    );
    console.log('✅ PASS\n');

    // === Test 7: Helper functions & cleanExpiredStates ===
    console.log('📝 Test 7: Helper functions (isExpired, getUserState, getEffectiveState, cleanExpiredStates)');
    assert(conversationStateService.isExpired(new Date(Date.now() - 1000)) === true, 'isExpired harus true untuk masa lalu');
    assert(conversationStateService.isExpired(new Date(Date.now() + 10000)) === false, 'isExpired harus false untuk masa depan');
    assert(conversationStateService.isExpired(null) === false, 'isExpired harus false untuk null');
    assert(conversationStateService.isExpired(undefined) === false, 'isExpired harus false untuk undefined');

    // getUserState alias
    const aliasRead: any = await conversationStateService.getUserState(userB.id);
    assert(aliasRead !== null && aliasRead.state === 'WAITING_CONFIRMATION', 'getUserState harus identik dengan getState');

    // getEffectiveState untuk user tanpa state aktif
    await conversationStateService.clearState(userA.id);
    const effectiveIdle: any = await conversationStateService.getEffectiveState(userA.id);
    assert(effectiveIdle.state === 'IDLE', 'getEffectiveState harus mengembalikan state IDLE');
    assert(effectiveIdle.payload === null, 'payload getEffectiveState harus null');

    // cleanExpiredStates
    await conversationStateRepository.upsert({
      userId: userA.id,
      state: 'WAITING_AMOUNT',
      expiresAt: new Date(Date.now() - 10_000),
    });
    const cleanedCount = await conversationStateService.cleanExpiredStates();
    assert(cleanedCount >= 1, `cleanExpiredStates harus membersihkan setidaknya 1 baris, got ${cleanedCount}`);
    assert((await conversationStateService.getState(userA.id)) === null, 'user A state harus bersih');
    console.log('✅ PASS\n');

    // === Test 8: Validasi input ===
    console.log('📝 Test 8: Validasi input getState');
    let threw = false;
    try {
      await conversationStateService.getState('');
    } catch (err) {
      threw = true;
      assert(err instanceof AppError, 'harus melempar AppError');
      assert((err as AppError).statusCode === 400, 'status code harus 400');
    }
    assert(threw, 'getState dengan userId kosong harus melempar error');
    console.log('✅ PASS\n');

    console.log('🎉 Semua test WA-012 berhasil!');
    console.log('\n📋 Summary WA-012:');
    console.log('   ✅ Pengecekan expiresAt otomatis dilakukan saat getState dipanggil');
    console.log('   ✅ Jika now > expiresAt, state otomatis di-reset ke IDLE dan dihapus dari DB');
    console.log('   ✅ Konfirmasi transaksi lama yang kadaluarsa diabaikan dan tidak tersimpan');
    console.log('   ✅ Parameter `now` fleksibel untuk simulasi kadaluarsa');
    console.log('   ✅ State tanpa TTL tidak pernah kadaluarsa');
    console.log('   ✅ Integrasi Message Handler lancar');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    whatsappClient.post = originalPost;
    await cleanup();
    await prisma.$disconnect();
  }
};

testWA012Expiration();