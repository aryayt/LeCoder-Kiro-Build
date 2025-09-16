import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '../../../../scripts/database-monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthStatus {
	status: 'healthy' | 'degraded' | 'unhealthy';
	timestamp: string;
	version: string;
	uptime: number;
	services: {
		database: {
			status: 'healthy' | 'unhealthy';
			responseTime: number;
			details?: any;
		};
		ai: {
			status: 'healthy' | 'degraded' | 'unhealthy';
			providers: string[];
		};
		storage: {
			status: 'healthy' | 'unhealthy';
			available: boolean;
		};
	};
	metrics: {
		memory: {
			used: number;
			total: number;
			percentage: number;
		};
		cpu?: {
			usage: number;
		};
	};
}

async function checkAIServices() {
	const providers = [];
	let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

	// Check if AI API keys are configured
	if (process.env.OPENAI_API_KEY) {
		providers.push('openai');
	}
	if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
		providers.push('google');
	}
	if (process.env.ANTHROPIC_API_KEY) {
		providers.push('anthropic');
	}

	if (providers.length === 0) {
		status = 'unhealthy';
	} else if (providers.length < 2) {
		status = 'degraded';
	}

	return { status, providers };
}

async function checkStorageService() {
	try {
		// Basic file system check
		const fs = await import('node:fs/promises');
		await fs.access('./public');
		return { status: 'healthy' as const, available: true };
	} catch {
		return { status: 'unhealthy' as const, available: false };
	}
}

function getMemoryMetrics() {
	const used = process.memoryUsage();
	const total = used.heapTotal;
	const percentage = Math.round((used.heapUsed / total) * 100);

	return {
		used: Math.round(used.heapUsed / 1024 / 1024), // MB
		total: Math.round(total / 1024 / 1024), // MB
		percentage,
	};
}

export async function GET() {
	const startTime = Date.now();

	try {
		// Run health checks in parallel
		const [dbHealth, aiHealth, storageHealth] = await Promise.all([
			checkDatabaseHealth(),
			checkAIServices(),
			checkStorageService(),
		]);

		const memory = getMemoryMetrics();

		// Determine overall status
		let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

		if (
			dbHealth.connectionStatus === 'unhealthy' ||
			aiHealth.status === 'unhealthy' ||
			storageHealth.status === 'unhealthy'
		) {
			overallStatus = 'unhealthy';
		} else if (
			aiHealth.status === 'degraded' ||
			dbHealth.responseTime > 1000 ||
			memory.percentage > 90
		) {
			overallStatus = 'degraded';
		}

		const healthStatus: HealthStatus = {
			status: overallStatus,
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || '0.1.0',
			uptime: process.uptime(),
			services: {
				database: {
					status: dbHealth.connectionStatus,
					responseTime: dbHealth.responseTime,
					details: {
						activeConnections: dbHealth.activeConnections,
						tableStats: dbHealth.tableStats,
					},
				},
				ai: aiHealth,
				storage: storageHealth,
			},
			metrics: {
				memory,
			},
		};

		const responseTime = Date.now() - startTime;

		return NextResponse.json(healthStatus, {
			status: overallStatus === 'unhealthy' ? 503 : 200,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'X-Response-Time': `${responseTime}ms`,
			},
		});
	} catch (error) {
		console.error('Health check failed:', error);

		return NextResponse.json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: 'Health check failed',
				uptime: process.uptime(),
			},
			{
				status: 503,
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
				},
			}
		);
	}
}
