import { prisma } from '../config/db';
import whatsappClient from '../config/whatsapp';
import { handleIncomingMessage } from '../services/whatsapp/messageHandler.service';
import { ParsedMessage } from '../utils/messageParser';

/**
 * WA-010: User Identification & Onboarding via Webhook
 * Menggunakan database sungguhan, tetapi whatsappClient.post di-mock
 * sehingga tidak ada pesan asli yang terkirim ke Meta.
 */

const TEST_PHONE_NEW = '62899010001';
const TEST_PHONE_RACE = '62899010002';
const TEST_PHONE_FAIL = '62899010003';
const TEST_PHONE_LOCAL_RAW = '0899-0100-04';
const TEST_PHONE_LOCAL_NORMALIZED = '62899010004';

const ALL_TEST_PHONES = [
  TEST_PHONE_NEW,
  TEST_PHONE_RACE,
  TEST_PHONE_FAIL,
  TEST_PHONE_LOCAL_NORMALIZED,
];

const makeMsg = (from: string, name: string, msgId: string): ParsedMessage => ({
  from,
  name,
  msgId,
  timestamp: '1633024800',
  type: 'text',
  textBody: 'Halo',
});

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

const cleanup = async () => {
  // Business & ConversationState ikut terhapus (onDelete: Cascade)
  await prisma.user.deleteMany({ where: { phoneNumber: { in: ALL_TEST_PHONES } } });
};

const testWA010 = async () => {
  console.log('🧪 Testing WA-010: User Identification & Onboarding via Webhook\n');

  const originalPost = whatsappClient.post;
  let sentPayloads: any[] = [];

  const mockPostSuccess = (async (_url: string, data: any) => {
    sentPayloads.push(data);
    return {
      status: 200,
      data: {
        messaging_product: 'whatsapp',
        contacts: [{ input: data.to, wa_id: data.to }],
        messages: [{ id: `wamid.TEST_${sentPayloads.length}` }],
      },
    };
  }) as any;

  try {
    await cleanup();
    whatsappClient.post = mockPostSuccess;

    // === Test 1: Pengguna baru ===
    console.log('📝 Test 1: Pesan dari nomor BARU → user & business dibuat + welcome terkirim');
    sentPayloads = [];
    const r1 = (await handleIncomingMessage(makeMsg(TEST_PHONE_NEW, 'Ahmad Test', 'wamid.t1'))) as any;

    assert(r1.isNewUser === true, 'isNewUser harus true');
    assert(r1.user.phoneNumber === TEST_PHONE_NEW, 'phoneNumber user harus sesuai');
    assert(r1.business.userId === r1.user.id, 'business harus milik user baru');
    assert(sentPayloads.length === 1, `welcome harus terkirim 1x, got ${sentPayloads.length}`);
    assert(sentPayloads[0].to === TEST_PHONE_NEW, 'welcome harus dikirim ke nomor pengirim');
    assert(
      String(sentPayloads[0].text?.body).includes('Selamat datang'),
      'isi pesan harus mengandung "Selamat datang"'
    );
    console.log('✅ PASS\n');

    // === Test 2: Pengguna lama ===
    console.log('📝 Test 2: Pesan kedua dari nomor yang SAMA → tidak ada welcome lagi');
    const r2 = (await handleIncomingMessage(makeMsg(TEST_PHONE_NEW, 'Ahmad Test', 'wamid.t2'))) as any;

    assert(r2.isNewUser === false, 'isNewUser harus false');
    assert(r2.user.id === r1.user.id, 'user id harus sama');
    assert(r2.business.id === r1.business.id, 'business id harus sama');
    assert(sentPayloads.length === 1, 'tidak boleh ada welcome tambahan');
    console.log('✅ PASS\n');

    // === Test 3: Race condition ===
    console.log('📝 Test 3: 2 pesan PARALEL dari nomor baru → 1 user, 1 business, 1 welcome');
    sentPayloads = [];
    const [a, b] = (await Promise.all([
      handleIncomingMessage(makeMsg(TEST_PHONE_RACE, 'Rina Race', 'wamid.t3a')),
      handleIncomingMessage(makeMsg(TEST_PHONE_RACE, 'Rina Race', 'wamid.t3b')),
    ])) as any[];

    const raceUsers = await prisma.user.findMany({
      where: { phoneNumber: TEST_PHONE_RACE },
      include: { businesses: true },
    });
    assert(raceUsers.length === 1, `harus 1 user, got ${raceUsers.length}`);
    assert(raceUsers[0].businesses.length === 1, 'harus 1 business');
    assert(a.user.id === b.user.id, 'kedua pesan harus teridentifikasi sebagai user yang sama');
    assert(
      [a.isNewUser, b.isNewUser].filter(Boolean).length === 1,
      'tepat 1 pesan yang dianggap pengguna baru'
    );
    assert(sentPayloads.length === 1, `welcome harus 1x, got ${sentPayloads.length}`);
    console.log('✅ PASS\n');

    // === Test 4: Kirim welcome gagal ===
    console.log('📝 Test 4: Pengiriman welcome GAGAL → tidak melempar error, data tetap tersimpan');
    whatsappClient.post = (async () => {
      const error: any = new Error('Request failed with status code 401');
      error.isAxiosError = true;
      error.response = {
        status: 401,
        data: { error: { message: 'Invalid OAuth access token', type: 'OAuthException', code: 190 } },
      };
      throw error;
    }) as any;

    const r4 = (await handleIncomingMessage(makeMsg(TEST_PHONE_FAIL, 'Siti Fail', 'wamid.t4'))) as any;
    assert(r4.isNewUser === true, 'isNewUser harus true');
    const failUser = await prisma.user.findUnique({ where: { phoneNumber: TEST_PHONE_FAIL } });
    assert(failUser !== null, 'user harus tetap tersimpan di database');
    console.log('✅ PASS\n');

    // === Test 5: Normalisasi nomor ===
    console.log('📝 Test 5: Nomor format lokal dinormalisasi sebelum disimpan');
    whatsappClient.post = mockPostSuccess;
    sentPayloads = [];
    const r5 = (await handleIncomingMessage(makeMsg(TEST_PHONE_LOCAL_RAW, 'Dewi Lokal', 'wamid.t5'))) as any;
    assert(
      r5.user.phoneNumber === TEST_PHONE_LOCAL_NORMALIZED,
      `phoneNumber harus ${TEST_PHONE_LOCAL_NORMALIZED}, got ${r5.user.phoneNumber}`
    );
    assert(sentPayloads[0]?.to === TEST_PHONE_LOCAL_NORMALIZED, 'welcome dikirim ke nomor ternormalisasi');
    console.log('✅ PASS\n');

    console.log('🎉 Semua test WA-010 berhasil!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Setiap pesan masuk teridentifikasi ke User & Business');
    console.log('   ✅ Pengguna baru menerima welcome message (tepat 1x)');
    console.log('   ✅ Pengguna lama tidak menerima welcome lagi');
    console.log('   ✅ Race condition onboarding tertangani (P2002 retry)');
    console.log('   ✅ Kegagalan kirim welcome tidak merusak alur');
    console.log('   ✅ Nomor telepon dinormalisasi');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    whatsappClient.post = originalPost;
    await cleanup();
    await prisma.$disconnect();
  }
};

testWA010();