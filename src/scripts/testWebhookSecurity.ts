import crypto from 'crypto';
import config from '../config/env';
import { verifyMetaSignature, extractMessageId, dedupCache } from '../utils/webhookSecurity';

const testWebhookSecurity = async () => {
  console.log('Testing Webhook Security (Signature & Deduplication)...\n');

  // ===== SIGNATURE VERIFICATION TESTS =====
  console.log('=== SIGNATURE VERIFICATION TESTS ===\n');

  const testPayload = {
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
                  id: 'msg_test_001',
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

  const rawBody = JSON.stringify(testPayload);

  // Test 1: Valid signature
  console.log('Test 1: Valid Signature');
  const validHash = crypto
    .createHmac('sha256', config.waAppSecret)
    .update(rawBody)
    .digest('hex');
  const validSignature = `sha256=${validHash}`;

  const isValid1 = verifyMetaSignature(rawBody, validSignature);
  console.log(`  Result: ${isValid1 ? '✓ PASS' : '✗ FAIL'} - Valid signature verified\n`);

  // Test 2: Invalid signature
  console.log('Test 2: Invalid Signature');
  const invalidSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';
  const isValid2 = verifyMetaSignature(rawBody, invalidSignature);
  console.log(`  Result: ${!isValid2 ? '✓ PASS' : '✗ FAIL'} - Invalid signature rejected\n`);

  // Test 3: Missing signature format
  console.log('Test 3: Missing Signature Format');
  const malformedSignature = 'invalid_format_12345';
  const isValid3 = verifyMetaSignature(rawBody, malformedSignature);
  console.log(`  Result: ${!isValid3 ? '✓ PASS' : '✗ FAIL'} - Malformed signature rejected\n`);

  // ===== MESSAGE ID EXTRACTION TESTS =====
  console.log('=== MESSAGE ID EXTRACTION TESTS ===\n');

  console.log('Test 4: Extract Message ID from Valid Payload');
  const extractedId = extractMessageId(testPayload);
  const isValid4 = extractedId === 'msg_test_001';
  console.log(`  Extracted ID: ${extractedId}`);
  console.log(`  Result: ${isValid4 ? '✓ PASS' : '✗ FAIL'} - Message ID extracted correctly\n`);

  console.log('Test 5: Extract Message ID from Payload without Messages');
  const payloadNoMessages = {
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
              statuses: [],
            },
            field: 'message_status',
          },
        ],
      },
    ],
  };

  const extractedId2 = extractMessageId(payloadNoMessages);
  const isValid5 = extractedId2 === null;
  console.log(`  Extracted ID: ${extractedId2}`);
  console.log(`  Result: ${isValid5 ? '✓ PASS' : '✗ FAIL'} - Returns null for non-message payload\n`);

  // ===== DEDUPLICATION CACHE TESTS =====
  console.log('=== DEDUPLICATION CACHE TESTS ===\n');

  console.log('Test 6: Add Message ID to Cache');
  const testMessageId = 'msg_dedup_test_001';
  dedupCache.add(testMessageId);
  const hasMessage1 = dedupCache.has(testMessageId);
  console.log(`  Message ID: ${testMessageId}`);
  console.log(`  Result: ${hasMessage1 ? '✓ PASS' : '✗ FAIL'} - Message added to cache\n`);

  console.log('Test 7: Detect Duplicate Message ID');
  const isDuplicate = dedupCache.has(testMessageId);
  console.log(`  Message ID: ${testMessageId}`);
  console.log(`  Result: ${isDuplicate ? '✓ PASS' : '✗ FAIL'} - Duplicate detected\n`);

  console.log('Test 8: Message ID Not in Cache');
  const nonExistentId = 'msg_nonexistent_999';
  const hasMessage2 = dedupCache.has(nonExistentId);
  console.log(`  Message ID: ${nonExistentId}`);
  console.log(`  Result: ${!hasMessage2 ? '✓ PASS' : '✗ FAIL'} - New message ID not in cache\n`);

  // ===== SUMMARY =====
  console.log('========== TEST SUMMARY ==========');
  const allPassed =
    isValid1 && !isValid2 && !isValid3 && isValid4 && isValid5 && hasMessage1 && isDuplicate && !hasMessage2;
  console.log(`Status: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

  process.exit(allPassed ? 0 : 1);
};

testWebhookSecurity();
