import { SingleTransactionResult, MultiTransactionItem } from './transactionParser.service';

export type ValidationErrorCode = 
  | 'NON_FINANCIAL' 
  | 'MISSING_AMOUNT' 
  | 'INVALID_AMOUNT' 
  | 'PARSING_FAILED';

export interface ValidationGuardResult {
  isValid: boolean;
  errorCode?: ValidationErrorCode;
  replyMessage: string;
  data?: SingleTransactionResult;
}

export interface MultiValidationGuardResult {
  isValid: boolean;
  errorCode?: ValidationErrorCode;
  replyMessage: string;
  data?: MultiTransactionItem[];
}

export const NON_FINANCIAL_PATTERNS: RegExp[] = [
  /^(halo|hai|hey|hei|hi|hello|pagi|selamat\s+(pagi|siang|sore|malam)|assalamu\s*['`]?alaikum|sampurasun)\b/i,
  /^(apa\s*kabar|gimana\s*kabarnya?|sehat\s*(min|bot|bro|gan)?)\b/i,
  /^(terima\s*kasih|makasih|makasi|matur\s*nuwun|hatur\s*nuhun|thanks|tengkyu|ty)\b/i,
  /^(tes|test|testing|ping|p)\b/i,
  /^(kamu\s*(siapa|bisa\s*apa)|siapa\s*kamu|bisa\s*bantu\s*apa)\b/i,
  /^(oke|ok|sip|siap|mantap|baik|yes|ya|y)\b/i,
];

export const VALIDATION_MESSAGES = {
  NON_FINANCIAL: 
    'Halo! Bot ini khusus digunakan untuk mencatat keuangan dan transaksi UMKM (pemasukan & pengeluaran). ' +
    'Silakan kirimkan catatan transaksi Anda ya, contoh:\n' +
    '• "Beli beras 100k"\n' +
    '• "Jual minyak 150rb"',
  
  MISSING_AMOUNT: 
    'Halo! Maaf, nominal uangnya belum disebutkan. ' +
    'Mohon sertakan nominal atau angka transaksinya ya, contoh:\n' +
    '• "Beli gas 20rb"\n' +
    '• "Jual kue 50rb"',

  INVALID_AMOUNT: 
    'Nominal transaksi harus lebih besar dari Rp0. ' +
    'Mohon sertakan nominal yang valid ya, contoh: "Beli beras 50rb".',

  PARSING_FAILED: 
    'Maaf, pesan Anda belum dapat dipahami sebagai transaksi keuangan. ' +
    'Silakan tuliskan dengan format sederhana, contoh: "Beli bensin 20rb" atau "Jual 2 porsi nasi goreng 30rb".',

  VALID: 'Data transaksi valid dan siap dikonfirmasi.'
};

/**
 * Memeriksa apakah teks pesan hanya percakapan umum / sapaan tanpa konteks transaksi keuangan.
 */
export function isNonFinancialText(text: string): boolean {
  const trimmed = text.trim().toLowerCase();

  // Indikator kata kunci keuangan & transaksi
  const hasFinancialKeyword = /\b(beli|bayar|jual|laku|ongkir|gaji|sewa|tagihan|listrik|air|pulsa|dp|transfer|terima|dapat|keluar|masuk|kredit|debit|modal|untung|rugi|cash|tunai|belanja|pesan)\b/i.test(trimmed);
  // Indikator angka atau singkatan nominal
  const hasNumberOrCurrency = /(\d+|(\d+[,\.]\d+)|(rp|k|rb|jt|ribu|juta))\b/i.test(trimmed);

  // Jika mengandung indikator keuangan, jangan langsung tolak sebagai non-financial
  if (hasFinancialKeyword || hasNumberOrCurrency) {
    return false;
  }

  // Cocokkan dengan pola sapaan / small talk umum
  for (const pattern of NON_FINANCIAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Jika teks pendek tanpa kata kunci keuangan atau angka sama sekali
  if (trimmed.length < 50) {
    return true;
  }

  return false;
}

/**
 * Task AI-007: Validation Guard untuk bot keuangan UMKM (Transaksi Tunggal).
 */
export function validateTransaction(
  userText: string,
  parsed: SingleTransactionResult | null
): ValidationGuardResult {
  // 1. Cek Non-Financial Guard dari teks input pengguna
  if (isNonFinancialText(userText)) {
    return {
      isValid: false,
      errorCode: 'NON_FINANCIAL',
      replyMessage: VALIDATION_MESSAGES.NON_FINANCIAL,
    };
  }

  // Jika hasil parsing AI bernilai null (gagal diparse)
  if (!parsed) {
    return {
      isValid: false,
      errorCode: 'PARSING_FAILED',
      replyMessage: VALIDATION_MESSAGES.PARSING_FAILED,
    };
  }

  // Jika AI mengidentifikasi bahwa teks bukan transaksi keuangan
  if (parsed.isFinancial === false) {
    return {
      isValid: false,
      errorCode: 'NON_FINANCIAL',
      replyMessage: VALIDATION_MESSAGES.NON_FINANCIAL,
    };
  }

  // 2. Cek Kelengkapan Nominal (Amount Guard)
  if (parsed.amount === null || parsed.amount === undefined) {
    return {
      isValid: false,
      errorCode: 'MISSING_AMOUNT',
      replyMessage: VALIDATION_MESSAGES.MISSING_AMOUNT,
      data: parsed,
    };
  }

  if (parsed.amount <= 0 || isNaN(parsed.amount)) {
    return {
      isValid: false,
      errorCode: 'INVALID_AMOUNT',
      replyMessage: VALIDATION_MESSAGES.INVALID_AMOUNT,
      data: parsed,
    };
  }

  return {
    isValid: true,
    replyMessage: VALIDATION_MESSAGES.VALID,
    data: parsed,
  };
}

/**
 * Task AI-013: Validation Guard untuk daftar multi-transaksi.
 */
export function validateMultiTransactions(
  userText: string,
  items: MultiTransactionItem[] | null
): MultiValidationGuardResult {
  // 1. Cek Non-Financial Guard
  if (isNonFinancialText(userText)) {
    return {
      isValid: false,
      errorCode: 'NON_FINANCIAL',
      replyMessage: VALIDATION_MESSAGES.NON_FINANCIAL,
    };
  }

  // Jika items null atau kosong
  if (!items || items.length === 0) {
    return {
      isValid: false,
      errorCode: 'PARSING_FAILED',
      replyMessage: VALIDATION_MESSAGES.PARSING_FAILED,
    };
  }

  // 2. Periksa kelengkapan nominal tiap item
  for (const [index, item] of items.entries()) {
    if (item.amount === null || item.amount === undefined) {
      return {
        isValid: false,
        errorCode: 'MISSING_AMOUNT',
        replyMessage: 
          `Halo! Transaksi "${item.description || `Item ke-${index + 1}`}" belum memiliki nominal uang. ` +
          `Mohon sebutkan nominal untuk setiap transaksi ya, contoh: "Jual beras 100rb, minyak 50rb".`,
      };
    }

    if (item.amount <= 0 || isNaN(item.amount)) {
      return {
        isValid: false,
        errorCode: 'INVALID_AMOUNT',
        replyMessage: `Nominal untuk "${item.description}" harus lebih dari Rp0. Mohon sertakan nominal yang valid ya.`,
      };
    }
  }

  // Validasi Berhasil
  return {
    isValid: true,
    replyMessage: VALIDATION_MESSAGES.VALID,
    data: items,
  };
}
