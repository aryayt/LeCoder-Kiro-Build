import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function initBetterAuth() {
	console.log("🔧 Initializing Better Auth database tables...");

	try {
		// Check if we need to create additional tables for Better Auth
		// Better Auth with Prisma adapter should use the existing User, Account, Session tables

		// Let's check what tables exist
		const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

		console.log("📋 Existing database tables:");
		console.log(tables);

		// Check if we have users
		const userCount = await prisma.user.count();
		console.log(`👥 Users in database: ${userCount}`);

		// Check if we have accounts
		const accountCount = await prisma.account.count();
		console.log(`🔐 Accounts in database: ${accountCount}`);

		// Check if we have sessions
		const sessionCount = await prisma.session.count();
		console.log(`📱 Sessions in database: ${sessionCount}`);

		console.log("✅ Better Auth database check completed!");
	} catch (error) {
		console.error("❌ Failed to check Better Auth setup:", error);
	} finally {
		await prisma.$disconnect();
	}
}

initBetterAuth();
