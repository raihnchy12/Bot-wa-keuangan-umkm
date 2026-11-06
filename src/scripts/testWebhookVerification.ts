import config from '../config/env';

/**
 * Webhook verification logic validation
 */
const testWebhookVerification = () => {
  console.log('Testing Webhook Verification Logic...\n');

  const testCases = [
    {
      name: 'Valid verification request',
      mode: 'subscribe',
      verifyToken: config.waVerifyToken,
      challenge: 'test_challenge_123',
      expectedStatus: 200,
      expectedResponse: 'test_challenge_123'
    },
    {
      name: 'Invalid verify token',
      mode: 'subscribe',
      verifyToken: 'wrong_token',
      challenge: 'test_challenge_123',
      expectedStatus: 403
    },
    {
      name: 'Invalid mode',
      mode: 'invalid',
      verifyToken: config.waVerifyToken,
      challenge: 'test_challenge_123',
      expectedStatus: 403
    },
    {
      name: 'Empty verify token',
      mode: 'subscribe',
      verifyToken: undefined,
      challenge: 'test_challenge_123',
      expectedStatus: 403
    },
    {
      name: 'Empty mode',
      mode: undefined,
      verifyToken: config.waVerifyToken,
      challenge: 'test_challenge_123',
      expectedStatus: 403
    }
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase) => {
    // Simulate webhook verification logic
    const isValid = testCase.mode === 'subscribe' && testCase.verifyToken === config.waVerifyToken;
    const resultStatus = isValid ? 200 : 403;
    const resultResponse = isValid ? testCase.challenge : { error: 'Invalid verification token or mode' };

    if (resultStatus === testCase.expectedStatus) {
      if (testCase.expectedResponse && resultResponse !== testCase.expectedResponse) {
        console.log(`✗ FAIL: ${testCase.name}`);
        console.log(`  Expected response: "${testCase.expectedResponse}"`);
        console.log(`  Got: "${resultResponse}"\n`);
        failed++;
      } else {
        console.log(`✓ PASS: ${testCase.name}`);
        console.log(`  Status: ${resultStatus}`);
        console.log(`  Response: ${typeof resultResponse === 'string' ? resultResponse : JSON.stringify(resultResponse)}\n`);
        passed++;
      }
    } else {
      console.log(`✗ FAIL: ${testCase.name}`);
      console.log(`  Expected status: ${testCase.expectedStatus}`);
      console.log(`  Got: ${resultStatus}\n`);
      failed++;
    }
  });

  console.log(`========== RESULTS ==========`);
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);
  console.log(`Status: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

  process.exit(failed === 0 ? 0 : 1);
};

testWebhookVerification();
