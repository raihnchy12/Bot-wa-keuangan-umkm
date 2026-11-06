import {
  sendInteractiveButtons,
  formatButtonFallbackText,
} from '../services/whatsapp.service';
import whatsappClient from '../config/whatsapp';

const testInteractiveButtons = async () => {
  console.log('Testing Interactive Button Service & Fallback (sendInteractiveButtons)...\n');

  const originalPost = whatsappClient.post;

  try {
    // === Test 1: Successful Interactive Button Message ===
    console.log('=== Test 1: Successful Interactive Button Message ===');
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

    const buttons = [
      { id: 'CONFIRM_YES', title: 'Ya, Simpan' },
      { id: 'CONFIRM_NO', title: 'Batal' },
    ];

    const result = await sendInteractiveButtons(
      '628123456789',
      'Apakah transaksi ini sudah benar?',
      buttons
    );

    if (!result.success) {
      throw new Error(`Expected success to be true, got ${result.success}`);
    }

    if (result.fallbackUsed !== false) {
      throw new Error(`Expected fallbackUsed to be false, got ${result.fallbackUsed}`);
    }

    if (result.messageId !== 'wamid.HBgLMTIzNDU2Nzg5MA==') {
      throw new Error(`Unexpected messageId: ${result.messageId}`);
    }

    if (
      lastPayload.messaging_product !== 'whatsapp' ||
      lastPayload.recipient_type !== 'individual' ||
      lastPayload.to !== '628123456789' ||
      lastPayload.type !== 'interactive' ||
      lastPayload.interactive?.type !== 'button' ||
      lastPayload.interactive?.body?.text !== 'Apakah transaksi ini sudah benar?' ||
      !Array.isArray(lastPayload.interactive?.action?.buttons) ||
      lastPayload.interactive.action.buttons.length !== 2
    ) {
      throw new Error(`Payload format incorrect: ${JSON.stringify(lastPayload)}`);
    }

    console.log('✓ Interactive button message sent and payload verified!');
    console.log(`  - Target URL: ${lastUrl}`);
    console.log(`  - Message ID: ${result.messageId}`);
    console.log(`  - Fallback used: ${result.fallbackUsed}`);

    // === Test 2: Fallback to Text Message when Interactive Request Fails ===
    console.log('\n=== Test 2: Fallback to Text Message on Interactive API Error ===');
    let callCount = 0;
    let fallbackPayload: any = null;

    whatsappClient.post = (async (url: string, data: any) => {
      callCount++;
      if (data.type === 'interactive') {
        const error: any = new Error('Interactive message not supported');
        error.isAxiosError = true;
        error.response = {
          status: 400,
          data: {
            error: {
              message: 'Interactive button not supported in current window',
              type: 'OAuthException',
              code: 131051,
            },
          },
        };
        throw error;
      }

      // Plain text message post call succeeds
      fallbackPayload = data;
      return {
        status: 200,
        data: {
          messaging_product: 'whatsapp',
          contacts: [{ input: '628123456789', wa_id: '628123456789' }],
          messages: [{ id: 'wamid.HBgLTEXTFALLBACK123==' }],
        },
      };
    }) as any;

    const fallbackResult = await sendInteractiveButtons(
      '628123456789',
      'Konfirmasi Transaksi:',
      buttons
    );

    if (!fallbackResult.success) {
      throw new Error(`Expected fallbackResult.success to be true, got ${fallbackResult.success}`);
    }

    if (fallbackResult.fallbackUsed !== true) {
      throw new Error(`Expected fallbackUsed to be true, got ${fallbackResult.fallbackUsed}`);
    }

    if (fallbackResult.messageId !== 'wamid.HBgLTEXTFALLBACK123==') {
      throw new Error(`Unexpected messageId on fallback: ${fallbackResult.messageId}`);
    }

    const expectedFallbackText = formatButtonFallbackText('Konfirmasi Transaksi:', buttons);
    if (fallbackPayload?.text?.body !== expectedFallbackText) {
      throw new Error(
        `Fallback text body mismatch.\nExpected: ${expectedFallbackText}\nGot: ${fallbackPayload?.text?.body}`
      );
    }

    console.log('✓ Fallback mechanism executed successfully!');
    console.log(`  - Total API calls made: ${callCount}`);
    console.log(`  - Fallback message ID: ${fallbackResult.messageId}`);
    console.log(`  - Fallback text sent:\n"${fallbackPayload.text.body}"`);

    // === Test 3: Total Failure (Interactive and Fallback both fail) ===
    console.log('\n=== Test 3: Both Interactive and Fallback Fail ===');
    whatsappClient.post = (async () => {
      const error: any = new Error('Network error');
      error.isAxiosError = true;
      error.response = {
        status: 500,
        data: {
          error: {
            message: 'Internal server error',
            type: 'ServerError',
            code: 500,
          },
        },
      };
      throw error;
    }) as any;

    const failureResult = await sendInteractiveButtons(
      '628123456789',
      'Test total failure',
      buttons
    );

    if (failureResult.success) {
      throw new Error('Expected failureResult.success to be false');
    }

    if (!failureResult.fallbackUsed) {
      throw new Error('Expected fallbackUsed to be true on total failure');
    }

    console.log('✓ Total failure handled gracefully without uncaught exceptions!');
    console.log(`  - Returned error: ${failureResult.error}`);

    console.log('\n✓ All sendInteractiveButtons tests passed successfully!');
  } finally {
    whatsappClient.post = originalPost;
  }
};

testInteractiveButtons().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
