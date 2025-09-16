import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestUser() {
	console.info('🧹 Cleaning up existing test user...');

	try {
		const email = 'aryatest1@gmail.com';

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
			console.info('Found existing user:', existingUser.name);

			// Delete all related data
			console.info('Deleting pipeline stages...');
			for (const project of existingUser.projects) {
				await prisma.pipelineStage.deleteMany({
					where: { projectId: project.id },
				});
			}

			console.info('Deleting projects...');
			await prisma.project.deleteMany({
				where: { userId: existingUser.id },
			});

			console.info('Deleting sessions...');
			await prisma.session.deleteMany({
				where: { userId: existingUser.id },
			});

			console.info('Deleting accounts...');
			await prisma.account.deleteMany({
				where: { userId: existingUser.id },
			});

			console.info('Deleting user...');
			await prisma.user.delete({
				where: { id: existingUser.id },
			});

			console.info('✅ User and all related data deleted');
		} else {
			console.info('ℹ️ No existing user found');
		}

		console.info('🎉 Cleanup completed!');
		console.info('');
		console.info('Now you can register manually:');
		console.info('1. Go to http://localhost:3000/auth/register');
		console.info('2. Use these credentials:');
		console.info('   Email: aryatest1@gmail.com');
		console.info('   Password: Aryateja@5');
		console.info('   Name: aryatest1');
	} catch (error) {
		console.error('❌ Failed to cleanup:', error);
	} finally {
		await prisma.$disconnect();
	}
}

cleanupTestUser();
