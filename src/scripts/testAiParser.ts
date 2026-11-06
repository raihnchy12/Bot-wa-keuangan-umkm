import { parseSingleTransaction } from '../services/ai/transactionParser.service';

async function runTests() {
  console.log('🧪 Memulai pengujian AI Parser (Task AI-001 s.d. AI-005)...\n');

  // Daftar test case untuk menguji berbagai skenario (nominal lengkap, tanpa nominal, berbagai kategori standar)
  const testCases = [
    "Beli bensin motor 20rb",
    "Terima uang penjualan kue Rp150.000 hari ini",
    "Bayar gaji karyawan toko 2jt",
    "Beli bahan baku tepung dan gula",
    "Bayar tagihan listrik bulanan",
    "Makan siang di warung sebelah", // Harusnya masuk kategori "Lain-lain" (Fallback)
    "Beli kopi tanpa sebut harga"    // Harusnya amount bernilai null
  ];

  for (const [index, text] of testCases.entries()) {
    console.log(`----------------------------------------`);
    console.log(`Test Case ${index + 1}: "${text}"`);
    
    try {
      const result = await parseSingleTransaction(text);
      console.log('Hasil Ekstraksi:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`❌ Gagal pada test case ${index + 1}:`, error);
    }
  }

  console.log(`----------------------------------------`);
  console.log('✨ Pengujian selesai!');
}

runTests();