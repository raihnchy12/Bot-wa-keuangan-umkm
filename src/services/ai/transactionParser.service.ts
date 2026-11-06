import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import config from '../../config/env'; // Mengambil konfigurasi env yang sudah disesuaikan
import { 
  TRANSACTION_EXTRACTION_SYSTEM_PROMPT, 
  buildTransactionExtractionPrompt,
  buildMultiTransactionExtractionPrompt 
} from '../../prompts/transactionExtraction.prompt';

// Inisialisasi Google Gen AI menggunakan GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// Daftar kategori standar sesuai PRD
export const STANDARD_CATEGORIES = [
  'Penjualan',
  'Operasional',
  'Bahan Baku',
  'Gaji',
  'Transportasi',
  'Lain-lain'
] as const;

export const singleTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().nullable(),
  category: z.enum(STANDARD_CATEGORIES),
  description: z.string(),
  transactionDate: z.string(),
  isFinancial: z.boolean().default(true),
});

export type SingleTransactionResult = z.infer<typeof singleTransactionSchema>;

// Task AI-012: Skema Multi-Transaksi (Array of Transactions)
export const multiTransactionItemSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().nullable(),
  category: z.enum(STANDARD_CATEGORIES),
  description: z.string(),
  transactionDate: z.string(),
});

export const multiTransactionListSchema = z.array(multiTransactionItemSchema);

export type MultiTransactionItem = z.infer<typeof multiTransactionItemSchema>;

/**
 * Format helper untuk mendapatkan tanggal lokal ISO (YYYY-MM-DD)
 */
export function getLocalTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Task AI-004 s.d. AI-006: Ekstraksi transaksi tunggal
 */
export async function parseSingleTransaction(
  userText: string,
  referenceDate?: string
): Promise<SingleTransactionResult | null> {
  try {
    const todayIso = referenceDate || getLocalTodayIso();

    const fullSystemPrompt = 
      `${buildTransactionExtractionPrompt(todayIso)}\n\n` +
      `Kembalikan output HANYA dalam format JSON murni yang valid sesuai skema.`;

    const response = await ai.models.generateContent({
      model: config.geminiModel || 'gemini-2.0-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${fullSystemPrompt}\n\nInput Pengguna: "${userText}"` }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const content = response.text;
    if (!content) return null;

    const rawData = JSON.parse(content);
    const validatedData = singleTransactionSchema.parse(rawData);

    return validatedData;
  } catch (error) {
    console.error('❌ Error parsing single transaction with Gemini SDK:', error);
    return null;
  }
}

/**
 * Task AI-012: Ekstraksi banyak transaksi sekaligus (Multi-Transaction) dari satu pesan teks panjang.
 * Menghasilkan array objek transaksi yang terstruktur.
 */
export async function parseMultiTransactions(
  userText: string,
  referenceDate?: string
): Promise<MultiTransactionItem[] | null> {
  try {
    const todayIso = referenceDate || getLocalTodayIso();

    const fullSystemPrompt = 
      `${buildMultiTransactionExtractionPrompt(todayIso)}\n\n` +
      `Kembalikan output HANYA dalam format JSON Array murni yang valid sesuai skema.`;

    const response = await ai.models.generateContent({
      model: config.geminiModel || 'gemini-2.0-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${fullSystemPrompt}\n\nInput Pengguna: "${userText}"` }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const content = response.text;
    if (!content) return null;

    const rawData = JSON.parse(content);

    // Normalisasi jika model mengembalikan objek wrapper { transactions: [...] } atau array langsung [...]
    const arrayData = Array.isArray(rawData)
      ? rawData
      : Array.isArray((rawData as any).transactions)
        ? (rawData as any).transactions
        : [rawData];

    const validatedData = multiTransactionListSchema.parse(arrayData);

    return validatedData;
  } catch (error) {
    console.error('❌ Error parsing multi transactions with Gemini SDK:', error);
    return null;
  }
}
