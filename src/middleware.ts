import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';
import { auditLogger } from '~/lib/security/audit-logger';
import { applyCorsHeaders, applySecurityHeaders, validateOrigin } from '~/lib/security/headers';
import { rateLimiter } from '~/lib/security/rate-limiter';

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const response = NextResponse.next();

	// Apply security headers to all responses
	applySecurityHeaders(response);

	// Handle CORS for API routes
	if (pathname.startsWith('/api/')) {
		applyCorsHeaders(request, response);

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new NextResponse(null, { status: 200, headers: response.headers });
		}
	}

	// Rate limiting for API routes
	if (pathname.startsWith('/api/')) {
		let endpoint: 'global' | 'authenticated' | 'upload' | 'ai' | 'auth' = 'global';

		// Determine endpoint type for rate limiting
		if (pathname.startsWith('/api/auth/')) {
			endpoint = 'auth';
		} else if (pathname.startsWith('/api/upload')) {
			endpoint = 'upload';
		} else if (pathname.startsWith('/api/ai/') || pathname.includes('process')) {
			endpoint = 'ai';
		} else if (pathname.startsWith('/api/')) {
			endpoint = 'authenticated';
		}

		const rateLimitResult = await rateLimiter.checkRateLimit(request, endpoint);

		if (!rateLimitResult.allowed) {
			// Log rate limit event
			await auditLogger.logRateLimitEvent(request, pathname, {
				limit: rateLimiter.config[endpoint].maxRequests,
				remaining: rateLimitResult.remaining,
				resetTime: rateLimitResult.resetTime,
			});

			return new NextResponse(
				JSON.stringify({
					error: 'Rate limit exceeded',
					message: rateLimitResult.error,
					retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
						'X-RateLimit-Limit': rateLimiter.config[endpoint].maxRequests.toString(),
						'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
						'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
						...Object.fromEntries(response.headers.entries()),
					},
				}
			);
		}

		// Add rate limit headers
		response.headers.set('X-RateLimit-Limit', rateLimiter.config[endpoint].maxRequests.toString());
		response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
		response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
	}

	// Validate origin for sensitive operations
	if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
		if (!validateOrigin(request)) {
			await auditLogger.logSecurityEventFromRequest(
				request,
				'CSRF_ATTEMPT',
				'MEDIUM',
				'Invalid origin for sensitive operation',
				{ pathname, method: request.method }
			);

			return new NextResponse(JSON.stringify({ error: 'Invalid origin' }), {
				status: 403,
				headers: {
					'Content-Type': 'application/json',
					...Object.fromEntries(response.headers.entries()),
				},
			});
		}
	}

	// Public routes that don't require authentication
	const publicRoutes = [
		'/',
		'/auth/login',
		'/auth/register',
		'/auth/forgot-password',
		'/auth/reset-password',
		'/api/auth',
	];

	// Check if the current path is public
	const isPublicRoute = publicRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`)
	);

	// If it's a public route, allow access
	if (isPublicRoute) {
		return response;
	}

	// For protected routes, check authentication
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			// Log unauthorized access attempt
			await auditLogger.logSecurityEventFromRequest(
				request,
				'UNAUTHORIZED_ACCESS_ATTEMPT',
				'MEDIUM',
				'Attempted access to protected route without authentication',
				{ pathname }
			);

			// Redirect to login if not authenticated
			const loginUrl = new URL('/auth/login', request.url);
			loginUrl.searchParams.set('callbackUrl', pathname);
			return NextResponse.redirect(loginUrl);
		}

		return response;
	} catch (error) {
		// Log authentication error
		await auditLogger.logSecurityEventFromRequest(
			request,
			'UNAUTHORIZED_ACCESS_ATTEMPT',
			'MEDIUM',
			'Authentication check failed',
			{ pathname, error: error instanceof Error ? error.message : 'Unknown error' }
		);

		// If there's an error checking the session, redirect to login
		const loginUrl = new URL('/auth/login', request.url);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
	runtime: 'nodejs',
};
