// Simple Node.js script to register test user

async function registerTestUser() {
	console.log("🔧 Registering test user...");

	try {
		const email = "aryatest1@gmail.com";
		const password = "Aryateja@5";
		const name = "aryatest1";

		const response = await fetch(
			"http://localhost:3000/api/auth/sign-up/email",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					password,
					name,
				}),
			},
		);

		console.log("Response status:", response.status);
		const responseText = await response.text();
		console.log("Response:", responseText);

		if (response.ok) {
			console.log("✅ User registered successfully!");
			console.log("Credentials:");
			console.log("Email:", email);
			console.log("Password:", password);
			console.log("Name:", name);
			console.log("");
			console.log("You can now login at: http://localhost:3000/auth/login");
		} else {
			console.log("❌ Registration failed");
		}
	} catch (error) {
		console.error(
			"❌ Error:",
			error instanceof Error ? error.message : String(error),
		);
	}
}

registerTestUser();
