import { PrismaClient, ProjectStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ApplicationMetrics {
	timestamp: string;
	application: {
		uptime: number;
		version: string;
		environment: string;
		nodeVersion: string;
	};
	database: {
		totalUsers: number;
		totalProjects: number;
		activeProjects: number;
		completedProjects: number;
		errorProjects: number;
		avgProcessingTime?: number;
	};
	performance: {
		memory: {
			used: number;
			total: number;
			percentage: number;
		};
		eventLoop?: {
			delay: number;
		};
	};
	usage: {
		last24h: {
			newUsers: number;
			newProjects: number;
			completedProjects: number;
		};
		last7d: {
			newUsers: number;
			newProjects: number;
			completedProjects: number;
		};
	};
}

async function getUsageMetrics() {
	const now = new Date();
	const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	const [
		newUsers24h,
		newProjects24h,
		completedProjects24h,
		newUsers7d,
		newProjects7d,
		completedProjects7d,
	] = await Promise.all([
		prisma.user.count({ where: { createdAt: { gte: last24h } } }),
		prisma.project.count({ where: { createdAt: { gte: last24h } } }),
		prisma.project.count({
			where: {
				updatedAt: { gte: last24h },
				status: ProjectStatus.COMPLETED,
			},
		}),
		prisma.user.count({ where: { createdAt: { gte: last7d } } }),
		prisma.project.count({ where: { createdAt: { gte: last7d } } }),
		prisma.project.count({
			where: {
				updatedAt: { gte: last7d },
				status: ProjectStatus.COMPLETED,
			},
		}),
	]);

	return {
		last24h: {
			newUsers: newUsers24h,
			newProjects: newProjects24h,
			completedProjects: completedProjects24h,
		},
		last7d: {
			newUsers: newUsers7d,
			newProjects: newProjects7d,
			completedProjects: completedProjects7d,
		},
	};
}

async function getDatabaseMetrics() {
	const [totalUsers, totalProjects, activeProjects, completedProjects, errorProjects] =
		await Promise.all([
			prisma.user.count(),
			prisma.project.count(),
			prisma.project.count({ where: { status: ProjectStatus.PROCESSING } }),
			prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
			prisma.project.count({ where: { status: ProjectStatus.ERROR } }),
		]);

	// Calculate average processing time for completed projects
	const completedProjectsWithTimes = await prisma.project.findMany({
		where: {
			status: ProjectStatus.COMPLETED,
			createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
		},
		select: {
			createdAt: true,
			updatedAt: true,
		},
	});

	const avgProcessingTime =
		completedProjectsWithTimes.length > 0
			? completedProjectsWithTimes.reduce((sum, project) => {
					return sum + (project.updatedAt.getTime() - project.createdAt.getTime());
				}, 0) /
				completedProjectsWithTimes.length /
				1000 // Convert to seconds
			: undefined;

	return {
		totalUsers,
		totalProjects,
		activeProjects,
		completedProjects,
		errorProjects,
		avgProcessingTime,
	};
}

function getPerformanceMetrics() {
	const memUsage = process.memoryUsage();

	return {
		memory: {
			used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
			total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
			percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
		},
	};
}

export async function GET() {
	try {
		const [databaseMetrics, usageMetrics] = await Promise.all([
			getDatabaseMetrics(),
			getUsageMetrics(),
		]);

		const performanceMetrics = getPerformanceMetrics();

		const metrics: ApplicationMetrics = {
			timestamp: new Date().toISOString(),
			application: {
				uptime: process.uptime(),
				version: process.env.npm_package_version || '0.1.0',
				environment: process.env.NODE_ENV || 'development',
				nodeVersion: process.version,
			},
			database: databaseMetrics,
			performance: performanceMetrics,
			usage: usageMetrics,
		};

		return NextResponse.json(metrics, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
			},
		});
	} catch (error) {
		console.error('Metrics collection failed:', error);

		return NextResponse.json(
			{
				error: 'Metrics collection failed',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
