import { PrismaClient } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

const _prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ErrorReport {
	id: string;
	message: string;
	stack?: string;
	type: 'javascript' | 'api' | 'database' | 'ai' | 'network' | 'validation';
	severity: 'low' | 'medium' | 'high' | 'critical';
	context: {
		userId?: string;
		sessionId?: string;
		url: string;
		userAgent: string;
		timestamp: number;
		environment: string;
		version: string;
		tags?: Record<string, string>;
		extra?: Record<string, unknown>;
	};
	fingerprint: string;
	count: number;
	firstSeen: number;
	lastSeen: number;
}

export async function POST(request: NextRequest) {
	try {
		const errorReport: ErrorReport = await request.json();

		// Validate the error report
		if (!(errorReport.message && errorReport.type && errorReport.severity)) {
			return NextResponse.json({ error: 'Invalid error report format' }, { status: 400 });
		}

		// Store in database (you might want to create an errors table)
		// For now, we'll log to console and could extend to external services

		console.error('Error Report Received:', {
			id: errorReport.id,
			message: errorReport.message,
			type: errorReport.type,
			severity: errorReport.severity,
			url: errorReport.context.url,
			userId: errorReport.context.userId,
			timestamp: new Date(errorReport.context.timestamp).toISOString(),
			count: errorReport.count,
		});

		// Log stack trace for debugging
		if (errorReport.stack) {
			console.error('Stack Trace:', errorReport.stack);
		}

		// Log additional context
		if (errorReport.context.extra) {
			console.error('Additional Context:', errorReport.context.extra);
		}

		// Send to external monitoring service (Sentry, LogRocket, etc.)
		await sendToExternalService(errorReport);

		// Check if this is a critical error that needs immediate attention
		if (errorReport.severity === 'critical') {
			await sendCriticalAlert(errorReport);
		}

		return NextResponse.json({ success: true, id: errorReport.id });
	} catch (error) {
		console.error('Failed to process error report:', error);

		return NextResponse.json({ error: 'Failed to process error report' }, { status: 500 });
	}
}

async function sendToExternalService(_errorReport: ErrorReport) {
	// Example: Send to Sentry, Vercel Analytics, or other monitoring service
	try {
		// TODO: Implement external service integration
		// await sentryClient.captureException(errorReport);
		console.info('External service integration not yet implemented');
	} catch (error) {
		console.error('Failed to send to external service:', error);
	}
}

async function sendCriticalAlert(errorReport: ErrorReport) {
	try {
		// Send immediate alert for critical errors
		// This could be email, Slack, PagerDuty, etc.

		const alertPayload = {
			type: 'critical_error',
			message: errorReport.message,
			url: errorReport.context.url,
			userId: errorReport.context.userId,
			timestamp: errorReport.context.timestamp,
			environment: errorReport.context.environment,
		};

		// Example: Send to Slack webhook
		if (process.env.SLACK_WEBHOOK_URL) {
			await fetch(process.env.SLACK_WEBHOOK_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: `🚨 Critical Error in ${alertPayload.environment}`,
					blocks: [
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: `*Critical Error Detected*\n\n*Message:* ${alertPayload.message}\n*URL:* ${alertPayload.url}\n*Environment:* ${alertPayload.environment}\n*Time:* ${new Date(alertPayload.timestamp).toISOString()}`,
							},
						},
					],
				}),
			});
		}
	} catch (error) {
		console.error('Failed to send critical alert:', error);
	}
}

export async function GET() {
	// Return error statistics for monitoring dashboard
	try {
		// This would typically query your error storage
		// For now, return mock data

		const stats = {
			last24h: {
				total: 0,
				critical: 0,
				high: 0,
				medium: 0,
				low: 0,
			},
			last7d: {
				total: 0,
				critical: 0,
				high: 0,
				medium: 0,
				low: 0,
			},
			topErrors: [],
		};

		return NextResponse.json(stats);
	} catch (error) {
		console.error('Failed to get error statistics:', error);

		return NextResponse.json({ error: 'Failed to get error statistics' }, { status: 500 });
	}
}
