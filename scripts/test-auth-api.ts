// Test Better Auth API endpoints directly
async function testAuthAPI() {
	console.info('🧪 Testing Better Auth API...');

	try {
		// Test if the auth API is responding
		console.info('1. Testing auth API availability...');
		const healthResponse = await fetch('http://localhost:3000/api/auth', {
			method: 'GET',
		});
		console.info('Health check status:', healthResponse.status);

		// Test sign-up endpoint
		console.info('\n2. Testing sign-up endpoint...');
		const signUpResponse = await fetch('http://localhost:3000/api/auth/sign-up/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: 'test-debug@example.com',
				password: 'TestPassword123',
				name: 'Test User',
			}),
		});

		console.info('Sign-up status:', signUpResponse.status);
		console.info('Sign-up headers:', Object.fromEntries(signUpResponse.headers.entries()));

		const signUpText = await signUpResponse.text();
		console.info('Sign-up response:', signUpText);

		// Test sign-in endpoint
		console.info('\n3. Testing sign-in endpoint...');
		const signInResponse = await fetch('http://localhost:3000/api/auth/sign-in/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: 'aryatest1@gmail.com',
				password: 'Aryateja@5',
			}),
		});

		console.info('Sign-in status:', signInResponse.status);
		const signInText = await signInResponse.text();
		console.info('Sign-in response:', signInText);
	} catch (error) {
		console.error('❌ Error:', error);
	}
}

testAuthAPI();
