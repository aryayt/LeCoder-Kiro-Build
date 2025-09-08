import { PrismaClient } from "@prisma/client";
import { auth } from "~/lib/auth";

const prisma = new PrismaClient();

async function testConnection() {
	console.log("🔍 Testing database connection and Better Auth...");

	try {
		// Test Prisma connection
		console.log("1. Testing Prisma connection...");
		await prisma.$connect();
		console.log("✅ Prisma connected successfully");

		// Test basic query
		const userCount = await prisma.user.count();
		console.log(`✅ Current user count: ${userCount}`);

		// Test Better Auth instance
		console.log("\n2. Testing Better Auth instance...");
		console.log("✅ Better Auth instance created");

		// Check if we can access the auth object
		console.log("Auth object keys:", Object.keys(auth));
	} catch (error) {
		console.error("❌ Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

testConnection();
