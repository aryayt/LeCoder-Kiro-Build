import { PrismaClient } from '@prisma/client';

/**
 * Database connection utilities for LeCodeR
 */

let prisma: PrismaClient;

declare global {
	// eslint-disable-next-line no-var
	var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient();
} else {
	if (!global.__prisma) {
		global.__prisma = new PrismaClient({
			log: ['query', 'error', 'warn'],
		});
	}
	prisma = global.__prisma;
}

export { prisma };

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
	try {
		await prisma.$queryRaw`SELECT 1`;
		return true;
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		return false;
	}
}

/**
 * Disconnect from database
 */
export async function disconnect(): Promise<void> {
	await prisma.$disconnect();
}

/**
 * Get database connection info
 */
export function getConnectionInfo() {
	return {
		url: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'), // Hide password
		connected: !!prisma,
		environment: process.env.NODE_ENV,
	};
}
