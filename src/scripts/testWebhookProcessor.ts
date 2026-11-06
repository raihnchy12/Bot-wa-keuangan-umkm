import { processWebhookPayload, WhatsAppWebhookPayload } from '../services/webhookProcessor.service';
import whatsappClient from '../config/whatsapp';
import { prisma } from '../config/db';

/**
 * Catatan: processWebhookPayload sekarang async dan memanggil onboarding (DB).
 * - Nomor 628123456789 adalah user dari seed (Budi), jadi tidak ada welcome message.
 * - whatsappClient.post di-mock agar tidak ada request asli ke Meta.
 */
const testWebhookProcessor = async () => {
  console.log('Testing Webhook Processor Service...\n');

  const originalPost = whatsappClient.post;
  let outgoingCount = 0;

  whatsappClient.post = (async (_url: string, data: any) => {
    outgoingCount++;
    return {
      status: 200,
      data: {
        messaging_product: 'whatsapp',
        contacts: [{ input: data.to, wa_id: data.to }],
        messages: [{ id: `wamid.MOCK_${outgoingCount}` }],
      },
    };
  }) as any;

  try {
    // Test payload 1: Incoming text message
    const payload1: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '1234567890',
                  phone_number_id: '1234567890',
                },
                messages: [
                  {
                    from: '628123456789',
                    id: 'msg_123',
                    timestamp: '1633024800',
                    type: 'text',
                    text: { body: 'Beli bensin 50000' },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    console.log('=== Test 1: Text Message ===');
    await processWebhookPayload(payload1);

    // Test payload 2: Message status update
    const payload2: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '1234567890',
                  phone_number_id: '1234567890',
                },
                statuses: [
                  {
                    id: 'msg_123',
                    status: 'delivered',
                    timestamp: '1633024801',
                    recipient_id: '628123456789',
                  },
                ],
              },
              field: 'message_status',
            },
          ],
        },
      ],
    };

    console.log('\n=== Test 2: Message Status Update ===');
    await processWebhookPayload(payload2);

    // Test payload 3: Multiple messages
    const payload3: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '1234567890',
                  phone_number_id: '1234567890',
                },
                messages: [
                  {
                    from: '628123456789',
                    id: 'msg_124',
                    timestamp: '1633024802',
                    type: 'text',
                    text: { body: 'Jual beras 100rb' },
                  },
                  {
                    from: '628123456789',
                    id: 'msg_125',
                    timestamp: '1633024803',
                    type: 'text',
                    text: { body: 'Jual minyak 75rb' },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    console.log('\n=== Test 3: Multiple Messages ===');
    await processWebhookPayload(payload3);

    // Test payload 4: Empty entries
    const payload4: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [],
    };

    console.log('\n=== Test 4: Empty Entries ===');
    await processWebhookPayload(payload4);

    console.log(`\nOutgoing WhatsApp messages (expected 0 for existing user): ${outgoingCount}`);
    console.log('\n✓ All webhook processor tests completed');
  } finally {
    whatsappClient.post = originalPost;
    await prisma.$disconnect();
  }
};

testWebhookProcessor().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});