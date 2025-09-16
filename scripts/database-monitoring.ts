#!/usr/bin/env tsx

/**
 * Database monitoring and health check utilities
 */

import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface DatabaseMetrics {
	connectionStatus: 'healthy' | 'unhealthy';
	responseTime: number;
	activeConnections?: number;
	tableStats: {
		users: number;
		projects: number;
		pipelineStages: number;
		generatedFiles: number;
	};
	diskUsage?: {
		total: string;
		used: string;
		available: string;
	};
	lastBackup?: string;
}

async function checkDatabaseHealth(): Promise<DatabaseMetrics> {
	const startTime = Date.now();

	try {
		// Test basic connectivity
		await prisma.$connect();

		// Get table counts
		const [userCount, projectCount, stageCount, fileCount] = await Promise.all([
			prisma.user.count(),
			prisma.project.count(),
			prisma.pipelineStage.count(),
			prisma.generatedFile.count(),
		]);

		const responseTime = Date.now() - startTime;

		// Get database statistics (PostgreSQL specific)
		const dbStats = await prisma.$queryRaw<
			Array<{
				datname: string;
				numbackends: number;
			}>
		>`
      SELECT datname, numbackends 
      FROM pg_stat_database 
      WHERE datname = current_database()
    `;

		const metrics: DatabaseMetrics = {
			connectionStatus: 'healthy',
			responseTime,
			activeConnections: dbStats[0]?.numbackends || 0,
			tableStats: {
				users: userCount,
				projects: projectCount,
				pipelineStages: stageCount,
				generatedFiles: fileCount,
			},
		};

		return metrics;
	} catch (error) {
		console.error('Database health check failed:', error);
		return {
			connectionStatus: 'unhealthy',
			responseTime: Date.now() - startTime,
			tableStats: {
				users: 0,
				projects: 0,
				pipelineStages: 0,
				generatedFiles: 0,
			},
		};
	} finally {
		await prisma.$disconnect();
	}
}

async function getDatabaseSize(): Promise<string> {
	try {
		const result = await prisma.$queryRaw<
			Array<{
				pg_size_pretty: string;
			}>
		>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as pg_size_pretty
    `;

		return result[0]?.pg_size_pretty || 'Unknown';
	} catch (error) {
		console.error('Failed to get database size:', error);
		return 'Error';
	}
}

async function getSlowQueries(limit = 10) {
	try {
		// This requires pg_stat_statements extension
		const slowQueries = await prisma.$queryRaw<
			Array<{
				query: string;
				calls: number;
				total_time: number;
				mean_time: number;
			}>
		>`
      SELECT 
        query,
        calls,
        total_time,
        mean_time
      FROM pg_stat_statements 
      ORDER BY mean_time DESC 
      LIMIT ${limit}
    `;

		return slowQueries;
	} catch (_error) {
		console.info('pg_stat_statements not available or not enabled');
		return [];
	}
}

async function cleanupOldData(daysOld = 30) {
	console.info(`🧹 Cleaning up data older than ${daysOld} days...`);

	try {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysOld);

		// Clean up old projects and related data
		const deletedProjects = await prisma.project.deleteMany({
			where: {
				createdAt: {
					lt: cutoffDate,
				},
				status: ProjectStatus.COMPLETED,
			},
		});

		console.info(`✅ Cleaned up ${deletedProjects.count} old projects`);

		// Clean up orphaned files (handled via cascading deletes)
		return {
			deletedProjects: deletedProjects.count,
			deletedFiles: 0,
		};
	} catch (error) {
		console.error('❌ Cleanup failed:', error);
		throw error;
	}
}

// CLI interface
async function main() {
	const command = process.argv[2];

	switch (command) {
		case 'health': {
			const health = await checkDatabaseHealth();
			console.info('📊 Database Health Report:');
			console.info(JSON.stringify(health, null, 2));
			break;
		}

		case 'size': {
			const size = await getDatabaseSize();
			console.info(`💾 Database Size: ${size}`);
			break;
		}

		case 'slow-queries': {
			const slowQueries = await getSlowQueries();
			console.info('🐌 Slow Queries:');
			console.info(JSON.stringify(slowQueries, null, 2));
			break;
		}

		case 'cleanup': {
			const daysInput = process.argv[3];
			const days = daysInput ? Number.parseInt(daysInput, 10) : 30;
			const result = await cleanupOldData(days);
			console.info('🧹 Cleanup Results:', result);
			break;
		}

		default:
			console.info(`
Usage: tsx scripts/database-monitoring.ts <command>

Commands:
  health        - Check database health and metrics
  size          - Get database size
  slow-queries  - Show slow queries (requires pg_stat_statements)
  cleanup [days] - Clean up old data (default: 30 days)
      `);
	}
}

if (require.main === module) {
	main().catch(console.error);
}

export { checkDatabaseHealth, getDatabaseSize, getSlowQueries, cleanupOldData };
