import { NextResponse } from 'next/server';
import { aiCache } from '~/lib/cache/ai-cache';
import { dbPerformance } from '~/lib/db/performance';
import { performanceMonitor } from '~/lib/monitoring/performance';

export async function GET() {
	try {
		const [performanceReport, cacheStats, systemStats] = await Promise.all([
			performanceMonitor.createPerformanceReport(),
			aiCache.getCacheStats(),
			dbPerformance.getSystemStats(),
		]);

		const report = {
			...performanceReport,
			cache: cacheStats,
			system: systemStats,
			timestamp: new Date().toISOString(),
		};

		return NextResponse.json(report);
	} catch (error) {
		console.error('Error generating performance report:', error);
		return NextResponse.json({ error: 'Failed to generate performance report' }, { status: 500 });
	}
}
