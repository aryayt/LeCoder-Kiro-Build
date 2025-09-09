#!/usr/bin/env tsx

/**
 * Database setup script for LeCodeR MVP
 * This script sets up the database schema and seeds initial data
 */

import { execSync } from "node:child_process";
import { disconnect, testConnection } from "../src/lib/db/connection";

async function setupDatabase() {
	console.log("🚀 Setting up LeCodeR database...\n");

	try {
		// Test database connection
		console.log("1. Testing database connection...");
		const isConnected = await testConnection();

		if (!isConnected) {
			console.log(
				"❌ Database connection failed. Please ensure PostgreSQL is running.",
			);
			console.log("💡 Try running: ./start-database.sh");
			process.exit(1);
		}

		// Generate Prisma client
		console.log("\n2. Generating Prisma client...");
		execSync("npx prisma generate", { stdio: "inherit" });

		// Run database migrations
		console.log("\n3. Running database migrations...");
		try {
			execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
		} catch (error) {
			console.log("⚠️  Migration may have already been applied, continuing...");
		}

		// Seed the database
		console.log("\n4. Seeding database with sample data...");
		try {
			execSync("npm run db:seed", { stdio: "inherit" });
		} catch (error) {
			console.log("⚠️  Seeding failed, but database setup is complete");
			console.log("You can run seeding manually with: npm run db:seed");
		}

		console.log("\n✅ Database setup completed successfully!");
		console.log("\n📊 You can view your database with: npm run db:studio");
	} catch (error) {
		console.error("\n❌ Database setup failed:", error);
		process.exit(1);
	} finally {
		await disconnect();
	}
}

// Run the setup if this script is executed directly
if (require.main === module) {
	setupDatabase();
}

export { setupDatabase };
