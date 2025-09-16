// Simple Node.js script to register test user

async function registerTestUser() {
	console.info('🔧 Registering test user...');

	try {
		const email = 'aryatest1@gmail.com';
		const password = 'Aryateja@5';
		const name = 'aryatest1';

		const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				password,
				name,
			}),
		});

		console.info('Response status:', response.status);
		const responseText = await response.text();
		console.info('Response:', responseText);

		if (response.ok) {
			console.info('✅ User registered successfully!');
			console.info('Credentials:');
			console.info('Email:', email);
			console.info('Password:', password);
			console.info('Name:', name);
			console.info('');
			console.info('You can now login at: http://localhost:3000/auth/login');
		} else {
			console.info('❌ Registration failed');
		}
	} catch (error) {
		console.error('❌ Error:', error instanceof Error ? error.message : String(error));
	}
}

registerTestUser();
