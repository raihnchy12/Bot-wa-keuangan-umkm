import { userService } from '../services/user.service';
import { prisma } from '../config/db';
import { AppError } from '../utils/appError';

async function testUserService() {
  console.log('🧪 Testing UserService & UserRepository\n');

  try {
    // Test 1: Find existing user (Budi Santoso from seed)
    console.log('📝 Test 1: findUserByPhoneNumber("628123456789")');
    const existingUser = await userService.findUserByPhoneNumber('628123456789');
    console.log('✅ Result:', existingUser);
    console.log();

    // Test 2: Create new user (Siti)
    console.log('📝 Test 2: createUser with new phone number');
    const newUser = await userService.createUser({
      name: 'Siti',
      phoneNumber: '628999888777',
    });
    console.log('✅ Result:', newUser);
    console.log();

    // Test 3: Try to create user with existing phone number (should fail)
    console.log('📝 Test 3: createUser with existing phone number (should throw error)');
    try {
      const duplicateUser = await userService.createUser({
        name: 'Duplicate Budi',
        phoneNumber: '628123456789',
      });
      console.log('❌ ERROR: Should have thrown an error but did not!');
    } catch (error) {
      if (error instanceof AppError) {
        console.log('✅ Caught AppError as expected:');
        console.log('   - Message:', error.message);
        console.log('   - Status Code:', error.statusCode);
        console.log('   - Is Operational:', error.isOperational);
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

testUserService();
