import { transactionService } from '../transaction.service';
import { businessService } from '../business.service';
import { 
  pendingTransactionManager, 
  PendingTransactionPayload 
} from './pendingTransaction.service';
import { AppError } from '../../utils/appError';

export type ConfirmationDecision = 'CONFIRM' | 'CANCEL' | 'UNKNOWN';

export interface ConfirmationHandleResult {
  decision: ConfirmationDecision;
  success: boolean;
  replyMessage: string;
  transaction?: any;
  transactions?: any[];
  totalSaved?: number;
}

export const CONFIRM_POSITIVE_PATTERNS = [
  /^(ya|y|yes|benar|betul|oke|ok|okei|lanjut|simpan|save|deal|siap|iy|iya|bener|udah|confirm_yes)$/i,
  /\b(simpan|sudah\s*benar|udah\s*bener|ya\s*simpan|ya\s*benar|ya\s*betul|ya\s*lanjut|iya\s*benar|simpan\s*semua)\b/i,
];

export const CONFIRM_NEGATIVE_PATTERNS = [
  /^(tidak|t|no|batal|cancel|gak\s*jadi|ga\s*jadi|enggak|nggak|batalin|hapus|salah|confirm_cancel|confirm_no)$/i,
  /\b(batal|batalkan|gak\s*jadi|ga\s*jadi|bukan|salah)\b/i,
];

export function parseConfirmationIntent(text: string): ConfirmationDecision {
  const trimmed = text.trim().toLowerCase();

  for (const pattern of CONFIRM_POSITIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return 'CONFIRM';
    }
  }

  for (const pattern of CONFIRM_NEGATIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return 'CANCEL';
    }
  }

  return 'UNKNOWN';
}

/**
 * Task AI-013: Memformat pesan ringkasan konfirmasi banyak transaksi (Batch)
 */
export function formatBatchConfirmationPrompt(transactions: PendingTransactionPayload[]): string {
  const lines: string[] = [];
  lines.push(`📊 *Ditemukan ${transactions.length} transaksi:*`);

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx, index) => {
    const typeTag = tx.type === 'INCOME' ? '[PEMASUKAN]' : '[PENGELUARAN]';
    const amountStr = `Rp ${Number(tx.amount).toLocaleString('id-ID')}`;
    lines.push(`${index + 1}. ${typeTag} ${tx.description} - ${amountStr} (${tx.category})`);

    if (tx.type === 'INCOME') {
      totalIncome += Number(tx.amount);
    } else {
      totalExpense += Number(tx.amount);
    }
  });

  lines.push('');
  lines.push(`Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`);
  lines.push(`Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`);
  lines.push('');
  lines.push(`Apakah data di atas sudah benar? (Ketik 'YA' untuk menyimpan semua atau 'BATAL' untuk membatalkan)`);

  return lines.join('\n');
}

