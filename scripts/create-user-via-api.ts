import { auth } from '~/lib/auth';

async function createUserViaAPI() {
	console.info('🔧 Creating user via Better Auth API...');

	try {
		const result = await auth.api.signUpEmail({
			body: {
				email: 'aryateja2106@gmail.com',
				password: 'aryateja5',
				name: 'aryateja',
			},
		});

		if (result.user) {
			console.info('✅ User created successfully!');
			console.info('User ID:', result.user.id);
			console.info('Email:', result.user.email);
			console.info('Name:', result.user.name);
		} else {
			console.info('❌ Failed to create user');
			console.info('Result:', result);
		}
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('❌ Error creating user:', errorMessage);

		// If user already exists, that's okay
		if (errorMessage?.includes('already exists') || errorMessage?.includes('duplicate')) {
			console.info('ℹ️ User already exists - you can try logging in');
		}
	}
}

createUserViaAPI();
