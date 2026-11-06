import { parseSingleTransaction } from '../services/ai/transactionParser.service';
import { validateTransaction } from '../services/ai/transactionGuard.service';

async function runValidationGuardTests() {
  console.log('🧪 Memulai pengujian AI-007 — Transaction Validation Guard\n');

  const testCases = [
    {
      group: 'Non-Financial Guard',
      input: 'Halo bot apa kabar?',
      expectedCode: 'NON_FINANCIAL',
      expectedValid: false,
    },
    {
      group: 'Non-Financial Guard',
      input: 'Pagi min',
      expectedCode: 'NON_FINANCIAL',
      expectedValid: false,
    },
    {
      group: 'Non-Financial Guard',
      input: 'Terima kasih',
      expectedCode: 'NON_FINANCIAL',
      expectedValid: false,
    },
    {
      group: 'Amount Guard (Missing Amount)',
      input: 'Beli gas elpiji dan beras',
      expectedCode: 'MISSING_AMOUNT',
      expectedValid: false,
    },
    {
      group: 'Amount Guard (Invalid Amount <= 0)',
      // Pengujian unit langsung terhadap hasil dengan amount 0
      mockAmountZero: true,
      input: 'Beli bumbu dapur 0 rupiah',
      expectedCode: 'INVALID_AMOUNT',
      expectedValid: false,
    },
    {
      group: 'Valid Transaction (Expense)',
      input: 'Kemarin beli beras 100k',
      expectedValid: true,
    },
    {
      group: 'Valid Transaction (Income)',
      input: 'Jual buket bunga 150rb',
      expectedValid: true,
    },
    {
      group: 'Valid Transaction with Greeting Prefix',
      input: 'Halo min, tadi beli bensin 20rb',
      expectedValid: true,
    }
  ];

  let passedCount = 0;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`----------------------------------------`);
    console.log(`Test Case ${index + 1} [${testCase.group}]: "${testCase.input}"`);

    try {
      let parsed = await parseSingleTransaction(testCase.input);

      // Jika simulasi amount zero
      if (testCase.mockAmountZero && parsed) {
        parsed.amount = 0;
      }

      console.log('Hasil Parsing AI:', parsed ? JSON.stringify(parsed) : 'null');

      const validation = validateTransaction(testCase.input, parsed);
      console.log('Hasil Validation Guard:', {
        isValid: validation.isValid,
        errorCode: validation.errorCode,
        replyMessage: validation.replyMessage.split('\n')[0] + '...'
      });

      const isMatch = validation.isValid === testCase.expectedValid &&
        (testCase.expectedCode ? validation.errorCode === testCase.expectedCode : true);

      if (isMatch) {
        console.log(`✅ LULUS: Sesuai ekspektasi (isValid: ${validation.isValid}${validation.errorCode ? `, errorCode: ${validation.errorCode}` : ''})`);
        passedCount++;
      } else {
        console.error(`❌ GAGAL: Ekspektasi isValid=${testCase.expectedValid}, didapat=${validation.isValid}`);
      }
    } catch (error) {
      console.error(`❌ Gagal saat menjalankan test case ${index + 1}:`, error);
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Hasil Akhir: ${passedCount} / ${testCases.length} Test Cases LULUS`);
  console.log(`========================================\n`);
}

runValidationGuardTests();

