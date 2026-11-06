import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

export interface UpsertConversationStateInput {
  userId: string;
  state: string;
  /** Objek JSON arbitrer. null/undefined berarti payload dikosongkan. */
  payload?: Prisma.InputJsonValue | null;
  expiresAt?: Date | null;
}

export class ConversationStateRepository {
  async findByUserId(userId: string) {
    return prisma.conversationState.findUnique({
      where: { userId },
    });
  }

  /**
   * Buat state baru, atau timpa state lama milik user yang sama.
   * `userId` bersifat unique, jadi tiap user hanya punya 1 state aktif.
   * Payload & expiresAt SELALU ditimpa agar sisa data state sebelumnya tidak terbawa.
   */
  async upsert(data: UpsertConversationStateInput) {
    const payload = data.payload ?? Prisma.JsonNull;
    const expiresAt = data.expiresAt ?? null;

    return prisma.conversationState.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        state: data.state,
        payload,
        expiresAt,
      },
      update: {
        state: data.state,
        payload,
        expiresAt,
      },
    });
  }

  /**
   * Hapus state milik user. Memakai deleteMany agar tidak error
   * bila state memang tidak ada. Mengembalikan jumlah baris yang terhapus.
   */
  async deleteByUserId(userId: string) {
    return prisma.conversationState.deleteMany({
      where: { userId },
    });
  }

  /**
   * Hapus seluruh state yang sudah kadaluarsa (expiresAt < now).
   * Berguna untuk background job / cleanup berkala.
   */
  async deleteExpired(now: Date = new Date()) {
    return prisma.conversationState.deleteMany({
      where: {
        expiresAt: {
          lt: now,
          not: null,
        },
      },
    });
  }
}

export const conversationStateRepository = new ConversationStateRepository();