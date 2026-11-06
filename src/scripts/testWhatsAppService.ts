import { sendTextMessage } from '../services/whatsapp.service';
import whatsappClient from '../config/whatsapp';

const testWhatsAppService = async () => {
  console.log('Testing WhatsApp Service (sendTextMessage)...\n');

  // Test 1: Verify function call with mock / error handling
  console.log('=== Test 1: Function Execution & Error Handling ===');
  
  // Save original post method
  const originalPost = whatsappClient.post;

  try {
    // Mock successful post response
    let lastPayload: any = null;
    let lastUrl: string = '';

    whatsappClient.post = (async (url: string, data: any) => {
      lastUrl = url;
      lastPayload = data;
      return {
        status: 200,
        data: {
          messaging_product: 'whatsapp',
          contacts: [{ input: '628123456789', wa_id: '628123456789' }],
          messages: [{ id: 'wamid.HBgLMTIzNDU2Nzg5MA==' }],
        },
      };
    }) as any;

    const result = await sendTextMessage('628123456789', 'Halo, ini pesan tes!');

    if (!result.success) {
      throw new Error(`Expected success to be true, got ${result.success}`);
    }

    if (result.messageId !== 'wamid.HBgLMTIzNDU2Nzg5MA==') {
      throw new Error(`Unexpected messageId: ${result.messageId}`);
    }

    if (lastPayload.messaging_product !== 'whatsapp' ||
        lastPayload.recipient_type !== 'individual' ||
        lastPayload.to !== '628123456789' ||
        lastPayload.type !== 'text' ||
        lastPayload.text.body !== 'Halo, ini pesan tes!') {
      throw new Error(`Payload format incorrect: ${JSON.stringify(lastPayload)}`);
    }

    console.log('✓ Success response & payload format verified!');
    console.log(`  - Target URL: ${lastUrl}`);
    console.log(`  - Message ID: ${result.messageId}`);

    // Test 2: Error handling simulation (e.g., token expired or invalid number)
    console.log('\n=== Test 2: Error Handling Simulation ===');
    whatsappClient.post = (async () => {
      const error: any = new Error('Request failed with status code 401');
      error.isAxiosError = true;
      error.response = {
        status: 401,
        data: {
          error: {
            message: 'Invalid OAuth access token',
            type: 'OAuthException',
            code: 190,
          },
        },
      };
      throw error;
    }) as any;

    const errorResult = await sendTextMessage('628123456789', 'Test error');

    if (errorResult.success) {
      throw new Error('Expected success to be false on API error');
    }

    if (!errorResult.error?.includes('Invalid OAuth access token')) {
      throw new Error(`Expected error message to contain token error, got: ${errorResult.error}`);
    }

    console.log('✓ Error handled gracefully without crashing!');
    console.log(`  - Returned error: ${errorResult.error}`);

    console.log('\n✓ All sendTextMessage tests passed successfully!');
  } finally {
    // Restore original client method
    whatsappClient.post = originalPost;
  }
};

testWhatsAppService().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
