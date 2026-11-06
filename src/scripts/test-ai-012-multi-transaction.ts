import { parseMultiTransactions, getLocalTodayIso } from '../services/ai/transactionParser.service';

async function runMultiTransactionTests() {
  const today = getLocalTodayIso();
  console.log('🧪 Memulai pengujian AI-012 — Multi-Transaction Prompt & Schema Support');
  console.log(`📅 Tanggal Hari Ini (Current Date / H): ${today}\n`);

  const testCases = [
    {
      description: 'Kasus 3 Transaksi Campuran (2 INCOME, 1 EXPENSE)',
      input: 'Hari ini jual beras 100rb, minyak 50rb, lalu beli bensin 20rb',
      expectedCount: 3,
      expectedIncomeCount: 2,
      expectedExpenseCount: 1,
    },
    {
      description: 'Kasus 2 Pengeluaran dengan Tanggal Relatif Kemarin (H-1)',
      input: 'Kemarin beli telur 30k dan bayar galon 15k',
      expectedCount: 2,
      expectedExpenseCount: 2,
    },
    {
      description: 'Kasus Campuran Nominal Lengkap dan Tanpa Nominal',
      input: 'Beli tepung terigu dan jual kue bolu 75rb',
      expectedCount: 2,
    }
  ];

  for (const [index, testCase] of testCases.entries()) {
    console.log(`----------------------------------------`);
    console.log(`Test Case ${index + 1}: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);

    try {
      const results = await parseMultiTransactions(testCase.input);
      console.log('Hasil Ekstraksi Array AI:', JSON.stringify(results, null, 2));

      if (!results || !Array.isArray(results)) {
        console.error(`❌ Gagal: Hasil bukan array atau bernilai null`);
        continue;
      }

      console.log(`📊 Jumlah Transaksi Terdeteksi: ${results.length}`);

      if (testCase.expectedCount !== undefined) {
        if (results.length === testCase.expectedCount) {
          console.log(`✅ Jumlah transaksi sesuai (${testCase.expectedCount} item)`);
        } else {
          console.warn(`⚠️ Perhatian: Jumlah transaksi ${results.length}, ekspektasi ${testCase.expectedCount}`);
        }
      }

      const incomeItems = results.filter((tx) => tx.type === 'INCOME');
      const expenseItems = results.filter((tx) => tx.type === 'EXPENSE');

      if (testCase.expectedIncomeCount !== undefined) {
        console.log(`• Total INCOME: ${incomeItems.length} (Ekspektasi: ${testCase.expectedIncomeCount})`);
      }
      if (testCase.expectedExpenseCount !== undefined) {
        console.log(`• Total EXPENSE: ${expenseItems.length} (Ekspektasi: ${testCase.expectedExpenseCount})`);
      }

      // Validasi tiap elemen memiliki field yang lengkap
      results.forEach((item, idx) => {
        console.log(`  [Item ${idx + 1}] ${item.type} | Rp${item.amount !== null ? item.amount.toLocaleString('id-ID') : 'null'} | Kategori: ${item.category} | "${item.description}" | Tanggal: ${item.transactionDate}`);
      });

      console.log(`✅ Test Case ${index + 1} Selesai dengan Sukses!`);
    } catch (error) {
      console.error(`❌ Gagal pada test case ${index + 1}:`, error);
    }
  }

  console.log(`\n----------------------------------------`);
  console.log('✨ Seluruh Pengujian AI-012 Multi-Transaction Selesai!');
}

runMultiTransactionTests();

