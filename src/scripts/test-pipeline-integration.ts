import { processWebhookPayload, WhatsAppWebhookPayload } from '../services/webhookProcessor.service';
import { conversationStateService } from '../services/conversationState.service';
import { prisma } from '../config/db';
import { normalizePhoneNumber } from '../utils/phone';

function buildMockWebhookPayload(from: string, text: string, msgId: string = `msg_${Date.now()}`): WhatsAppWebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry_123',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550001234',
                phone_number_id: 'phone_num_id_123',
              },
              contacts: [
                {
                  profile: { name: 'Audit User Pipeline' },
                  wa_id: from,
                },
              ],
              messages: [
                {
                  from,
                  id: msgId,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function buildMockInteractiveButtonPayload(from: string, buttonId: string, buttonTitle: string, msgId: string = `msg_${Date.now()}`): WhatsAppWebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry_123',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550001234',
                phone_number_id: 'phone_num_id_123',
              },
              contacts: [
                {
                  profile: { name: 'Audit User Pipeline' },
                  wa_id: from,
                },
              ],
              messages: [
                {
                  from,
                  id: msgId,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'interactive',
                  interactive: {
                    type: 'button_reply',
                    button_reply: {
                      id: buttonId,
                      title: buttonTitle,
                    },
                  },
                } as any,
              ],
            },
          },
        ],
      },
    ],
  };
}

