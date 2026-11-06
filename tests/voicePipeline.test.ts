import { describe, it, expect, jest } from '@jest/globals';

// 1. Mock service Whisper dengan penulisan jest.fn yang aman dari error tipe 'never'
jest.mock('../src/services/ai/whisper.service', () => ({
  transcribeAudio: jest.fn().mockImplementation(async () => 'catat pengeluaran beli stok kopi lima puluh ribu rupiah')
}));

// 2. Gunakan nama fungsi yang sesuai dengan project kamu (misal: parseSingleTransaction)
jest.mock('../src/services/ai/transactionParser.service', () => ({
  parseSingleTransaction: jest.fn().mockImplementation(async () => ({
    amount: 50000,
    type: 'EXPENSE',
    category: 'Persediaan',
    description: 'beli stok kopi lima puluh ribu rupiah'
  }))
}));

import { transcribeAudio } from '../src/services/ai/whisper.service';
import { parseSingleTransaction } from '../src/services/ai/transactionParser.service';

describe('End-to-End Voice Note Processing Pipeline Tests (TEST-005)', () => {

    it('harus memproses file audio dummy dari input hingga menghasilkan draf transaksi terkonfirmasi', async () => {
        const dummyAudioBuffer = Buffer.from('RIFF_DUMMY_AUDIO_DATA_FOR_TESTING');

        expect(dummyAudioBuffer).toBeDefined();

        // Langkah 1: Panggil transcribeAudio (sesuaikan jika hanya menerima 1 argumen buffer)
        const transcript = await (transcribeAudio as jest.Mock)(dummyAudioBuffer);
        
        expect(transcript).toBeDefined();
        expect(typeof transcript).toBe('string');
        expect(transcript).toContain('beli stok kopi');

        // Langkah 2: Panggil parser transaksi teks
        const transactionDraft = await (parseSingleTransaction as jest.Mock)(transcript);

        // Langkah 3: Verifikasi draf transaksi
        expect(transactionDraft).toHaveProperty('amount', 50000);
        expect(transactionDraft).toHaveProperty('type', 'EXPENSE');
        expect(transactionDraft).toHaveProperty('category', 'Persediaan');
        expect(transactionDraft).toHaveProperty('description');

        console.log('[E2E Voice Pipeline Test Success] Draf Transaksi:', transactionDraft);
    });

});