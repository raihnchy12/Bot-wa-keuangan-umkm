import { prisma } from '../config/db';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type CashFlowStatus = 'Surplus' | 'Defisit' | 'Seimbang';

export interface FinancialAggregation {
  businessId: string;
  startDate: Date;
  endDate: Date;
  totalIncome: Decimal;
  totalExpense: Decimal;
  netAmount: Decimal;
  cashFlowStatus: CashFlowStatus;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
}

export class ReportService {
  async aggregateFinancials(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialAggregation> {
    // Query for INCOME aggregation
    const incomeAggregation = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: TransactionType.INCOME,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Query for EXPENSE aggregation
    const expenseAggregation = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: TransactionType.EXPENSE,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Query for total transaction count
    const totalTransactions = await prisma.transaction.count({
      where: {
        businessId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Convert amounts to Decimal, handling null values
    const totalIncome = incomeAggregation._sum.amount
      ? new Decimal(incomeAggregation._sum.amount)
      : new Decimal(0);

    const totalExpense = expenseAggregation._sum.amount
      ? new Decimal(expenseAggregation._sum.amount)
      : new Decimal(0);

    // Calculate net amount (selisih pemasukan-pengeluaran)
    const netAmount = totalIncome.minus(totalExpense);

    // Determine cash flow status
    let cashFlowStatus: CashFlowStatus;
    if (netAmount.greaterThan(0)) {
      cashFlowStatus = 'Surplus';
    } else if (netAmount.lessThan(0)) {
      cashFlowStatus = 'Defisit';
    } else {
      cashFlowStatus = 'Seimbang';
    }

    return {
      businessId,
      startDate,
      endDate,
      totalIncome,
      totalExpense,
      netAmount,
      cashFlowStatus,
      transactionCount: totalTransactions,
      incomeCount: incomeAggregation._count,
      expenseCount: expenseAggregation._count,
    };
  }

  async aggregateFinancialsOptimized(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialAggregation> {
    // Alternative: using single aggregation call with filter
    const incomeData = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: TransactionType.INCOME,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const expenseData = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: TransactionType.EXPENSE,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalCount = incomeData._count + expenseData._count;

    const totalIncome = incomeData._sum.amount
      ? new Decimal(incomeData._sum.amount)
      : new Decimal(0);
    const totalExpense = expenseData._sum.amount
      ? new Decimal(expenseData._sum.amount)
      : new Decimal(0);

    // Calculate net amount (selisih pemasukan-pengeluaran)
    const netAmount = totalIncome.minus(totalExpense);

    // Determine cash flow status
    let cashFlowStatus: CashFlowStatus;
    if (netAmount.greaterThan(0)) {
      cashFlowStatus = 'Surplus';
    } else if (netAmount.lessThan(0)) {
      cashFlowStatus = 'Defisit';
    } else {
      cashFlowStatus = 'Seimbang';
    }

    return {
      businessId,
      startDate,
      endDate,
      totalIncome,
      totalExpense,
      netAmount,
      cashFlowStatus,
      transactionCount: totalCount,
      incomeCount: incomeData._count,
      expenseCount: expenseData._count,
    };
  }
}

export const reportService = new ReportService();