async function runPipelineAudit() {
  console.log('=== TEST INTEGRASI ALUR PESAN WHATSAPP: AUDIT LENGKAP ===\n');
  const testPhone = '628999888777';
  const normalizedPhone = normalizePhoneNumber(testPhone);

  // Bersihkan data tes sebelumnya
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
  });
  if (existingUser) {
    await prisma.conversationState.deleteMany({ where: { userId: existingUser.id } });
    await prisma.transaction.deleteMany({ where: { business: { userId: existingUser.id } } });
  }

  // Skenario 1: Pesan Non-Financial (Validation Guard)
  console.log('--- 1. Testing Pesan Sapaan (Validation Guard) ---');
  const payloadGreeting = buildMockWebhookPayload(testPhone, 'Halo bot apa kabar?');
  await processWebhookPayload(payloadGreeting);

  const userAfterGreeting = await prisma.user.findUnique({ where: { phoneNumber: normalizedPhone } });
  if (!userAfterGreeting) throw new Error('User harusnya sudah dibuat otomatis oleh Onboarding Service!');

  const state1 = await conversationStateService.getState(userAfterGreeting.id);
  console.log(`Status state setelah sapaan: ${state1 ? state1.state : 'IDLE'}`);
  if (state1 !== null) {
    throw new Error('State harusnya IDLE (null) setelah sapaan non-keuangan!');
  }
  console.log('✔ Skenario 1 Lolos: Validation Guard menangani sapaan dengan tepat tanpa mengubah state ke waiting.');

  // Skenario 2: Transaksi Multi-Item Masuk (AI Parser -> Guard -> Pending Transaction)
  console.log('\n--- 2. Testing Transaksi Multi-Item Masuk ---');
  const payloadTx = buildMockWebhookPayload(testPhone, 'Hari ini jual mie ayam 250rb dan beli telur 50rb');
  await processWebhookPayload(payloadTx);

  const state2 = await conversationStateService.getState(userAfterGreeting.id);
  console.log(`Status state setelah input transaksi: ${state2?.state}`);
  if (!state2 || state2.state !== 'WAITING_CONFIRMATION') {
    throw new Error('State harusnya WAITING_CONFIRMATION!');
  }
  const payloadDraft = state2.payload as any;
  console.log(`Draf tersimpan di payload ConversationState:`, JSON.stringify(payloadDraft, null, 2));
  console.log('✔ Skenario 2 Lolos: AI Parser mengekstrak transaksi, lolos guard, dan tersimpan di ConversationState.');

  // Skenario 3: Konfirmasi via Interactive Button Reply (Confirmation Handler -> Persistence)
  console.log('\n--- 3. Testing Konfirmasi via Interactive Button Reply ("YA" / "confirm_yes") ---');
  const payloadConfirm = buildMockInteractiveButtonPayload(testPhone, 'CONFIRM_YES', 'YA');
  await processWebhookPayload(payloadConfirm);

  const state3 = await conversationStateService.getState(userAfterGreeting.id);
  console.log(`Status state setelah konfirmasi: ${state3 ? state3.state : 'IDLE'}`);
  if (state3 !== null) {
    throw new Error('State harusnya dibersihkan kembali ke IDLE setelah transaksi tersimpan!');
  }

  const savedTransactions = await prisma.transaction.findMany({
    where: { business: { userId: userAfterGreeting.id } },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Jumlah transaksi tersimpan di database: ${savedTransactions.length}`);
  savedTransactions.forEach((tx: any, idx: number) => {
    console.log(`  ${idx + 1}. [${tx.type}] ${tx.description} - Rp ${tx.amount.toLocaleString('id-ID')} (${tx.category})`);
  });
  if (savedTransactions.length !== 2) {
    throw new Error('Dua transaksi multi-item harusnya tersimpan secara atomik!');
  }
  console.log('✔ Skenario 3 Lolos: Konfirmasi interaktif diproses dan data berhasil disimpan secara atomik.');

  // Skenario 4: State Expiry Handler (Sesi Kadaluarsa)
  console.log('\n--- 4. Testing State Expiry Handler (Sesi Kadaluarsa) ---');
  // Buat transaksi baru
  const payloadNewTx = buildMockWebhookPayload(testPhone, 'Beli gas lpg 22rb');
  await processWebhookPayload(payloadNewTx);

  const stateBeforeExpire = await conversationStateService.getState(userAfterGreeting.id);
  console.log(`Status state transaksi baru: ${stateBeforeExpire?.state}`);
  if (!stateBeforeExpire) throw new Error('State harusnya ada!');

  // Simulasikan state kadaluarsa di database dengan memundurkan expiresAt 15 menit ke belakang
  const pastTime = new Date(Date.now() - 15 * 60 * 1000);
  await prisma.conversationState.update({
    where: { id: stateBeforeExpire.id },
    data: { expiresAt: pastTime },
  });
  console.log(`State sengaja diupdate menjadi kadaluarsa (expiresAt: ${pastTime.toISOString()})`);

  // Kirim pesan berikutnya dari user
  const payloadAfterExpire = buildMockWebhookPayload(testPhone, 'Beli minyak goreng 30rb');
  await processWebhookPayload(payloadAfterExpire);

  // Verifikasi state yang kadaluarsa sebelumnya dibersihkan, dan draf baru (minyak goreng) dicatat
  const stateAfterExpire = await conversationStateService.getState(userAfterGreeting.id);
  console.log(`Status state setelah sesi lama kadaluarsa dan pesan baru masuk: ${stateAfterExpire?.state}`);
  console.log(`Payload state baru:`, JSON.stringify(stateAfterExpire?.payload, null, 2));

  const newDraft = stateAfterExpire?.payload as any;
  const draftDesc = newDraft?.description || newDraft?.transactions?.[0]?.description;
  if (!draftDesc || !draftDesc.toLowerCase().includes('minyak')) {
    throw new Error('State kadaluarsa harusnya dibersihkan dan digantikan draf transaksi baru!');
  }
  console.log('✔ Skenario 4 Lolos: State Expiry Handler membersihkan state lama dan melanjutkan pemrosesan input baru dengan mulus.');

  // Cleanup data tes
  await prisma.conversationState.deleteMany({ where: { userId: userAfterGreeting.id } });
  await prisma.transaction.deleteMany({ where: { business: { userId: userAfterGreeting.id } } });

  console.log('\n=======================================================');
  console.log('🎉 SEMUA INTEGRASI PIPELINE 100% TERVERIFIKASI & LOLOS!');
  console.log('=======================================================');
}

runPipelineAudit()
  .catch((err) => {
    console.error('❌ Pipeline Audit GAGAL:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
