// Direct test of Better Auth registration
async function testDirectRegistration() {
	console.log("🧪 Testing direct registration via HTTP...");

	const baseURL = "http://localhost:3000";

	try {
		const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: "directtest@example.com",
				password: "DirectTest123!",
				name: "Direct Test",
			}),
		});

		console.log("Response status:", response.status);
		console.log(
			"Response headers:",
			Object.fromEntries(response.headers.entries()),
		);

		const responseText = await response.text();
		console.log("Response body:", responseText);

		if (response.ok) {
			console.log("✅ Direct registration successful!");
			try {
				const jsonResponse = JSON.parse(responseText);
				console.log("Parsed response:", jsonResponse);
			} catch (e) {
				console.log("Response is not JSON");
			}
		} else {
			console.log("❌ Direct registration failed");
		}
	} catch (error: any) {
		console.error("❌ Network error:", error.message);
	}
}

// Test if server is running first
async function checkServer() {
	try {
		const response = await fetch("http://localhost:3000/api/auth");
		console.log("✅ Server is running, auth endpoint accessible");
		console.log("Auth endpoint status:", response.status);
	} catch (error) {
		console.error("❌ Server not accessible:", error);
		return false;
	}
	return true;
}

async function main() {
	const serverRunning = await checkServer();
	if (serverRunning) {
		await testDirectRegistration();
	} else {
		console.log("Please start the development server with 'npm run dev' first");
	}
}

main();
