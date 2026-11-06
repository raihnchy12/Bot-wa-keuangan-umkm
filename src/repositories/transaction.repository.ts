import { prisma } from '../config/db';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface TransactionFilter {
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  category?: string;
}

export interface CreateTransactionInput {
  businessId: string;
  type: TransactionType;
  amount: Decimal | number | string;
  category: string;
  description?: string;
  transactionDate: Date;
}

export class TransactionRepository {
  async create(data: CreateTransactionInput) {
    // Convert amount to Decimal
    const amount = new Decimal(data.amount);

    return prisma.transaction.create({
      data: {
        businessId: data.businessId,
        type: data.type,
        amount,
        category: data.category,
        description: data.description,
        transactionDate: data.transactionDate,
      },
    });
  }

  async findByBusinessId(businessId: string, filter?: TransactionFilter) {
    const whereClause: any = { businessId };

    // Apply type filter
    if (filter?.type) {
      whereClause.type = filter.type;
    }

    // Apply date range filter
    if (filter?.startDate || filter?.endDate) {
      whereClause.transactionDate = {};
      if (filter.startDate) {
        whereClause.transactionDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.transactionDate.lte = filter.endDate;
      }
    }

    // Apply category filter
    if (filter?.category) {
      whereClause.category = filter.category;
    }

    return prisma.transaction.findMany({
      where: whereClause,
      orderBy: { transactionDate: 'desc' },
    });
  }

  async findById(id: string, businessId: string) {
    // Multi-tenant isolation: always include businessId in query
    return prisma.transaction.findFirst({
      where: { id, businessId },
    });
  }

  async update(
    id: string,
    businessId: string,
    data: Partial<CreateTransactionInput>
  ) {
    // Multi-tenant isolation: verify ownership before update
    const amount = data.amount ? new Decimal(data.amount) : undefined;

    return prisma.transaction.updateMany({
      where: { id, businessId },
      data: {
        type: data.type,
        amount,
        category: data.category,
        description: data.description,
        transactionDate: data.transactionDate,
      },
    });
  }

  async delete(id: string, businessId: string) {
    // Multi-tenant isolation: verify ownership before delete
    return prisma.transaction.deleteMany({
      where: { id, businessId },
    });
  }
}

export const transactionRepository = new TransactionRepository();
