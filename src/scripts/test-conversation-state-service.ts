import { isDeepStrictEqual } from 'util';
import { prisma } from '../config/db';
import {
  conversationStateService,
  ConversationStateName,
} from '../services/conversationState.service';
import { AppError } from '../utils/appError';

/**
 * WA-011: ConversationState Service & Repository
 * Menggunakan database sungguhan dengan 2 user uji
 * (nomor 62899011001 dan 62899011002) yang dihapus setelah test selesai.
 */

const PHONE_A = '62899011001';
const PHONE_B = '62899011002';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

const expectAppError = async (
  fn: () => Promise<unknown>,
  expectedStatus: number,
  label: string
) => {
  try {
    await fn();
  } catch (error) {
    assert(error instanceof AppError, `${label}: harus melempar AppError, got ${error}`);
    assert(
      (error as AppError).statusCode === expectedStatus,
      `${label}: status harus ${expectedStatus}, got ${(error as AppError).statusCode}`
    );
    console.log(`   ✓ ${label} → AppError ${expectedStatus}: ${(error as AppError).message}`);
    return;
  }
  throw new Error(`ASSERTION FAILED: ${label}: seharusnya melempar error`);
};

const cleanup = async () => {
  // ConversationState ikut terhapus (onDelete: Cascade)
  await prisma.user.deleteMany({ where: { phoneNumber: { in: [PHONE_A, PHONE_B] } } });
};

