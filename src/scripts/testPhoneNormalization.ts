import { normalizePhoneNumber } from '../utils/phone';

const testCases = [
  // Local Indonesian format
  { input: '0812-3456-789', expected: '628123456789', description: 'Local format with dashes' },
  { input: '0812 3456 789', expected: '628123456789', description: 'Local format with spaces' },
  { input: '08123456789', expected: '628123456789', description: 'Local format plain' },
  
  // International format with symbols
  { input: '+62 812 3456 789', expected: '628123456789', description: 'International with plus and spaces' },
  { input: '+62-812-3456-789', expected: '628123456789', description: 'International with plus and dashes' },
  { input: '+628123456789', expected: '628123456789', description: 'International with plus, no spaces' },
  
  // Already normalized
  { input: '628123456789', expected: '628123456789', description: 'Already normalized' },
  { input: '62 812 3456 789', expected: '628123456789', description: 'Normalized with spaces' },
  
  // Edge cases
  { input: '081234567890123', expected: '6281234567890123', description: 'Long number starting with 0' },
  { input: '62812345678', expected: '62812345678', description: 'Short international number' },
];

console.log('Running WhatsApp Phone Number Normalization Tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, description }) => {
  try {
    const result = normalizePhoneNumber(input);
    if (result === expected) {
      console.log(`✓ PASS: ${description}`);
      console.log(`  Input: "${input}" → Output: "${result}"\n`);
      passed++;
    } else {
      console.log(`✗ FAIL: ${description}`);
      console.log(`  Input: "${input}"`);
      console.log(`  Expected: "${expected}"`);
      console.log(`  Got: "${result}"\n`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ ERROR: ${description}`);
    console.log(`  Input: "${input}"`);
    console.log(`  Error: ${(error as Error).message}\n`);
    failed++;
  }
});

// Test error case
console.log('Testing error case (no digits)...');
try {
  normalizePhoneNumber('---+++');
  console.log('✗ FAIL: Should throw error for input with no digits\n');
  failed++;
} catch (error) {
  console.log(`✓ PASS: Correctly threw error for no digits\n`);
  passed++;
}

console.log(`\n========== RESULTS ==========`);
console.log(`Passed: ${passed}/${testCases.length + 1}`);
console.log(`Failed: ${failed}/${testCases.length + 1}`);
console.log(`Status: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
