import { transactionService } from '../services/transaction.service';
import { prisma } from '../config/db';
import { TransactionType } from '@prisma/client';

async function testTransactionService() {
  console.log('🧪 Testing TransactionService & TransactionRepository\n');

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

    // Test 1: Create INCOME transaction with number amount
    console.log('📝 Test 1: createTransaction - INCOME with number amount');
    const incomeTransaction = await transactionService.createTransaction({
      businessId,
      type: TransactionType.INCOME,
      amount: 500000, // number
      category: 'Penjualan',
      description: 'Penjualan elektronik',
      transactionDate: new Date('2026-10-14'),
    });
    console.log('✅ Result:');
    console.log('   - Type:', incomeTransaction.type);
    console.log('   - Amount:', incomeTransaction.amount.toString());
    console.log('   - Category:', incomeTransaction.category);
    console.log('   - Amount Type:', typeof incomeTransaction.amount);
    console.log();

    // Test 2: Create EXPENSE transaction with string amount
    console.log('📝 Test 2: createTransaction - EXPENSE with string amount');
    const expenseTransaction = await transactionService.createTransaction({
      businessId,
      type: TransactionType.EXPENSE,
      amount: '250000', // string
      category: 'Operasional',
      description: 'Bayar sewa toko',
      transactionDate: new Date('2026-10-14'),
    });
    console.log('✅ Result:');
    console.log('   - Type:', expenseTransaction.type);
    console.log('   - Amount:', expenseTransaction.amount.toString());
    console.log('   - Category:', expenseTransaction.category);
    console.log();

    // Test 3: Retrieve all transactions for business
    console.log('📝 Test 3: getTransactionsByBusinessId (no filter)');
    const allTransactions = await transactionService.getTransactionsByBusinessId(
      businessId
    );
    console.log('✅ Result: Found', allTransactions.length, 'transactions');
    allTransactions.forEach((tx, idx) => {
      console.log(`   ${idx + 1}. ${tx.type} - ${tx.amount} (${tx.category})`);
    });
    console.log();

    // Test 4: Retrieve INCOME transactions only
    console.log('📝 Test 4: getTransactionsByBusinessId with INCOME filter');
    const incomeTransactions = await transactionService.getTransactionsByBusinessId(
      businessId,
      { type: TransactionType.INCOME }
    );
    console.log('✅ Result: Found', incomeTransactions.length, 'INCOME transactions');
    incomeTransactions.forEach((tx) => {
      console.log(`   - ${tx.amount} (${tx.category})`);
    });
    console.log();

    // Test 5: Retrieve EXPENSE transactions only
    console.log('📝 Test 5: getTransactionsByBusinessId with EXPENSE filter');
    const expenseTransactions = await transactionService.getTransactionsByBusinessId(
      businessId,
      { type: TransactionType.EXPENSE }
    );
    console.log('✅ Result: Found', expenseTransactions.length, 'EXPENSE transactions');
    expenseTransactions.forEach((tx) => {
      console.log(`   - ${tx.amount} (${tx.category})`);
    });
    console.log();

    // Test 6: Test validation - invalid amount
    console.log('📝 Test 6: createTransaction - invalid amount (should throw error)');
    try {
      await transactionService.createTransaction({
        businessId,
        type: TransactionType.INCOME,
        amount: 'invalid',
        category: 'Test',
        transactionDate: new Date(),
      });
      console.log('❌ ERROR: Should have thrown an error');
    } catch (error: any) {
      console.log('✅ Caught validation error:');
      console.log('   - Message:', error.message);
      console.log('   - Status Code:', error.statusCode);
    }
    console.log();

    // Test 7: Test validation - zero amount
    console.log('📝 Test 7: createTransaction - zero amount (should throw error)');
    try {
      await transactionService.createTransaction({
        businessId,
        type: TransactionType.INCOME,
        amount: 0,
        category: 'Test',
        transactionDate: new Date(),
      });
      console.log('❌ ERROR: Should have thrown an error');
    } catch (error: any) {
      console.log('✅ Caught validation error:');
      console.log('   - Message:', error.message);
      console.log('   - Status Code:', error.statusCode);
    }

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTransactionService();
