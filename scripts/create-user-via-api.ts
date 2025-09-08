import { auth } from "~/lib/auth";

async function createUserViaAPI() {
	console.log("🔧 Creating user via Better Auth API...");

	try {
		const result = await auth.api.signUpEmail({
			body: {
				email: "aryateja2106@gmail.com",
				password: "aryateja5",
				name: "aryateja",
			},
		});

		if (result.user) {
			console.log("✅ User created successfully!");
			console.log("User ID:", result.user.id);
			console.log("Email:", result.user.email);
			console.log("Name:", result.user.name);
		} else {
			console.log("❌ Failed to create user");
			console.log("Result:", result);
		}
	} catch (error: any) {
		console.error("❌ Error creating user:", error.message || error);

		// If user already exists, that's okay
		if (
			error.message?.includes("already exists") ||
			error.message?.includes("duplicate")
		) {
			console.log("ℹ️ User already exists - you can try logging in");
		}
	}
}

createUserViaAPI();
