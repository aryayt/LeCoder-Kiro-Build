import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
	console.info('🔍 Checking user in database...');

	try {
		const email = 'aryatest1@gmail.com';

		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				accounts: true,
				sessions: true,
			},
		});

		if (user) {
			console.info('✅ User found:');
			console.info('ID:', user.id);
			console.info('Email:', user.email);
			console.info('Name:', user.name);
			console.info('Password field:', user.password ? 'Has password hash' : 'No password');
			console.info('Email verified:', user.emailVerified);
			console.info('Created at:', user.createdAt);
			console.info('Accounts:', user.accounts.length);
			console.info('Sessions:', user.sessions.length);

			if (user.accounts.length > 0) {
				console.info('Account details:');
				user.accounts.forEach((account, i) => {
					console.info(`  Account ${i + 1}:`);
					console.info(`    Provider: ${account.providerId}`);
					console.info(`    Account ID: ${account.accountId}`);
				});
			}
		} else {
			console.info('❌ User not found');
		}
	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await prisma.$disconnect();
	}
}

checkUser();
