import { prisma } from '../config/db';

export interface CreateBusinessInput {
  userId: string;
  name: string;
}

export class BusinessRepository {
  async create(data: CreateBusinessInput) {
    return prisma.business.create({
      data,
    });
  }

  async findByUserId(userId: string) {
    return prisma.business.findFirst({
      where: { userId },
    });
  }

  async findById(id: string, userId: string) {
    // Multi-tenant isolation: always include userId in query
    return prisma.business.findFirst({
      where: { id, userId },
    });
  }

  async findByIdWithTransactions(id: string, userId: string) {
    // Multi-tenant isolation: always include userId in query
    return prisma.business.findFirst({
      where: { id, userId },
      include: { transactions: true },
    });
  }
}

export const businessRepository = new BusinessRepository();
