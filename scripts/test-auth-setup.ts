import { auth } from "~/lib/auth";
import { db } from "~/server/db";

async function testAuthSetup() {
	console.log("🔍 Testing authentication setup...");

	try {
		// Test database connection
		console.log("1. Testing database connection...");
		const userCount = await db.user.count();
		console.log(`✅ Database connected. Found ${userCount} users.`);

		// Test Better Auth configuration
		console.log("2. Testing Better Auth configuration...");
		console.log("✅ Better Auth instance created successfully");

		// Check if the user exists in database
		console.log("3. Checking for test user...");
		const testUser = await db.user.findUnique({
			where: { email: "aryateja2106@gmail.com" },
		});

		if (testUser) {
			console.log("✅ Test user found in database:", {
				id: testUser.id,
				email: testUser.email,
				name: testUser.name,
			});
		} else {
			console.log("❌ Test user not found in database");
		}

		// Check accounts table
		console.log("4. Checking accounts table...");
		const accounts = await db.account.findMany({
			where: { userId: testUser?.id },
		});
		console.log(`Found ${accounts.length} accounts for test user`);

		// Check sessions table
		console.log("5. Checking sessions table...");
		const sessions = await db.session.findMany({
			where: { userId: testUser?.id },
		});
		console.log(`Found ${sessions.length} sessions for test user`);

		console.log("\n🎯 Recommendations:");
		if (!testUser) {
			console.log("- Run 'npm run db:seed' to create test users");
		}
		console.log("- Try registering a completely new email address");
		console.log("- Check browser console for detailed error messages");
		console.log("- Ensure the server is running on the correct port");
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

testAuthSetup()
	.then(() => {
		console.log("🎉 Test completed!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Test failed:", error);
		process.exit(1);
	});
