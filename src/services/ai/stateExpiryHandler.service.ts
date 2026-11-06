import { conversationStateRepository } from '../../repositories/conversationState.repository';
import { ConversationStateName } from '../conversationState.service';

export interface ExpiryCheckResult {
  wasExpired: boolean;
  expiredState: string | null;
  notificationMessage?: string;
}

export const EXPIRED_CONFIRMATION_MESSAGE = 
  '⚠️ *Sesi Konfirmasi Kadaluarsa*\n\n' +
  'Sesi konfirmasi transaksi sebelumnya telah hangus karena melebihi batas waktu (10 menit). ' +
  'Draf transaksi sebelumnya telah dibatalkan otomatis.\n\n' +
  'Silakan kirimkan ulang pesan transaksi yang ingin Anda catat ya!';

export class StateExpiryHandlerService {
  /**
   * Task AI-011: Memeriksa apakah pengguna memiliki state WAITING_CONFIRMATION yang telah kadaluarsa.
   * 
   * Aturan:
   * 1. Pengecekan Kadaluarsa: Bandingkan now dengan expiresAt pada tabel ConversationState.
   * 2. Pembersihan State Gantung: Hapus state kadaluarsa dari database (reset ke IDLE).
   * 3. Notifikasi: Kembalikan status wasExpired = true dan pesan notifikasi ramah untuk pengguna.
   */
  async checkAndCleanupExpiredState(
    userId: string,
    now: Date = new Date()
  ): Promise<ExpiryCheckResult> {
    const rawState = await conversationStateRepository.findByUserId(userId);
    if (!rawState) {
      return { wasExpired: false, expiredState: null };
    }

    const isExpired = rawState.expiresAt 
      ? now.getTime() > new Date(rawState.expiresAt).getTime()
      : false;

    if (isExpired) {
      console.log(
        `[StateExpiryHandler] State '${rawState.state}' user ${userId} telah kadaluarsa (${rawState.expiresAt?.toISOString()}). Menghapus state gantung...`
      );

      // Rule 2: Bersihkan state gantung dari database
      await conversationStateRepository.deleteByUserId(userId);

      if (rawState.state === ConversationStateName.WAITING_CONFIRMATION) {
        return {
          wasExpired: true,
          expiredState: rawState.state,
          notificationMessage: EXPIRED_CONFIRMATION_MESSAGE,
        };
      }

      return {
        wasExpired: true,
        expiredState: rawState.state,
      };
    }

    return {
      wasExpired: false,
      expiredState: null,
    };
  }
}

export const stateExpiryHandlerService = new StateExpiryHandlerService();

