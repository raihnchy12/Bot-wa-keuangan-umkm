import { Prisma } from '@prisma/client';
import { AppError } from '../utils/appError';
import { conversationStateRepository } from '../repositories/conversationState.repository';

/**
 * Nama state percakapan yang sudah dikenal (PRD bagian 26).
 * Kolom `state` di database tetap String bebas, konstanta ini hanya
 * untuk menghindari salah ketik di service lain.
 */
export const ConversationStateName = {
  IDLE: 'IDLE',
  WAITING_AMOUNT: 'WAITING_AMOUNT',
  WAITING_CONFIRMATION: 'WAITING_CONFIRMATION',
} as const;

export class ConversationStateService {
  /**
   * Mengecek apakah batas waktu kadaluarsa (expiresAt) sudah terlewati
   * relatif terhadap waktu acuan (now).
   */
  isExpired(expiresAt: Date | null | undefined, now: Date = new Date()): boolean {
    if (!expiresAt) {
      return false;
    }
    return now.getTime() > new Date(expiresAt).getTime();
  }

  /**
   * Ambil state percakapan aktif milik user.
   * Mengembalikan null jika user belum punya state atau state sudah kadaluarsa (artinya IDLE).
   *
   * Logika Kadaluarsa (WA-012):
   * Jika state memiliki `expiresAt` dan waktu acuan `now > expiresAt`:
   * - Hapus/reset state di database secara otomatis
   * - Kembalikan null (state kosong / IDLE)
   *
   * @param userId ID pengguna pemilik state
   * @param now Waktu acuan pengecekan (default: new Date())
   */
  async getState(userId: string, now: Date = new Date()) {
    this.assertUserId(userId);
    const state = await conversationStateRepository.findByUserId(userId);

    if (!state) {
      return null;
    }

    if (this.isExpired(state.expiresAt, now)) {
      console.log(
        `[ConversationState] State '${state.state}' user ${userId} telah kadaluarsa (${state.expiresAt?.toISOString()}). Menghapus state...`
      );
      await this.clearState(userId);
      return null;
    }

    return state;
  }

  /**
   * Alias untuk `getState` untuk kenyamanan pemanggilan service.
   */
  async getUserState(userId: string, now: Date = new Date()) {
    return this.getState(userId, now);
  }

  /**
   * Ambil representasi state efektif pengguna.
   * Jika pengguna tidak memiliki state aktif atau sudah kadaluarsa,
   * kembalikan objek state default IDLE.
   */
  async getEffectiveState(userId: string, now: Date = new Date()) {
    const active = await this.getState(userId, now);
    if (!active) {
      return {
        userId,
        state: ConversationStateName.IDLE,
        payload: null,
        expiresAt: null,
      };
    }
    return active;
  }

  /**
   * Bersihkan seluruh state kadaluarsa secara massal dari database.
   */
  async cleanExpiredStates(now: Date = new Date()): Promise<number> {
    const result = await conversationStateRepository.deleteExpired(now);
    return result.count;
  }

  /**
   * Simpan (buat atau perbarui) state percakapan user.
   * @param userId ID user pemilik state
   * @param state Nama state, contoh: WAITING_CONFIRMATION
   * @param payload Data JSON arbitrer (contoh: draf transaksi). Opsional.
   * @param ttlSeconds Masa berlaku state dalam detik. Jika kosong, state tidak kadaluarsa.
   */
  async setState(
    userId: string,
    state: string,
    payload?: Prisma.InputJsonValue | null,
    ttlSeconds?: number
  ) {
    this.assertUserId(userId);

    const cleanState = typeof state === 'string' ? state.trim() : '';
    if (!cleanState) {
      throw new AppError('State percakapan tidak boleh kosong', 400);
    }

    let expiresAt: Date | null = null;
    if (ttlSeconds !== undefined && ttlSeconds !== null) {
      if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
        throw new AppError('TTL harus berupa angka detik yang lebih dari 0', 400);
      }
      expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    }

    try {
      return await conversationStateRepository.upsert({
        userId,
        state: cleanState,
        payload,
        expiresAt,
      });
    } catch (error) {
      // Foreign key violation: userId tidak ada di tabel User
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new AppError(`User dengan ID ${userId} tidak ditemukan`, 404);
      }
      throw error;
    }
  }

  /**
   * AI-008: Menyimpan draf transaksi ke ConversationState dengan status WAITING_CONFIRMATION
   * dan batas waktu kadaluarsa (TTL).
   */
  async savePendingTransaction(
    userId: string,
    transactionDraft: Prisma.InputJsonValue,
    ttlSeconds: number = 600
  ) {
    return this.setState(
      userId,
      ConversationStateName.WAITING_CONFIRMATION,
      transactionDraft,
      ttlSeconds
    );
  }

  /**
   * AI-008: Mengambil draf transaksi pending pengguna jika state saat ini adalah WAITING_CONFIRMATION.
   */
  async getPendingTransaction(userId: string, now: Date = new Date()) {
    const currentState = await this.getState(userId, now);
    if (!currentState || currentState.state !== ConversationStateName.WAITING_CONFIRMATION) {
      return null;
    }
    return currentState;
  }

  /**
   * Hapus state percakapan user (kembali ke IDLE).
   * @returns true jika ada state yang dihapus, false jika memang tidak ada
   */
  async clearState(userId: string): Promise<boolean> {
    this.assertUserId(userId);
    const result = await conversationStateRepository.deleteByUserId(userId);
    return result.count > 0;
  }

  private assertUserId(userId: string) {
    if (typeof userId !== 'string' || userId.trim() === '') {
      throw new AppError('userId tidak boleh kosong', 400);
    }
  }
}

export const conversationStateService = new ConversationStateService();
