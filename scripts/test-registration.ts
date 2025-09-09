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
	} catch (error: unknown) {
		console.error("❌ Registration test failed:");
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("Error:", errorMessage);
		console.error("Full error:", error);
	}
}

testRegistration();
