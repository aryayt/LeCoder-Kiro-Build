import { auth } from '~/lib/auth';
import { db } from '~/server/db';

async function createTestUser() {
	console.info('🔧 Creating test user account...');

	try {
		// Create user through Better Auth
		const user = await auth.api.signUpEmail({
			body: {
				email: 'aryateja2106@gmail.com',
				password: 'aryateja5',
				name: 'aryateja',
			},
		});

		console.info('✅ Test user created successfully!');
		console.info('User details:', {
			id: user.user?.id,
			email: user.user?.email,
			name: user.user?.name,
		});

		// Update the existing user in database if needed
		if (user.user?.id) {
			await db.user.update({
				where: { id: user.user.id },
				data: {
					name: 'aryateja',
					image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
				},
			});
			console.info('✅ User profile updated');
		}
	} catch (error) {
		console.error('❌ Failed to create test user:', error);

		// Check if user already exists
		const existingUser = await db.user.findUnique({
			where: { email: 'aryateja2106@gmail.com' },
		});

		if (existingUser) {
			console.info('ℹ️ User already exists in database:', {
				id: existingUser.id,
				email: existingUser.email,
				name: existingUser.name,
			});
		}
	}
}

createTestUser()
	.then(() => {
		console.info('🎉 Test user setup completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Setup failed:', error);
		process.exit(1);
	});
