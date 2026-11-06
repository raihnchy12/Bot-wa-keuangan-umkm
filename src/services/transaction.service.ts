import { AppError } from '../utils/appError';
import { prisma } from '../config/db';
import {
  transactionRepository,
  CreateTransactionInput,
  TransactionFilter,
} from '../repositories/transaction.repository';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateTransactionDTO {
  businessId: string;
  type: TransactionType;
  amount: number | string | Decimal;
  category: string;
  description?: string;
  transactionDate: Date;
}

export class TransactionService {
  async createTransaction(data: CreateTransactionDTO) {
    // Validate business transaction type
    if (!Object.values(TransactionType).includes(data.type)) {
      throw new AppError(
        `Tipe transaksi harus INCOME atau EXPENSE, diterima: ${data.type}`,
        400
      );
    }

    // Validate and convert amount to Decimal
    let amount: Decimal;
    try {
      amount = new Decimal(data.amount);
    } catch (error) {
      throw new AppError(`Nominal transaksi tidak valid: ${data.amount}`, 400);
    }

    // Validate amount > 0
    if (amount.lessThanOrEqualTo(0)) {
      throw new AppError('Nominal transaksi harus lebih dari 0', 400);
    }

    // Create transaction
    const transaction = await transactionRepository.create({
      businessId: data.businessId,
      type: data.type,
      amount,
      category: data.category,
      description: data.description,
      transactionDate: data.transactionDate,
    });

    return transaction;
  }

  /**
   * Task AI-013: Menyimpan banyak transaksi sekaligus secara atomik menggunakan prisma.$transaction().
   * Jika ada salah satu item yang gagal disimpan, seluruh operasi di-rollback secara otomatis.
   */
  async createManyTransactions(items: CreateTransactionDTO[]) {
    if (!items || items.length === 0) {
      throw new AppError('Daftar transaksi tidak boleh kosong', 400);
    }

    // Validasi semua item terlebih dahulu sebelum transaksi database dimulai
    const validatedData = items.map((data, index) => {
      if (!Object.values(TransactionType).includes(data.type)) {
        throw new AppError(
          `Item ke-${index + 1}: Tipe transaksi harus INCOME atau EXPENSE, diterima: ${data.type}`,
          400
        );
      }

      let amount: Decimal;
      try {
        amount = new Decimal(data.amount);
      } catch (error) {
        throw new AppError(
          `Item ke-${index + 1}: Nominal transaksi tidak valid: ${data.amount}`,
          400
        );
      }

      if (amount.lessThanOrEqualTo(0)) {
        throw new AppError(
          `Item ke-${index + 1}: Nominal transaksi harus lebih dari 0`,
          400
        );
      }

      return {
        businessId: data.businessId,
        type: data.type,
        amount,
        category: data.category,
        description: data.description,
        transactionDate: data.transactionDate,
      };
    });

    // Eksekusi atomik batch persistence via prisma.$transaction
    return prisma.$transaction(async (tx) => {
      const createdList = [];
      for (const item of validatedData) {
        const created = await tx.transaction.create({
          data: item,
        });
        createdList.push(created);
      }
      return createdList;
    });
  }

  async getTransactionsByBusinessId(
    businessId: string,
    filter?: TransactionFilter
  ) {
    const transactions = await transactionRepository.findByBusinessId(
      businessId,
      filter
    );

    return transactions;
  }

  async getTransactionById(id: string, businessId: string) {
    const transaction = await transactionRepository.findById(id, businessId);

    if (!transaction) {
      throw new AppError(
        `Transaksi dengan ID ${id} tidak ditemukan atau tidak milik bisnis ini`,
        404
      );
    }

    return transaction;
  }

  async updateTransaction(
    id: string,
    businessId: string,
    data: Partial<CreateTransactionDTO>
  ) {
    // Verify transaction exists and belongs to this business
    const existingTransaction = await transactionRepository.findById(id, businessId);

    if (!existingTransaction) {
      throw new AppError(
        `Transaksi dengan ID ${id} tidak ditemukan atau tidak milik bisnis ini`,
        404
      );
    }

    // Validate type if provided
    if (data.type && !Object.values(TransactionType).includes(data.type)) {
      throw new AppError(
        `Tipe transaksi harus INCOME atau EXPENSE, diterima: ${data.type}`,
        400
      );
    }

    // Validate amount if provided
    if (data.amount !== undefined) {
      let amount: Decimal;
      try {
        amount = new Decimal(data.amount);
      } catch (error) {
        throw new AppError(`Nominal transaksi tidak valid: ${data.amount}`, 400);
      }

      if (amount.lessThanOrEqualTo(0)) {
        throw new AppError('Nominal transaksi harus lebih dari 0', 400);
      }
    }

    // Update transaction
    const result = await transactionRepository.update(id, businessId, {
      businessId,
      type: data.type || existingTransaction.type,
      amount: data.amount || existingTransaction.amount,
      category: data.category || existingTransaction.category,
      description: data.description,
      transactionDate: data.transactionDate || existingTransaction.transactionDate,
    });

    return result;
  }

  async deleteTransaction(id: string, businessId: string) {
    // Verify transaction exists and belongs to this business
    const existingTransaction = await transactionRepository.findById(id, businessId);

    if (!existingTransaction) {
      throw new AppError(
        `Transaksi dengan ID ${id} tidak ditemukan atau tidak milik bisnis ini`,
        404
      );
    }

    // Delete transaction
    return transactionRepository.delete(id, businessId);
  }
}

export const transactionService = new TransactionService();