export class ConfirmationHandlerService {
  /**
   * Task AI-009, AI-010, & AI-013:
   * Memproses respon balasan pengguna saat state WAITING_CONFIRMATION (baik tunggal maupun batch multi-transaksi).
   */
  async handleConfirmationResponse(
    userId: string,
    userText: string,
    draftPayload?: any
  ): Promise<ConfirmationHandleResult> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new AppError('userId wajib diisi', 400);
    }

    // 1. Ambil draf transaksi dari parameter atau langsung dari database ConversationState
    let activePayload = draftPayload;
    let transactionList: PendingTransactionPayload[] = [];

    if (!activePayload) {
      const pending = await pendingTransactionManager.getPendingTransaction(userId);
      if (!pending) {
        return {
          decision: 'UNKNOWN',
          success: false,
          replyMessage: 'Tidak ada transaksi yang sedang menunggu konfirmasi saat ini. Silakan tuliskan transaksi baru ya.',
        };
      }
      activePayload = pending.draft;
      transactionList = pending.transactions;
    } else {
      // Normalisasi daftar transaksi dari payload
      if (Array.isArray(activePayload)) {
        transactionList = activePayload;
      } else if (activePayload.transactions && Array.isArray(activePayload.transactions)) {
        transactionList = activePayload.transactions;
      } else {
        transactionList = [activePayload];
      }
    }

    const isBatch = transactionList.length > 1;
    const decision = parseConfirmationIntent(userText);

    // ========================================================
    // Skenario 1: Konfirmasi Positif ("YA", "BENAR", "SIMPAN")
    // ========================================================
    if (decision === 'CONFIRM') {
      // Ambil businessId milik pengguna untuk isolasi data multi-tenant
      const business = await businessService.getBusinessByUserId(userId);

      // AI-013: Eksekusi Atomik Batch Persistence
      if (isBatch) {
        const createDTOs = transactionList.map((tx) => ({
          businessId: business.id,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: tx.description,
          transactionDate: new Date(tx.transactionDate),
        }));

        const savedBatch = await transactionService.createManyTransactions(createDTOs);

        // Bersihkan state percakapan kembali ke IDLE
        await pendingTransactionManager.clearPendingTransaction(userId);

        let totalIncome = 0;
        let totalExpense = 0;
        transactionList.forEach((tx) => {
          if (tx.type === 'INCOME') totalIncome += Number(tx.amount);
          else totalExpense += Number(tx.amount);
        });

        const replyMessage = 
          `✅ *Berhasil Menyimpan ${savedBatch.length} Transaksi!*\n\n` +
          `📊 *Rincian Tercatat:*\n` +
          transactionList
            .map((tx, idx) => `${idx + 1}. [${tx.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN'}] ${tx.description} - Rp ${Number(tx.amount).toLocaleString('id-ID')} (${tx.category})`)
            .join('\n') +
          `\n\n• Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}` +
          `\n• Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}` +
          `\n\nTerima kasih! Semua transaksi telah dicatat secara aman ke database.\n` +
          `Ketik transaksi baru kapan saja untuk mencatat lagi ya.`;

        return {
          decision: 'CONFIRM',
          success: true,
          replyMessage,
          transactions: savedBatch,
          totalSaved: savedBatch.length,
        };
      } 
      // Transaksi Tunggal (AI-010)
      else {
        const singleTx = transactionList[0];
        const createdTransaction = await transactionService.createTransaction({
          businessId: business.id,
          type: singleTx.type,
          amount: singleTx.amount,
          category: singleTx.category,
          description: singleTx.description,
          transactionDate: new Date(singleTx.transactionDate),
        });

        // Bersihkan state percakapan kembali ke IDLE
        await pendingTransactionManager.clearPendingTransaction(userId);

        const typeLabel = singleTx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
        const formattedAmount = `Rp ${Number(singleTx.amount).toLocaleString('id-ID')}`;

        const replyMessage = 
          `✅ *Transaksi Berhasil Disimpan!*\n\n` +
          `• Tipe: ${typeLabel}\n` +
          `• Kategori: ${singleTx.category}\n` +
          `• Deskripsi: ${singleTx.description}\n` +
          `• Nominal: ${formattedAmount}\n` +
          `• Tanggal: ${singleTx.transactionDate}\n\n` +
          `Ketik transaksi baru kapan saja untuk mencatat lagi ya.`;

        return {
          decision: 'CONFIRM',
          success: true,
          replyMessage,
          transaction: createdTransaction,
          totalSaved: 1,
        };
      }
    }

    // ========================================================
    // Skenario 2: Pembatalan ("TIDAK", "BATAL")
    // ========================================================
    if (decision === 'CANCEL') {
      // Bersihkan state percakapan kembali ke IDLE
      await pendingTransactionManager.clearPendingTransaction(userId);

      const cancelText = isBatch
        ? `❌ *Pencatatan ${transactionList.length} Transaksi Dibatalkan.*\n\nSeluruh draf transaksi telah dibatalkan dan dihapus. Silakan ketik transaksi baru jika ingin mencatat kembali.`
        : `❌ *Pencatatan Transaksi Dibatalkan.*\n\nDraf transaksi telah dibatalkan dan dihapus. Silakan ketik transaksi baru jika ingin mencatat kembali.`;

      return {
        decision: 'CANCEL',
        success: true,
        replyMessage: cancelText,
      };
    }

    // ========================================================
    // Skenario 3: Pesan tidak relevan saat WAITING_CONFIRMATION
    // ========================================================
    if (isBatch) {
      const summaryReminder = transactionList
        .map((tx, idx) => `${idx + 1}. [${tx.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN'}] ${tx.description} - Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
        .join('\n');

      const replyMessage = 
        `⚠️ *Konfirmasi Transaksi Diperlukan*\n\n` +
        `Anda memiliki ${transactionList.length} draf transaksi yang belum dikonfirmasi:\n` +
        `${summaryReminder}\n\n` +
        `Mohon konfirmasi terlebih dahulu ya:\n` +
        `👉 Ketik *YA* untuk menyimpan semua transaksi\n` +
        `👉 Ketik *BATAL* untuk membatalkannya`;

      return {
        decision: 'UNKNOWN',
        success: false,
        replyMessage,
      };
    }

    const singleTx = transactionList[0];
    const formattedAmount = `Rp ${Number(singleTx?.amount || 0).toLocaleString('id-ID')}`;
    const replyMessage = 
      `⚠️ *Konfirmasi Transaksi Diperlukan*\n\n` +
      `Anda memiliki draf transaksi yang belum dikonfirmasi:\n` +
      `• *${singleTx?.description}* (${formattedAmount})\n` +
      `• Tanggal: ${singleTx?.transactionDate}\n\n` +
      `Mohon konfirmasi terlebih dahulu ya:\n` +
      `👉 Ketik *YA* untuk menyimpan transaksi\n` +
      `👉 Ketik *BATAL* untuk membatalkannya`;

    return {
      decision: 'UNKNOWN',
      success: false,
      replyMessage,
    };
  }
}

export const confirmationHandlerService = new ConfirmationHandlerService();
