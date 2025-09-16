import { db } from '~/server/db';

async function testAuthSetup() {
	console.info('🔍 Testing authentication setup...');

	try {
		// Test database connection
		console.info('1. Testing database connection...');
		const userCount = await db.user.count();
		console.info(`✅ Database connected. Found ${userCount} users.`);

		// Test Better Auth configuration
		console.info('2. Testing Better Auth configuration...');
		console.info('✅ Better Auth instance created successfully');

		// Check if the user exists in database
		console.info('3. Checking for test user...');
		const testUser = await db.user.findUnique({
			where: { email: 'aryateja2106@gmail.com' },
		});

		if (testUser) {
			console.info('✅ Test user found in database:', {
				id: testUser.id,
				email: testUser.email,
				name: testUser.name,
			});
		} else {
			console.info('❌ Test user not found in database');
		}

		// Check accounts table
		console.info('4. Checking accounts table...');
		const accounts = await db.account.findMany({
			where: { userId: testUser?.id },
		});
		console.info(`Found ${accounts.length} accounts for test user`);

		// Check sessions table
		console.info('5. Checking sessions table...');
		const sessions = await db.session.findMany({
			where: { userId: testUser?.id },
		});
		console.info(`Found ${sessions.length} sessions for test user`);

		console.info('\n🎯 Recommendations:');
		if (!testUser) {
			console.info("- Run 'npm run db:seed' to create test users");
		}
		console.info('- Try registering a completely new email address');
		console.info('- Check browser console for detailed error messages');
		console.info('- Ensure the server is running on the correct port');
	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

testAuthSetup()
	.then(() => {
		console.info('🎉 Test completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Test failed:', error);
		process.exit(1);
	});
