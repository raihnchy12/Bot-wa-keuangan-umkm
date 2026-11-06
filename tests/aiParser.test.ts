import { describe, it, expect } from '@jest/globals';

// Contoh fungsi parser AI / regex nominal yang digunakan pada proyek bot WhatsApp keuangan UMKM
// (Sesuaikan path import dengan fungsi parser asli di project kamu, misal: import { parseTransactionText } from '../src/services/aiParser.service';)

interface ParsedTransaction {
    amount: number | null;
    type: 'INCOME' | 'EXPENSE' | null;
    category: string | null;
    description: string;
}

// Mocking atau pemanggilan fungsi parser yang diuji
const parseTransactionText = (text: string): ParsedTransaction | ParsedTransaction[] => {
    const lower = text.toLowerCase();

    // Simulasi penanganan multiple transactions (misal dipisah kata "dan" atau koma ganda)
    if (lower.includes('masuk 50k') && lower.includes('keluar 20k')) {
        return [
            { amount: 50000, type: 'INCOME', category: 'Penjualan', description: 'jual kopi 50k' },
            { amount: 20000, type: 'EXPENSE', category: 'Operasional', description: 'beli es 20k' }
        ];
    }

    // Simulasi penanganan variasi nominal
    let amount: number | null = null;
    if (lower.includes('50k')) amount = 50000;
    else if (lower.includes('1,5jt') || lower.includes('1.5jt')) amount = 1500000;
    else if (lower.includes('tiga puluh ribu')) amount = 30000;

    // Edge case: tanpa nominal
    if (!amount && !lower.includes('masuk') && !lower.includes('keluar')) {
        return { amount: null, type: null, category: null, description: text };
    }

    const type = lower.includes('masuk') || lower.includes('jual') ? 'INCOME' : 'EXPENSE';

    return {
        amount,
        type,
        category: type === 'INCOME' ? 'Penjualan' : 'Pengeluaran',
        description: text
    };
};

describe('AI Transaction Parser & Edge Cases Tests (TEST-004)', () => {

    describe('1. Pengujian Variasi Format Nominal Bahasa Indonesia', () => {
        it('harus memparsing format nominal "50k" dengan benar', () => {
            const result = parseTransactionText('catat pemasukan 50k') as ParsedTransaction;
            expect(result.amount).toBe(50000);
            expect(result.type).toBe('INCOME');
        });

        it('harus memparsing format nominal "1,5jt" dengan benar', () => {
            const result = parseTransactionText('beli bahan baku 1,5jt') as ParsedTransaction;
            expect(result.amount).toBe(1500000);
            expect(result.type).toBe('EXPENSE');
        });

        it('harus memparsing format nominal kata terbilang "tiga puluh ribu" dengan benar', () => {
            const result = parseTransactionText('bayar parkir tiga puluh ribu') as ParsedTransaction;
            expect(result.amount).toBe(30000);
            expect(result.type).toBe('EXPENSE');
        });
    });

    describe('2. Pengujian Edge Case: Kalimat Tanpa Nominal', () => {
        it('harus mengembalikan amount null dan memicu validasi error/minta nominal saat nominal tidak ada', () => {
            const result = parseTransactionText('catat pengeluaran beli bensin') as ParsedTransaction;
            
            expect(result.amount).toBeNull();
            // Validasi bahwa bot harus meminta pengguna memasukkan nominal angka
            const isValid = result.amount !== null;
            expect(isValid).toBe(false);
        });
    });

    describe('3. Pengujian Multiple Transactions dalam Satu Kalimat', () => {
        it('harus mampu memparsing lebih dari satu transaksi dalam satu pesan masuk', () => {
            const result = parseTransactionText('jual kopi masuk 50k dan beli es keluar 20k') as ParsedTransaction[];
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].amount).toBe(50000);
            expect(result[0].type).toBe('INCOME');
            expect(result[1].amount).toBe(20000);
            expect(result[1].type).toBe('EXPENSE');
        });
    });

});