import { PrismaClient } from '@prisma/client';
import { auth } from '~/lib/auth';

const prisma = new PrismaClient();

async function testConnection() {
	console.info('🔍 Testing database connection and Better Auth...');

	try {
		// Test Prisma connection
		console.info('1. Testing Prisma connection...');
		await prisma.$connect();
		console.info('✅ Prisma connected successfully');

		// Test basic query
		const userCount = await prisma.user.count();
		console.info(`✅ Current user count: ${userCount}`);

		// Test Better Auth instance
		console.info('\n2. Testing Better Auth instance...');
		console.info('✅ Better Auth instance created');

		// Check if we can access the auth object
		console.info('Auth object keys:', Object.keys(auth));
	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await prisma.$disconnect();
	}
}

testConnection();
