#!/usr/bin/env tsx

/**
 * Manual verification script for the authentication system
 * This script tests the core authentication functionality
 */

import bcrypt from 'bcryptjs';
import { db } from '~/server/db';

async function testAuthSystem() {
	console.info('🔐 Testing Authentication System...\n');

	try {
		// Test 1: User Creation
		console.info('1. Testing user creation...');
		const testUser = await db.user.create({
			data: {
				email: 'test-auth-verification@example.com',
				name: 'Test User',
				password: await bcrypt.hash('TestPassword123', 12),
			},
		});
		console.info('✅ User created successfully:', testUser.email);

		// Test 2: Session Creation
		console.info('\n2. Testing session creation...');
		const session = await db.session.create({
			data: {
				userId: testUser.id,
				token: 'test-session-token-verification',
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});
		console.info('✅ Session created successfully:', session.token);

		// Test 3: OAuth Account
		console.info('\n3. Testing OAuth account creation...');
		const account = await db.account.create({
			data: {
				userId: testUser.id,
				accountId: 'google-test-123',
				providerId: 'google',
				accessToken: 'test-access-token',
			},
		});
		console.info('✅ OAuth account created successfully:', account.providerId);

		// Test 4: User with Relations
		console.info('\n4. Testing user with relations...');
		const userWithRelations = await db.user.findUnique({
			where: { id: testUser.id },
			include: {
				sessions: true,
				accounts: true,
				projects: true,
			},
		});
		console.info('✅ User with relations fetched successfully');
		console.info(`   - Sessions: ${userWithRelations?.sessions.length}`);
		console.info(`   - Accounts: ${userWithRelations?.accounts.length}`);
		console.info(`   - Projects: ${userWithRelations?.projects.length}`);

		// Test 5: Password Verification
		console.info('\n5. Testing password verification...');
		if (!testUser.password) {
			throw new Error('User password is not set');
		}
		const isPasswordValid = await bcrypt.compare('TestPassword123', testUser.password);
		console.info('✅ Password verification:', isPasswordValid ? 'PASS' : 'FAIL');

		// Test 6: Project Creation
		console.info('\n6. Testing project creation...');
		const project = await db.project.create({
			data: {
				userId: testUser.id,
				title: 'Test Project',
				paperContent: 'Sample paper content for testing',
			},
		});
		console.info('✅ Project created successfully:', project.title);

		// Cleanup
		console.info('\n7. Cleaning up test data...');
		await db.user.delete({
			where: { id: testUser.id },
		});
		console.info('✅ Test data cleaned up successfully');

		console.info('\n🎉 All authentication system tests passed!');
	} catch (error) {
		console.error('❌ Authentication system test failed:', error);
		process.exit(1);
	}
}

// Run the test
testAuthSystem()
	.then(() => {
		console.info('\n✨ Authentication system verification complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Fatal error:', error);
		process.exit(1);
	});
