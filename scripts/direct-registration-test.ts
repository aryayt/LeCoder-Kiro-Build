// Direct test of Better Auth registration
async function testDirectRegistration() {
	console.info('🧪 Testing direct registration via HTTP...');

	const baseURL = 'http://localhost:3000';

	try {
		const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: 'directtest@example.com',
				password: 'DirectTest123!',
				name: 'Direct Test',
			}),
		});

		console.info('Response status:', response.status);
		console.info('Response headers:', Object.fromEntries(response.headers.entries()));

		const responseText = await response.text();
		console.info('Response body:', responseText);

		if (response.ok) {
			console.info('✅ Direct registration successful!');
			try {
				const jsonResponse = JSON.parse(responseText);
				console.info('Parsed response:', jsonResponse);
			} catch (_e) {
				console.info('Response is not JSON');
			}
		} else {
			console.info('❌ Direct registration failed');
		}
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('❌ Network error:', errorMessage);
	}
}

// Test if server is running first
async function checkServer() {
	try {
		const response = await fetch('http://localhost:3000/api/auth');
		console.info('✅ Server is running, auth endpoint accessible');
		console.info('Auth endpoint status:', response.status);
	} catch (error) {
		console.error('❌ Server not accessible:', error);
		return false;
	}
	return true;
}

async function main() {
	const serverRunning = await checkServer();
	if (serverRunning) {
		await testDirectRegistration();
	} else {
		console.info("Please start the development server with 'npm run dev' first");
	}
}

main();
