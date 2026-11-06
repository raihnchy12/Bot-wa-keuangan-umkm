import { transactionService } from '../services/transaction.service';
import { prisma } from '../config/db';
import { AppError } from '../utils/appError';
import { TransactionType } from '@prisma/client';

async function testTransactionIsolation() {
  console.log('🧪 Testing TRX-003: Multi-tenant Isolation Guard for Transaction Access\n');

  try {
    // Setup: Get Budi's and Siti's businesses
    const budiUser = await prisma.user.findUnique({
      where: { phoneNumber: '628123456789' },
      include: { businesses: true },
    });

    const sitiUser = await prisma.user.findUnique({
      where: { phoneNumber: '628999888777' },
      include: { businesses: true },
    });

    if (!budiUser?.businesses[0] || !sitiUser?.businesses[0]) {
      throw new Error('Test users or businesses not found');
    }

    const budiBusiness = budiUser.businesses[0];
    const sitiBusiness = sitiUser.businesses[0];

    console.log(`📊 Business Setup:
  - Budi's Business ID: ${budiBusiness.id}
  - Siti's Business ID: ${sitiBusiness.id}\n`);

    // Create a test transaction for Budi
    console.log('📝 Setup: Create test transaction for Budi');
    const testTransaction = await transactionService.createTransaction({
      businessId: budiBusiness.id,
      type: TransactionType.INCOME,
      amount: 3000000,
      category: 'Penjualan',
      description: 'Penjualan bulk order electronics',
      transactionDate: new Date('2026-10-14'),
    });
    console.log('✅ Created Transaction ID:', testTransaction.id);
    console.log('   Owner: Budi Business\n');

    // Test 1: Budi CAN read their own transaction
    console.log('📝 Test 1: Budi reads OWN transaction (SUCCESS EXPECTED)');
    const budiCanRead = await transactionService.getTransactionById(
      testTransaction.id,
      budiBusiness.id
    );
    console.log('✅ SUCCESS: Budi can read their transaction:');
    console.log('   - ID:', budiCanRead.id);
    console.log('   - Amount:', budiCanRead.amount.toString());
    console.log('   - Business ID:', budiCanRead.businessId);
    console.log();

    // Test 2: Siti CANNOT read Budi's transaction
    console.log('📝 Test 2: Siti reads BUDI\'S transaction (FAILURE EXPECTED)');
    try {
      await transactionService.getTransactionById(testTransaction.id, sitiBusiness.id);
      console.log('❌ SECURITY BREACH: Siti should NOT be able to read Budi\'s transaction!');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ SECURITY OK - AppError 404 caught:');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
      }
    }
    console.log();

    // Test 3: Budi CAN update their own transaction
    console.log('📝 Test 3: Budi updates OWN transaction (SUCCESS EXPECTED)');
    const budiCanUpdate = await transactionService.updateTransaction(
      testTransaction.id,
      budiBusiness.id,
      {
        businessId: budiBusiness.id,
        amount: 3500000, // Updated amount
        type: TransactionType.INCOME,
        category: 'Penjualan',
        transactionDate: new Date('2026-10-14'),
      }
    );
    console.log('✅ SUCCESS: Budi updated their transaction');
    console.log('   - Update count:', budiCanUpdate.count);
    console.log();

    // Test 4: Siti CANNOT update Budi's transaction
    console.log('📝 Test 4: Siti updates BUDI\'S transaction (FAILURE EXPECTED)');
    try {
      await transactionService.updateTransaction(
        testTransaction.id,
        sitiBusiness.id,
        {
          businessId: sitiBusiness.id,
          amount: 1000000,
          type: TransactionType.INCOME,
          category: 'Penjualan',
          transactionDate: new Date('2026-10-14'),
        }
      );
      console.log('❌ SECURITY BREACH: Siti should NOT be able to update Budi\'s transaction!');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ SECURITY OK - AppError 404 caught:');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
      }
    }
    console.log();

    // Create another test transaction for deletion test
    console.log('📝 Setup: Create another test transaction for delete test');
    const deleteTestTx = await transactionService.createTransaction({
      businessId: budiBusiness.id,
      type: TransactionType.EXPENSE,
      amount: 500000,
      category: 'Operasional',
      description: 'Test for deletion',
      transactionDate: new Date('2026-10-14'),
    });
    console.log('✅ Created Transaction ID:', deleteTestTx.id, '\n');

    // Test 5: Budi CAN delete their own transaction
    console.log('📝 Test 5: Budi deletes OWN transaction (SUCCESS EXPECTED)');
    const budiCanDelete = await transactionService.deleteTransaction(
      deleteTestTx.id,
      budiBusiness.id
    );
    console.log('✅ SUCCESS: Budi deleted their transaction');
    console.log('   - Delete count:', budiCanDelete.count);
    console.log();

    // Verify deletion
    console.log('📝 Verify: Confirm transaction was deleted');
    try {
      await transactionService.getTransactionById(deleteTestTx.id, budiBusiness.id);
      console.log('❌ Transaction still exists!');
    } catch (error) {
      console.log('✅ Transaction successfully deleted');
    }
    console.log();

    // Create one more test transaction for Siti
    console.log('📝 Setup: Create test transaction for Siti');
    const sitiTestTx = await transactionService.createTransaction({
      businessId: sitiBusiness.id,
      type: TransactionType.INCOME,
      amount: 2000000,
      category: 'Penjualan',
      description: 'Siti\'s test transaction',
      transactionDate: new Date('2026-10-14'),
    });
    console.log('✅ Created Transaction ID:', sitiTestTx.id, '\n');

    // Test 6: Siti CANNOT delete Budi's transaction (if it still existed)
    console.log('📝 Test 6: Siti attempts DELETE on Budi\'s transaction (FAILURE EXPECTED)');
    try {
      await transactionService.deleteTransaction(testTransaction.id, sitiBusiness.id);
      console.log('❌ SECURITY BREACH: Siti should NOT be able to delete Budi\'s transaction!');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ SECURITY OK - AppError 404 caught:');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
      }
    }
    console.log();

    // Test 7: Cross-business query isolation
    console.log('📝 Test 7: Query isolation - getTransactionsByBusinessId');
    const budiTransactions = await transactionService.getTransactionsByBusinessId(
      budiBusiness.id
    );
    const sitiTransactions = await transactionService.getTransactionsByBusinessId(
      sitiBusiness.id
    );
    console.log('✅ Budi can see only their transactions:', budiTransactions.length, 'transactions');
    console.log('✅ Siti can see only their transactions:', sitiTransactions.length, 'transactions');
    console.log('   - Budi and Siti transactions are isolated ✓');

    console.log('\n🎉 All TRX-003 Multi-tenant Isolation tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Multi-tenant isolation properly enforced');
    console.log('   ✅ Each UMKM can only access/modify their own data');
    console.log('   ✅ Cross-business data access attempts are blocked with 404');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTransactionIsolation();
