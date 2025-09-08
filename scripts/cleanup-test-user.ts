import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestUser() {
	console.log("🧹 Cleaning up existing test user...");

	try {
		const email = "aryatest1@gmail.com";

		// Find existing user
		const existingUser = await prisma.user.findUnique({
			where: { email },
			include: {
				sessions: true,
				accounts: true,
				projects: {
					include: {
						stages: true,
					},
				},
			},
		});

		if (existingUser) {
			console.log("Found existing user:", existingUser.name);

			// Delete all related data
			console.log("Deleting pipeline stages...");
			for (const project of existingUser.projects) {
				await prisma.pipelineStage.deleteMany({
					where: { projectId: project.id },
				});
			}

			console.log("Deleting projects...");
			await prisma.project.deleteMany({
				where: { userId: existingUser.id },
			});

			console.log("Deleting sessions...");
			await prisma.session.deleteMany({
				where: { userId: existingUser.id },
			});

			console.log("Deleting accounts...");
			await prisma.account.deleteMany({
				where: { userId: existingUser.id },
			});

			console.log("Deleting user...");
			await prisma.user.delete({
				where: { id: existingUser.id },
			});

			console.log("✅ User and all related data deleted");
		} else {
			console.log("ℹ️ No existing user found");
		}

		console.log("🎉 Cleanup completed!");
		console.log("");
		console.log("Now you can register manually:");
		console.log("1. Go to http://localhost:3000/auth/register");
		console.log("2. Use these credentials:");
		console.log("   Email: aryatest1@gmail.com");
		console.log("   Password: Aryateja@5");
		console.log("   Name: aryatest1");
	} catch (error) {
		console.error("❌ Failed to cleanup:", error);
	} finally {
		await prisma.$disconnect();
	}
}

cleanupTestUser();
