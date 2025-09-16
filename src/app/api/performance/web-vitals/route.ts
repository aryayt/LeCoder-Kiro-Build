import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '~/lib/monitoring/performance';
import { z } from 'zod';

const webVitalSchema = z.object({
  name: z.enum(['CLS', 'FID', 'FCP', 'LCP', 'TTFB']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  url: z.string(),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const webVital = webVitalSchema.parse(body);

    performanceMonitor.recordWebVital(webVital);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording web vital:', error);
    return NextResponse.json(
      { error: 'Failed to record web vital' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const summary = await performanceMonitor.getPerformanceSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error getting performance summary:', error);
    return NextResponse.json(
      { error: 'Failed to get performance summary' },
      { status: 500 }
    );
  }
}