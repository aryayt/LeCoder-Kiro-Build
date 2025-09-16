/**
 * Comprehensive rate limiting system for API endpoints
 * Supports both user-based and IP-based rate limiting
 */

import type { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';

interface RateLimitRule {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
	skipSuccessfulRequests?: boolean;
	skipFailedRequests?: boolean;
}

interface RateLimitConfig {
	global: RateLimitRule;
	authenticated: RateLimitRule;
	upload: RateLimitRule;
	ai: RateLimitRule;
	auth: RateLimitRule;
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

class RateLimiter {
	private ipStore = new Map<string, RateLimitEntry>();
	private userStore = new Map<string, RateLimitEntry>();

	private config: RateLimitConfig = {
		global: {
			windowMs: 15 * 60 * 1000, // 15 minutes
			maxRequests: 1000, // 1000 requests per 15 minutes per IP
		},
		authenticated: {
			windowMs: 15 * 60 * 1000, // 15 minutes
			maxRequests: 2000, // 2000 requests per 15 minutes per user
		},
		upload: {
			windowMs: 60 * 60 * 1000, // 1 hour
			maxRequests: 10, // 10 uploads per hour per user
		},
		ai: {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 5, // 5 AI requests per minute per user
		},
		auth: {
			windowMs: 15 * 60 * 1000, // 15 minutes
			maxRequests: 20, // 20 auth attempts per 15 minutes per IP
		},
	};

	/**
	 * Check rate limit for a request
	 */
	async checkRateLimit(
		request: NextRequest,
		endpoint: keyof RateLimitConfig
	): Promise<{
		allowed: boolean;
		remaining: number;
		resetTime: number;
		error?: string;
	}> {
		const rule = this.config[endpoint];
		const ip = this.getClientIP(request);
		const now = Date.now();

		// Always check IP-based rate limiting
		const ipResult = this.checkLimit(ip, rule, now, this.ipStore);

		if (!ipResult.allowed) {
			return {
				allowed: false,
				remaining: 0,
				resetTime: ipResult.resetTime,
				error: `Rate limit exceeded for IP ${ip}. Try again in ${Math.ceil((ipResult.resetTime - now) / 1000)} seconds.`,
			};
		}

		// For authenticated endpoints, also check user-based rate limiting
		if (endpoint === 'authenticated' || endpoint === 'upload' || endpoint === 'ai') {
			try {
				const session = await auth.api.getSession({
					headers: request.headers,
				});

				if (session?.user?.id) {
					const userRule = endpoint === 'authenticated' ? rule : this.config[endpoint];
					const userResult = this.checkLimit(session.user.id, userRule, now, this.userStore);

					if (!userResult.allowed) {
						return {
							allowed: false,
							remaining: 0,
							resetTime: userResult.resetTime,
							error: `Rate limit exceeded for user. Try again in ${Math.ceil((userResult.resetTime - now) / 1000)} seconds.`,
						};
					}

					return {
						allowed: true,
						remaining: Math.min(ipResult.remaining, userResult.remaining),
						resetTime: Math.max(ipResult.resetTime, userResult.resetTime),
					};
				}
			} catch (error) {
				// If we can't get the session, fall back to IP-only rate limiting
				console.warn('Failed to get session for rate limiting:', error);
			}
		}

		return ipResult;
	}

	/**
	 * Record a request (increment counters)
	 */
	async recordRequest(
		request: NextRequest,
		endpoint: keyof RateLimitConfig,
		success = true
	): Promise<void> {
		const rule = this.config[endpoint];
		const ip = this.getClientIP(request);
		const now = Date.now();

		// Skip recording based on rule configuration
		if ((rule.skipSuccessfulRequests && success) || (rule.skipFailedRequests && !success)) {
			return;
		}

		// Record IP-based request
		this.recordLimit(ip, rule, now, this.ipStore);

		// Record user-based request for authenticated endpoints
		if (endpoint === 'authenticated' || endpoint === 'upload' || endpoint === 'ai') {
			try {
				const session = await auth.api.getSession({
					headers: request.headers,
				});

				if (session?.user?.id) {
					const userRule = endpoint === 'authenticated' ? rule : this.config[endpoint];
					this.recordLimit(session.user.id, userRule, now, this.userStore);
				}
			} catch (_error) {
				// Silently fail for user recording
			}
		}
	}

	/**
	 * Get current rate limit status
	 */
	async getRateLimitStatus(
		request: NextRequest,
		endpoint: keyof RateLimitConfig
	): Promise<{
		ip: { remaining: number; resetTime: number };
		user?: { remaining: number; resetTime: number };
	}> {
		const rule = this.config[endpoint];
		const ip = this.getClientIP(request);
		const now = Date.now();

		const ipStatus = this.getStatus(ip, rule, now, this.ipStore);
		const result: any = { ip: ipStatus };

		// Get user status for authenticated endpoints
		if (endpoint === 'authenticated' || endpoint === 'upload' || endpoint === 'ai') {
			try {
				const session = await auth.api.getSession({
					headers: request.headers,
				});

				if (session?.user?.id) {
					const userRule = endpoint === 'authenticated' ? rule : this.config[endpoint];
					result.user = this.getStatus(session.user.id, userRule, now, this.userStore);
				}
			} catch (_error) {
				// Silently fail
			}
		}

		return result;
	}

	private checkLimit(
		key: string,
		rule: RateLimitRule,
		now: number,
		store: Map<string, RateLimitEntry>
	): { allowed: boolean; remaining: number; resetTime: number } {
		const entry = store.get(key);

		if (!entry || now >= entry.resetTime) {
			// No entry or window expired - allow request
			return {
				allowed: true,
				remaining: rule.maxRequests - 1,
				resetTime: now + rule.windowMs,
			};
		}

		if (entry.count >= rule.maxRequests) {
			// Rate limit exceeded
			return {
				allowed: false,
				remaining: 0,
				resetTime: entry.resetTime,
			};
		}

		// Within limits
		return {
			allowed: true,
			remaining: rule.maxRequests - entry.count - 1,
			resetTime: entry.resetTime,
		};
	}

	private recordLimit(
		key: string,
		rule: RateLimitRule,
		now: number,
		store: Map<string, RateLimitEntry>
	): void {
		const entry = store.get(key);

		if (!entry || now >= entry.resetTime) {
			// Create new entry or reset expired entry
			store.set(key, {
				count: 1,
				resetTime: now + rule.windowMs,
			});
		} else {
			// Increment existing entry
			entry.count++;
		}
	}

	private getStatus(
		key: string,
		rule: RateLimitRule,
		now: number,
		store: Map<string, RateLimitEntry>
	): { remaining: number; resetTime: number } {
		const entry = store.get(key);

		if (!entry || now >= entry.resetTime) {
			return {
				remaining: rule.maxRequests,
				resetTime: now + rule.windowMs,
			};
		}

		return {
			remaining: Math.max(0, rule.maxRequests - entry.count),
			resetTime: entry.resetTime,
		};
	}

	private getClientIP(request: NextRequest): string {
		// Try various headers for IP address
		const forwarded = request.headers.get('x-forwarded-for');
		if (forwarded) {
			return forwarded.split(',')[0]?.trim() || 'unknown';
		}

		const realIP = request.headers.get('x-real-ip');
		if (realIP) {
			return realIP;
		}

		const cfConnectingIP = request.headers.get('cf-connecting-ip');
		if (cfConnectingIP) {
			return cfConnectingIP;
		}

		// Fallback to a default value
		return 'unknown';
	}

	/**
	 * Clean up expired entries to prevent memory leaks
	 */
	cleanup(): void {
		const now = Date.now();

		for (const [key, entry] of this.ipStore.entries()) {
			if (now >= entry.resetTime) {
				this.ipStore.delete(key);
			}
		}

		for (const [key, entry] of this.userStore.entries()) {
			if (now >= entry.resetTime) {
				this.userStore.delete(key);
			}
		}
	}
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Clean up expired entries every 5 minutes
setInterval(
	() => {
		rateLimiter.cleanup();
	},
	5 * 60 * 1000
);

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(endpoint: keyof RateLimitConfig) {
	return async (request: NextRequest, handler: () => Promise<Response>): Promise<Response> => {
		try {
			const result = await rateLimiter.checkRateLimit(request, endpoint);

			if (!result.allowed) {
				return new Response(
					JSON.stringify({
						error: 'Rate limit exceeded',
						message: result.error,
						retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
					}),
					{
						status: 429,
						headers: {
							'Content-Type': 'application/json',
							'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
							'X-RateLimit-Limit': rateLimiter.config[endpoint].maxRequests.toString(),
							'X-RateLimit-Remaining': result.remaining.toString(),
							'X-RateLimit-Reset': result.resetTime.toString(),
						},
					}
				);
			}

			// Execute the handler
			const response = await handler();
			const success = response.status < 400;

			// Record the request
			await rateLimiter.recordRequest(request, endpoint, success);

			// Add rate limit headers to response
			response.headers.set(
				'X-RateLimit-Limit',
				rateLimiter.config[endpoint].maxRequests.toString()
			);
			response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
			response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

			return response;
		} catch (error) {
			console.error('Rate limiting error:', error);
			// If rate limiting fails, allow the request to proceed
			return handler();
		}
	};
}
