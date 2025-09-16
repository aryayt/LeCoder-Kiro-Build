import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AlertPayload {
	type: 'error_threshold' | 'performance_degradation' | 'system_failure' | 'security_incident';
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	details?: Record<string, unknown>;
	timestamp?: number;
}

export async function POST(request: NextRequest) {
	try {
		const alert: AlertPayload = await request.json();

		// Validate alert payload
		if (!(alert.type && alert.severity && alert.message)) {
			return NextResponse.json({ error: 'Invalid alert payload' }, { status: 400 });
		}

		// Add timestamp if not provided
		if (!alert.timestamp) {
			alert.timestamp = Date.now();
		}

		// Route alert based on severity and type
		await routeAlert(alert);

		return NextResponse.json({ success: true, alertId: generateAlertId() });
	} catch (error) {
		console.error('Failed to process alert:', error);

		return NextResponse.json({ error: 'Failed to process alert' }, { status: 500 });
	}
}

async function routeAlert(alert: AlertPayload) {
	const alertHandlers = [];

	// Always log to console
	alertHandlers.push(logAlert(alert));

	// Send to appropriate channels based on severity
	switch (alert.severity) {
		case 'critical':
			alertHandlers.push(
				sendSlackAlert(alert),
				sendEmailAlert(alert)
				// sendPagerDutyAlert(alert), // Uncomment if using PagerDuty
			);
			break;

		case 'high':
			alertHandlers.push(sendSlackAlert(alert), sendEmailAlert(alert));
			break;

		case 'medium':
			alertHandlers.push(sendSlackAlert(alert));
			break;

		case 'low':
			// Only log for low severity
			break;
	}

	// Execute all handlers
	await Promise.allSettled(alertHandlers);
}

type SlackField = {
	title: string;
	value: string;
	short: boolean;
};

type SlackAttachment = {
	color: string;
	fields: SlackField[];
};

async function logAlert(alert: AlertPayload) {
	const logLevel = alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warn';

	const eventTimestamp = alert.timestamp ?? Date.now();
	console[logLevel](`[ALERT] ${alert.type.toUpperCase()}: ${alert.message}`, {
		severity: alert.severity,
		timestamp: new Date(eventTimestamp).toISOString(),
		details: alert.details,
	});
}

async function sendSlackAlert(alert: AlertPayload) {
	const webhookUrl = process.env.SLACK_WEBHOOK_URL;
	if (!webhookUrl) {
		console.warn('Slack webhook URL not configured');
		return;
	}

	try {
		const emoji = getSeverityEmoji(alert.severity);
		const color = getSeverityColor(alert.severity);

		const eventTimestamp = alert.timestamp ?? Date.now();
		const attachments: SlackAttachment[] = [
			{
				color,
				fields: [
					{
						title: 'Message',
						value: alert.message,
						short: false,
					},
					{
						title: 'Severity',
						value: alert.severity.toUpperCase(),
						short: true,
					},
					{
						title: 'Time',
						value: new Date(eventTimestamp).toISOString(),
						short: true,
					},
					{
						title: 'Environment',
						value: process.env.NODE_ENV || 'unknown',
						short: true,
					},
				],
			},
		];

		if (alert.details) {
			attachments[0]?.fields.push({
				title: 'Details',
				value: JSON.stringify(alert.details, null, 2),
				short: false,
			});
		}

		const payload = {
			text: `${emoji} ${alert.type.replace('_', ' ').toUpperCase()}`,
			attachments,
		};

		await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});
	} catch (error) {
		console.error('Failed to send Slack alert:', error);
	}
}

async function sendEmailAlert(_alert: AlertPayload) {
	// This would integrate with your email service (SendGrid, SES, etc.)
	try {
		// TODO: Implement email service integration
		// await emailService.send({...});
		console.info('Email service integration not yet implemented');
	} catch (error) {
		console.error('Failed to send email alert:', error);
	}
}

function getSeverityEmoji(severity: string): string {
	switch (severity) {
		case 'critical':
			return '🚨';
		case 'high':
			return '⚠️';
		case 'medium':
			return '⚡';
		case 'low':
			return 'ℹ️';
		default:
			return '📢';
	}
}

function getSeverityColor(severity: string): string {
	switch (severity) {
		case 'critical':
			return 'danger';
		case 'high':
			return 'warning';
		case 'medium':
			return '#ffcc00';
		case 'low':
			return 'good';
		default:
			return '#cccccc';
	}
}

function generateAlertId(): string {
	return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

export async function GET() {
	// Return alert configuration and status
	return NextResponse.json({
		alerting: {
			enabled: true,
			channels: {
				slack: !!process.env.SLACK_WEBHOOK_URL,
				email: !!process.env.ALERT_EMAIL,
				pagerduty: !!process.env.PAGERDUTY_INTEGRATION_KEY,
			},
			thresholds: {
				critical: 'immediate',
				high: 'within 5 minutes',
				medium: 'within 30 minutes',
				low: 'daily digest',
			},
		},
	});
}
