import { 
  conversationStateService, 
  ConversationStateName 
} from '../conversationState.service';
import { AppError } from '../../utils/appError';

export interface PendingTransactionPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
}

export interface BatchPendingTransactionPayload {
  isBatch: boolean;
  transactions: PendingTransactionPayload[];
}

export type AnyPendingDraft = PendingTransactionPayload | PendingTransactionPayload[] | BatchPendingTransactionPayload;

export const DEFAULT_PENDING_TX_TTL_SECONDS = 600; // 10 menit

export class PendingTransactionManager {
  /**
   * Task AI-008 & AI-013: Menyimpan draf transaksi (tunggal atau batch) ke ConversationState.
   */
  async savePendingTransaction(
    userId: string,
    draft: AnyPendingDraft,
    ttlSeconds: number = DEFAULT_PENDING_TX_TTL_SECONDS
  ) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new AppError('userId wajib diisi', 400);
    }

    if (!draft) {
      throw new AppError('Data transaksi draf wajib diisi', 400);
    }

    // Jika array of transactions (Batch Multi-Transaction AI-013)
    if (Array.isArray(draft)) {
      return this.saveBatchPendingTransactions(userId, draft, ttlSeconds);
    }

    if ((draft as any).isBatch && Array.isArray((draft as any).transactions)) {
      return this.saveBatchPendingTransactions(userId, (draft as any).transactions, ttlSeconds);
    }

    // Transaksi Tunggal
    const singleDraft = draft as PendingTransactionPayload;
    if (!['INCOME', 'EXPENSE'].includes(singleDraft.type)) {
      throw new AppError('Tipe transaksi harus INCOME atau EXPENSE', 400);
    }

    if (typeof singleDraft.amount !== 'number' || singleDraft.amount <= 0) {
      throw new AppError('Nominal transaksi harus berupa angka positif lebih dari 0', 400);
    }

    if (!singleDraft.category || !singleDraft.description || !singleDraft.transactionDate) {
      throw new AppError('Data transaksi draf tidak lengkap (kategori, deskripsi, tanggal wajib ada)', 400);
    }

    const payloadJson = {
      type: singleDraft.type,
      amount: singleDraft.amount,
      category: singleDraft.category,
      description: singleDraft.description,
      transactionDate: singleDraft.transactionDate,
    };

    return conversationStateService.setState(
      userId,
      ConversationStateName.WAITING_CONFIRMATION,
      payloadJson,
      ttlSeconds
    );
  }

  /**
   * Task AI-013: Menyimpan batch draf transaksi ke ConversationState.
   */
  async saveBatchPendingTransactions(
    userId: string,
    transactions: PendingTransactionPayload[],
    ttlSeconds: number = DEFAULT_PENDING_TX_TTL_SECONDS
  ) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new AppError('Daftar transaksi tidak boleh kosong', 400);
    }

    for (const [index, item] of transactions.entries()) {
      if (!['INCOME', 'EXPENSE'].includes(item.type)) {
        throw new AppError(`Item ${index + 1}: Tipe transaksi harus INCOME atau EXPENSE`, 400);
      }
      if (typeof item.amount !== 'number' || item.amount <= 0) {
        throw new AppError(`Item ${index + 1}: Nominal harus berupa angka positif lebih dari 0`, 400);
      }
      if (!item.category || !item.description || !item.transactionDate) {
        throw new AppError(`Item ${index + 1}: Data transaksi tidak lengkap`, 400);
      }
    }

    const payloadJson = {
      isBatch: true,
      transactions: transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        transactionDate: t.transactionDate,
      })),
    };

    return conversationStateService.setState(
      userId,
      ConversationStateName.WAITING_CONFIRMATION,
      payloadJson,
      ttlSeconds
    );
  }

  /**
   * Mengambil draf transaksi pending milik pengguna jika status aktif adalah WAITING_CONFIRMATION.
   * Mendukung baik transaksi tunggal maupun batch multi-transaksi.
   */
  async getPendingTransaction(userId: string, now: Date = new Date()) {
    const currentState = await conversationStateService.getState(userId, now);
    if (!currentState || currentState.state !== ConversationStateName.WAITING_CONFIRMATION) {
      return null;
    }

    const rawPayload = currentState.payload as any;
    const isBatch = Boolean(rawPayload?.isBatch || Array.isArray(rawPayload?.transactions));
    const transactions: PendingTransactionPayload[] = isBatch
      ? (rawPayload.transactions as PendingTransactionPayload[])
      : Array.isArray(rawPayload)
        ? (rawPayload as PendingTransactionPayload[])
        : [rawPayload as PendingTransactionPayload];

    return {
      state: currentState.state,
      expiresAt: currentState.expiresAt,
      isBatch,
      transactions,
      draft: rawPayload,
    };
  }

  /**
   * Menghapus draf transaksi pending dan mengembalikan state pengguna ke IDLE.
   */
  async clearPendingTransaction(userId: string) {
    return conversationStateService.clearState(userId);
  }
}

export const pendingTransactionManager = new PendingTransactionManager();
