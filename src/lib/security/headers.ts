/**
 * Security headers and CORS configuration for production deployment
 */

import { type NextRequest, NextResponse } from 'next/server';

// CORS configuration
export const corsConfig = {
	// Allowed origins (configure based on deployment environment)
	allowedOrigins: [
		process.env.NODE_ENV === 'production'
			? process.env.NEXT_PUBLIC_APP_URL || 'https://lecoder.app'
			: 'http://localhost:3000',
		// Add additional allowed origins here
	],

	// Allowed methods
	allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],

	// Allowed headers
	allowedHeaders: [
		'Content-Type',
		'Authorization',
		'X-Requested-With',
		'Accept',
		'Origin',
		'Cache-Control',
		'X-File-Name',
		'X-File-Size',
		'X-File-Type',
	],

	// Exposed headers (headers that the client can access)
	exposedHeaders: [
		'X-RateLimit-Limit',
		'X-RateLimit-Remaining',
		'X-RateLimit-Reset',
		'X-Total-Count',
		'X-Page-Count',
	],

	// Credentials support
	credentials: true,

	// Preflight cache duration (in seconds)
	maxAge: 86400, // 24 hours
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
	// Content Security Policy
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https: blob:",
		"media-src 'self' blob:",
		"connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com wss: ws:",
		"frame-src 'none'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		'upgrade-insecure-requests',
	].join('; '),

	// Strict Transport Security (HTTPS only)
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

	// Prevent MIME type sniffing
	'X-Content-Type-Options': 'nosniff',

	// XSS Protection
	'X-XSS-Protection': '1; mode=block',

	// Frame options (prevent clickjacking)
	'X-Frame-Options': 'DENY',

	// Referrer Policy
	'Referrer-Policy': 'strict-origin-when-cross-origin',

	// Permissions Policy (formerly Feature Policy)
	'Permissions-Policy': [
		'camera=()',
		'microphone=()',
		'geolocation=()',
		'payment=()',
		'usb=()',
		'magnetometer=()',
		'gyroscope=()',
		'accelerometer=()',
	].join(', '),

	// Cross-Origin Embedder Policy
	'Cross-Origin-Embedder-Policy': 'credentialless',

	// Cross-Origin Opener Policy
	'Cross-Origin-Opener-Policy': 'same-origin',

	// Cross-Origin Resource Policy
	'Cross-Origin-Resource-Policy': 'same-origin',

	// Remove server information
	Server: '',
	'X-Powered-By': '',
};

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
	request: NextRequest,
	response: NextResponse,
	options: Partial<typeof corsConfig> = {}
): NextResponse {
	const config = { ...corsConfig, ...options };
	const origin = request.headers.get('origin');

	// Check if origin is allowed
	if (origin && config.allowedOrigins.includes(origin)) {
		response.headers.set('Access-Control-Allow-Origin', origin);
	} else if (config.allowedOrigins.includes('*')) {
		response.headers.set('Access-Control-Allow-Origin', '*');
	}

	// Set other CORS headers
	response.headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
	response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
	response.headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
	response.headers.set('Access-Control-Max-Age', config.maxAge.toString());

	if (config.credentials) {
		response.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	return response;
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
	response: NextResponse,
	additionalHeaders: Record<string, string> = {}
): NextResponse {
	// Apply default security headers
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	// Apply additional headers
	Object.entries(additionalHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(request: NextRequest): NextResponse {
	const response = new NextResponse(null, { status: 200 });
	return applyCorsHeaders(request, response);
}

/**
 * Comprehensive security middleware
 */
export function withSecurity(
	handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
	options: {
		cors?: Partial<typeof corsConfig>;
		additionalHeaders?: Record<string, string>;
		skipCors?: boolean;
	} = {}
) {
	return async (request: NextRequest): Promise<NextResponse> => {
		// Handle preflight requests
		if (request.method === 'OPTIONS' && !options.skipCors) {
			return handlePreflight(request);
		}

		try {
			// Execute the handler
			const response = await handler(request);

			// Apply security headers
			applySecurityHeaders(response, options.additionalHeaders);

			// Apply CORS headers if not skipped
			if (!options.skipCors) {
				applyCorsHeaders(request, response, options.cors);
			}

			return response;
		} catch (error) {
			console.error('Security middleware error:', error);

			// Create error response with security headers
			const errorResponse = new NextResponse(
				JSON.stringify({
					error: 'Internal server error',
					message: 'An unexpected error occurred',
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			applySecurityHeaders(errorResponse, options.additionalHeaders);

			if (!options.skipCors) {
				applyCorsHeaders(request, errorResponse, options.cors);
			}

			return errorResponse;
		}
	};
}

/**
 * Validate request origin for sensitive operations
 */
export function validateOrigin(request: NextRequest): boolean {
	const origin = request.headers.get('origin');
	const referer = request.headers.get('referer');

	// For same-origin requests, origin might be null
	if (!origin && !referer) {
		return true; // Allow same-origin requests
	}

	// Check if origin is in allowed list
	if (origin && corsConfig.allowedOrigins.includes(origin)) {
		return true;
	}

	// Check referer as fallback
	if (referer) {
		try {
			const refererUrl = new URL(referer);
			const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
			return corsConfig.allowedOrigins.includes(refererOrigin);
		} catch {
			return false;
		}
	}

	return false;
}

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return Buffer.from(array).toString('base64');
}

/**
 * Create CSP header with nonce
 */
export function createCSPWithNonce(nonce: string): string {
	return securityHeaders['Content-Security-Policy'].replace("'unsafe-inline'", `'nonce-${nonce}'`);
}

/**
 * Security audit logging
 */
export function logSecurityEvent(
	event: string,
	details: Record<string, any>,
	request: NextRequest
): void {
	const logData = {
		timestamp: new Date().toISOString(),
		event,
		details,
		ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
		userAgent: request.headers.get('user-agent') || 'unknown',
		origin: request.headers.get('origin') || 'unknown',
		referer: request.headers.get('referer') || 'unknown',
		url: request.url,
		method: request.method,
	};

	// In production, send to logging service
	if (process.env.NODE_ENV === 'production') {
		// TODO: Integrate with logging service (e.g., Sentry, LogRocket, etc.)
		console.log('[SECURITY]', JSON.stringify(logData));
	} else {
		console.log('[SECURITY]', logData);
	}
}
