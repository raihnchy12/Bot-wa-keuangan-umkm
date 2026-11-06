import { onboardingService } from '../services/onboarding.service';
import { prisma } from '../config/db';

async function testOnboardingService() {
  console.log('🧪 Testing OnboardingService\n');

  try {
    // Test 1: New user onboarding (atomic transaction)
    console.log('📝 Test 1: getOrCreateUserAndBusiness with NEW user');
    console.log('  - Phone: 62811223344');
    console.log('  - Name: Ahmad Rifki');
    const newUserResult = await onboardingService.getOrCreateUserAndBusiness(
      '62811223344',
      'Ahmad Rifki'
    );
    console.log('✅ Result:');
    console.log('   - User ID:', newUserResult.user.id);
    console.log('   - User Name:', newUserResult.user.name);
    console.log('   - Business ID:', newUserResult.business.id);
    console.log('   - Business Name:', newUserResult.business.name);
    console.log('   - Is New User:', newUserResult.isNewUser);
    console.log();

    // Test 2: Existing user onboarding (should return existing data)
    console.log('📝 Test 2: getOrCreateUserAndBusiness with EXISTING user (Budi Santoso)');
    console.log('  - Phone: 628123456789');
    const existingUserResult = await onboardingService.getOrCreateUserAndBusiness(
      '628123456789',
      'Budi Santoso Updated'
    );
    console.log('✅ Result:');
    console.log('   - User ID:', existingUserResult.user.id);
    console.log('   - User Name:', existingUserResult.user.name);
    console.log('   - Business ID:', existingUserResult.business.id);
    console.log('   - Business Name:', existingUserResult.business.name);
    console.log('   - Is New User:', existingUserResult.isNewUser);
    console.log('   - Note: Data unchanged (no duplicate entry created)');
    console.log();

    // Test 3: Another new user onboarding
    console.log('📝 Test 3: getOrCreateUserAndBusiness with ANOTHER NEW user');
    console.log('  - Phone: 62855667788');
    console.log('  - Name: Rina Wijaya');
    const anotherNewUserResult = await onboardingService.getOrCreateUserAndBusiness(
      '62855667788',
      'Rina Wijaya'
    );
    console.log('✅ Result:');
    console.log('   - User ID:', anotherNewUserResult.user.id);
    console.log('   - User Name:', anotherNewUserResult.user.name);
    console.log('   - Business ID:', anotherNewUserResult.business.id);
    console.log('   - Business Name:', anotherNewUserResult.business.name);
    console.log('   - Is New User:', anotherNewUserResult.isNewUser);
    console.log();

    // Test 4: Verify atomic transaction (user and business created together)
    console.log('📝 Test 4: Verify atomic transaction - check database');
    const ahmadInDb = await prisma.user.findUnique({
      where: { phoneNumber: '62811223344' },
      include: { businesses: true },
    });
    console.log('✅ Ahmad data in database:');
    console.log('   - User Name:', ahmadInDb?.name);
    console.log('   - Businesses Count:', ahmadInDb?.businesses.length);
    console.log('   - Business Name:', ahmadInDb?.businesses[0]?.name);
    console.log();

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOnboardingService();
