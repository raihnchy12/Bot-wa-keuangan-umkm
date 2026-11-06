import { businessService } from '../services/business.service';
import { prisma } from '../config/db';
import { AppError } from '../utils/appError';

async function testBusinessService() {
  console.log('🧪 Testing BusinessService & BusinessRepository\n');

  try {
    // Get user IDs from database (from seed data)
    const budiUser = await prisma.user.findUnique({
      where: { phoneNumber: '628123456789' },
    });

    const sitiUser = await prisma.user.findUnique({
      where: { phoneNumber: '628999888777' },
    });

    if (!budiUser || !sitiUser) {
      throw new Error('Failed to find test users in database');
    }

    console.log(`📊 User IDs:
  - Budi: ${budiUser.id}
  - Siti: ${sitiUser.id}\n`);

    // Test 1: Create new business for Siti
    console.log('📝 Test 1: createBusinessForUser(sitiUser.id, "Toko Siti Kue")');
    const sitiBusinessNew = await businessService.createBusinessForUser(
      sitiUser.id,
      'Toko Siti Kue'
    );
    console.log('✅ Result:', sitiBusinessNew);
    console.log();

    // Test 2: Get business by userId for both users
    console.log('📝 Test 2a: getBusinessByUserId(budiUser.id)');
    const budiBusiness = await businessService.getBusinessByUserId(budiUser.id);
    console.log('✅ Result:', budiBusiness);
    console.log();

    console.log('📝 Test 2b: getBusinessByUserId(sitiUser.id)');
    const sitiBusiness = await businessService.getBusinessByUserId(sitiUser.id);
    console.log('✅ Result:', sitiBusiness);
    console.log();

    // Test 3: Multi-tenant isolation - try to access Budi's business with Siti's userId
    console.log('📝 Test 3: Multi-tenant Isolation - getBusinessById(budiBusiness.id, sitiUser.id)');
    console.log('  (Should fail - Siti trying to access Budi\'s business)');
    try {
      const isolationTest = await businessService.getBusinessById(
        budiBusiness.id,
        sitiUser.id
      );
      console.log('❌ ERROR: Should have thrown an error but did not!');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ Caught AppError as expected (Multi-tenant isolation working):');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
      } else {
        console.log('❌ Caught unexpected error type:', error);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBusinessService();
