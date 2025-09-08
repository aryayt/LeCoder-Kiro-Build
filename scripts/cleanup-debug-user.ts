import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDebugUser() {
	console.log("🧹 Cleaning up debug test user...");

	try {
		const email = "test-debug@example.com";

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (user) {
			await prisma.session.deleteMany({
				where: { userId: user.id },
			});
			await prisma.account.deleteMany({
				where: { userId: user.id },
			});
			await prisma.user.delete({
				where: { id: user.id },
			});
			console.log("✅ Debug user deleted");
		} else {
			console.log("ℹ️ No debug user found");
		}
	} catch (error) {
		console.error("❌ Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

cleanupDebugUser();
