import { transactionService } from '../services/transaction.service';
import { prisma } from '../config/db';
import { TransactionType } from '@prisma/client';
import { AppError } from '../utils/appError';

async function testSingleTransactionCreation() {
  console.log('🧪 Testing TRX-002: Single Transaction Creation Logic\n');

  try {
    // Get Budi's business ID from database
    const budiUser = await prisma.user.findUnique({
      where: { phoneNumber: '628123456789' },
      include: { businesses: true },
    });

    if (!budiUser || !budiUser.businesses[0]) {
      throw new Error('Budi business not found');
    }

    const businessId = budiUser.businesses[0].id;
    console.log(`📊 Using Business ID: ${businessId}\n`);

    // Test 1: Create single INCOME transaction - SUCCESS
    console.log('📝 Test 1: createTransaction - Single INCOME (SUCCESS)');
    console.log('  - Type: INCOME');
    console.log('  - Amount: 1500000 (nominal pemasukan penjualan)');
    console.log('  - Category: Penjualan');
    const incomeResult = await transactionService.createTransaction({
      businessId,
      type: TransactionType.INCOME,
      amount: 1500000,
      category: 'Penjualan',
      description: 'Penjualan 20 unit speaker premium',
      transactionDate: new Date('2026-10-14'),
    });
    console.log('✅ SUCCESS:');
    console.log('   - Transaction ID:', incomeResult.id);
    console.log('   - Type:', incomeResult.type);
    console.log('   - Amount:', incomeResult.amount.toString());
    console.log('   - Category:', incomeResult.category);
    console.log('   - Created At:', incomeResult.createdAt);
    console.log();

    // Test 2: Create single EXPENSE transaction - SUCCESS
    console.log('📝 Test 2: createTransaction - Single EXPENSE (SUCCESS)');
    console.log('  - Type: EXPENSE');
    console.log('  - Amount: 800000 (nominal pengeluaran gaji karyawan)');
    console.log('  - Category: Operasional');
    const expenseResult = await transactionService.createTransaction({
      businessId,
      type: TransactionType.EXPENSE,
      amount: 800000,
      category: 'Operasional',
      description: 'Gaji karyawan bulan Oktober',
      transactionDate: new Date('2026-10-14'),
    });
    console.log('✅ SUCCESS:');
    console.log('   - Transaction ID:', expenseResult.id);
    console.log('   - Type:', expenseResult.type);
    console.log('   - Amount:', expenseResult.amount.toString());
    console.log('   - Category:', expenseResult.category);
    console.log('   - Created At:', expenseResult.createdAt);
    console.log();

    // Test 3: Validation - Invalid type (not INCOME/EXPENSE)
    console.log('📝 Test 3: createTransaction - Invalid type (FAIL EXPECTED)');
    console.log('  - Type: "INVALID_TYPE" (should fail)');
    try {
      await transactionService.createTransaction({
        businessId,
        type: 'INVALID_TYPE' as any,
        amount: 100000,
        category: 'Test',
        transactionDate: new Date(),
      });
      console.log('❌ ERROR: Should have thrown AppError');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ EXPECTED ERROR (AppError 400):');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
        console.log('   - Is Operational:', error.isOperational);
      } else {
        console.log('❌ Unexpected error type:', error);
      }
    }
    console.log();

    // Test 4: Validation - Zero amount
    console.log('📝 Test 4: createTransaction - Zero amount (FAIL EXPECTED)');
    console.log('  - Amount: 0 (should fail)');
    try {
      await transactionService.createTransaction({
        businessId,
        type: TransactionType.INCOME,
        amount: 0,
        category: 'Test',
        transactionDate: new Date(),
      });
      console.log('❌ ERROR: Should have thrown AppError');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ EXPECTED ERROR (AppError 400):');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
      } else {
        console.log('❌ Unexpected error type:', error);
      }
    }
    console.log();

    // Test 5: Validation - Negative amount
    console.log('📝 Test 5: createTransaction - Negative amount (FAIL EXPECTED)');
    console.log('  - Amount: -500000 (should fail)');
    try {
      await transactionService.createTransaction({
        businessId,
        type: TransactionType.EXPENSE,
        amount: -500000,
        category: 'Test',
        transactionDate: new Date(),
      });
      console.log('❌ ERROR: Should have thrown AppError');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ EXPECTED ERROR (AppError 400):');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
      } else {
        console.log('❌ Unexpected error type:', error);
      }
    }
    console.log();

    // Test 6: Validation - Invalid amount format
    console.log('📝 Test 6: createTransaction - Invalid amount format (FAIL EXPECTED)');
    console.log('  - Amount: "ABC123" (should fail)');
    try {
      await transactionService.createTransaction({
        businessId,
        type: TransactionType.INCOME,
        amount: 'ABC123' as any,
        category: 'Test',
        transactionDate: new Date(),
      });
      console.log('❌ ERROR: Should have thrown AppError');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ EXPECTED ERROR (AppError 400):');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
      } else {
        console.log('❌ Unexpected error type:', error);
      }
    }
    console.log();

    // Test 7: Verify transactions were saved
    console.log('📝 Test 7: Verify transactions saved in database');
    const allTransactions = await transactionService.getTransactionsByBusinessId(businessId);
    console.log('✅ Total transactions for business:', allTransactions.length);
    const newTransactions = allTransactions.slice(0, 2);
    newTransactions.forEach((tx, idx) => {
      console.log(`   ${idx + 1}. ${tx.type} | ${tx.amount} | ${tx.category}`);
    });

    console.log('\n🎉 All TRX-002 tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSingleTransactionCreation();
