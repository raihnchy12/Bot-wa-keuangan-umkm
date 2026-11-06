import { parseSingleTransaction, getLocalTodayIso } from '../services/ai/transactionParser.service';

async function runDateParserTests() {
  const today = getLocalTodayIso();
  console.log('🧪 Memulai pengujian AI-006 — Relative Transaction Date Parser');
  console.log(`📅 Tanggal Hari Ini (Current Date / H): ${today}\n`);

  const testCases = [
    {
      description: 'Kasus Kemarin (H-1)',
      input: 'Kemarin beli beras 100k',
      expectedRelative: 'H-1'
    },
    {
      description: 'Kasus Hari Ini tanpa kata keterangan (Default H)',
      input: 'Jual buket bunga 150rb',
      expectedRelative: 'H'
    },
    {
      description: 'Kasus Tadi Pagi (H)',
      input: 'Tadi pagi bayar galon 20rb',
      expectedRelative: 'H'
    },
    {
      description: 'Kasus Dua Hari Lalu (H-2)',
      input: 'Dua hari lalu beli gas elpiji 22k',
      expectedRelative: 'H-2'
    }
  ];

  for (const [index, testCase] of testCases.entries()) {
    console.log(`----------------------------------------`);
    console.log(`Test Case ${index + 1}: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);

    try {
      const result = await parseSingleTransaction(testCase.input);
      console.log('Hasil Ekstraksi AI:', JSON.stringify(result, null, 2));

      if (!result) {
        console.error(`❌ Gagal: Tidak ada hasil ekstraksi`);
      } else {
        console.log(`✅ transactionDate: ${result.transactionDate} (Ekspektasi: ${testCase.expectedRelative})`);
      }
    } catch (error) {
      console.error(`❌ Gagal pada test case ${index + 1}:`, error);
    }
  }

  console.log(`----------------------------------------`);
  console.log('✨ Pengujian Task AI-006 Selesai!');
}

runDateParserTests();

