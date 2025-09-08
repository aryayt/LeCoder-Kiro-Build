import { auth } from "~/lib/auth";

async function testRegistration() {
	console.log("🧪 Testing Better Auth registration...");

	try {
		// Test the signup API directly
		const result = await auth.api.signUpEmail({
			body: {
				email: "testuser@example.com",
				password: "TestPassword123!",
				name: "Test User",
			},
		});

		console.log("✅ Registration test successful!");
		console.log("Result:", result);
	} catch (error: any) {
		console.error("❌ Registration test failed:");
		console.error("Error:", error.message || error);
		console.error("Full error:", error);
	}
}

testRegistration();