const testConversationStateService = async () => {
  console.log('🧪 Testing WA-011: ConversationState Service & Repository\n');

  try {
    await cleanup();

    const userA = await prisma.user.create({ data: { name: 'State Tester A', phoneNumber: PHONE_A } });
    const userB = await prisma.user.create({ data: { name: 'State Tester B', phoneNumber: PHONE_B } });

    // === Test 1: setState (state baru + payload JSON + TTL) ===
    console.log('📝 Test 1: setState - state baru dengan payload JSON & TTL 600 detik');
    const draft = {
      transactions: [
        {
          type: 'EXPENSE',
          amount: 25000,
          category: 'Operasional',
          description: 'Pembelian gas',
          transactionDate: '2026-10-22',
        },
      ],
      source: 'text',
      note: null,
    };

    const before = Date.now();
    const created = await conversationStateService.setState(
      userA.id,
      ConversationStateName.WAITING_CONFIRMATION,
      draft,
      600
    );

    assert(created.userId === userA.id, 'userId harus sesuai');
    assert(created.state === 'WAITING_CONFIRMATION', 'state harus WAITING_CONFIRMATION');
    assert(isDeepStrictEqual(created.payload, draft), 'payload harus sama dengan draft');
    assert(created.expiresAt !== null, 'expiresAt harus terisi');
    const ttlDiffMs = created.expiresAt!.getTime() - before;
    assert(
      ttlDiffMs >= 599_000 && ttlDiffMs <= 605_000,
      `expiresAt harus sekitar 600 detik dari sekarang, selisih ${ttlDiffMs}ms`
    );
    console.log('✅ PASS\n');

    // === Test 2: getState ===
    console.log('📝 Test 2: getState - payload JSON bersarang terbaca utuh');
    const fetched = await conversationStateService.getState(userA.id);
    assert(fetched !== null, 'state harus ditemukan');
    assert(fetched!.state === 'WAITING_CONFIRMATION', 'state harus sama');
    assert(isDeepStrictEqual(fetched!.payload, draft), 'payload harus utuh (nested array/object/null)');
    console.log('✅ PASS\n');

    // === Test 3: setState kedua kali = update, bukan duplikat ===
    console.log('📝 Test 3: setState kedua kali pada user yang sama → update (tetap 1 baris)');
    const updated = await conversationStateService.setState(
      userA.id,
      ConversationStateName.WAITING_AMOUNT,
      { pendingDescription: 'Beli gas' },
      300
    );
    const rowCount = await prisma.conversationState.count({ where: { userId: userA.id } });
    assert(rowCount === 1, `harus tetap 1 baris, got ${rowCount}`);
    assert(updated.id === created.id, 'id baris harus sama (di-update, bukan dibuat ulang)');
    assert(updated.state === 'WAITING_AMOUNT', 'state harus berubah');
    assert(
      isDeepStrictEqual(updated.payload, { pendingDescription: 'Beli gas' }),
      'payload lama harus tergantikan sepenuhnya'
    );
    console.log('✅ PASS\n');

    // === Test 4: tanpa payload & tanpa TTL ===
    console.log('📝 Test 4: setState tanpa payload dan tanpa TTL → payload & expiresAt dikosongkan');
    const bare = await conversationStateService.setState(userA.id, ConversationStateName.IDLE);
    assert(bare.payload === null, 'payload harus null (sisa payload lama tidak boleh terbawa)');
    assert(bare.expiresAt === null, 'expiresAt harus null (sisa TTL lama tidak boleh terbawa)');
    console.log('✅ PASS\n');

    // === Test 5: isolasi antar user ===
    console.log('📝 Test 5: Isolasi antar user');
    const bBefore = await conversationStateService.getState(userB.id);
    assert(bBefore === null, 'user B belum punya state → null');

    await conversationStateService.setState(userB.id, 'WAITING_CONFIRMATION', { owner: 'B' }, 600);
    const aAfter = await conversationStateService.getState(userA.id);
    assert(aAfter!.state === 'IDLE', 'state user A tidak boleh terpengaruh oleh user B');
    console.log('✅ PASS\n');

    // === Test 6: clearState ===
    console.log('📝 Test 6: clearState');
    const cleared = await conversationStateService.clearState(userA.id);
    assert(cleared === true, 'clearState harus true saat ada state');
    assert((await conversationStateService.getState(userA.id)) === null, 'state A harus kosong');
    const clearedAgain = await conversationStateService.clearState(userA.id);
    assert(clearedAgain === false, 'clearState kedua harus false dan tidak error');
    assert((await conversationStateService.getState(userB.id)) !== null, 'state user B harus tetap ada');
    console.log('✅ PASS\n');

    // === Test 7: validasi input ===
    console.log('📝 Test 7: Validasi input');
    await expectAppError(() => conversationStateService.setState(userA.id, '   '), 400, 'state kosong');
    await expectAppError(() => conversationStateService.setState(userA.id, 'X', null, 0), 400, 'ttl = 0');
    await expectAppError(() => conversationStateService.setState(userA.id, 'X', null, -10), 400, 'ttl negatif');
    await expectAppError(() => conversationStateService.setState(userA.id, 'X', null, NaN), 400, 'ttl NaN');
    await expectAppError(() => conversationStateService.getState(''), 400, 'userId kosong');
    await expectAppError(
      () => conversationStateService.setState('00000000-0000-0000-0000-000000000000', 'X'),
      404,
      'userId tidak ada di database'
    );
    console.log('✅ PASS\n');

    // === Test 8: cascade delete ===
    console.log('📝 Test 8: Hapus user → ConversationState ikut terhapus (cascade)');
    await prisma.user.delete({ where: { id: userB.id } });
    const orphan = await prisma.conversationState.count({ where: { userId: userB.id } });
    assert(orphan === 0, 'state user yang dihapus harus ikut terhapus');
    console.log('✅ PASS\n');

    console.log('🎉 Semua test WA-011 berhasil!');
    console.log('\n📋 Summary:');
    console.log('   ✅ getState / setState / clearState berfungsi');
    console.log('   ✅ State tersimpan di tabel ConversationState');
    console.log('   ✅ Payload JSON arbitrer (nested) tersimpan dan terbaca utuh');
    console.log('   ✅ TTL dihitung menjadi expiresAt');
    console.log('   ✅ Satu user = satu state (upsert, tanpa duplikat)');
    console.log('   ✅ Isolasi antar user & validasi input');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
};

testConversationStateService();