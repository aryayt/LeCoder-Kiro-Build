/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { db } from '~/server/db';

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
	return {
		db,
		...opts,
	};
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

import { auth } from '~/lib/auth';
import { auditLogger } from '~/lib/security/audit-logger';

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	if (t._config.isDev) {
		// artificial delay in dev
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	const result = await next();

	const end = Date.now();
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

	return result;
});

/**
 * Authentication middleware
 *
 * Checks if the user is authenticated and adds user info to context
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
	try {
		const session = await auth.api.getSession({
			headers: ctx.headers,
		});

		if (!session?.user) {
			throw new Error('Unauthorized');
		}

		return next({
			ctx: {
				...ctx,
				user: session.user,
				session,
			},
		});
	} catch (error) {
		throw new Error('Authentication failed');
	}
});

/**
 * Rate limiting middleware for tRPC procedures
 */
const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
	// For tRPC procedures, we'll implement a simple in-memory rate limiter
	// In production, this should use Redis or a proper rate limiting service

	const userKey = ctx.headers.get('x-forwarded-for') || 'anonymous';
	const now = Date.now();
	const windowMs = 60 * 1000; // 1 minute
	const maxRequests = 100; // 100 requests per minute per user

	// Simple in-memory store (replace with Redis in production)
	if (!(global as any).rateLimitStore) {
		(global as any).rateLimitStore = new Map();
	}

	const key = `${userKey}:${Math.floor(now / windowMs)}`;
	const current = (global as any).rateLimitStore.get(key) || 0;

	if (current >= maxRequests) {
		// Log rate limit event
		await auditLogger.logAudit({
			userId: undefined, // No user context available yet
			action: 'RATE_LIMIT_EXCEEDED',
			resource: 'trpc',
			details: { procedure: path, limit: maxRequests },
			success: false,
			errorMessage: 'tRPC rate limit exceeded',
		});

		throw new Error('Rate limit exceeded. Please try again later.');
	}

	(global as any).rateLimitStore.set(key, current + 1);

	// Clean up old entries
	if (Math.random() < 0.01) {
		// 1% chance to clean up
		for (const [k] of (global as any).rateLimitStore.entries()) {
			const keyTime = Number.parseInt(k.split(':')[1] || '0');
			if (now - keyTime * windowMs > windowMs * 2) {
				(global as any).rateLimitStore.delete(k);
			}
		}
	}

	return next();
});

/**
 * Audit logging middleware for tRPC procedures
 */
const auditMiddleware = t.middleware(async ({ ctx, next, path, type, input }) => {
	const startTime = Date.now();
	let success = true;
	let errorMessage: string | undefined;

	try {
		const result = await next();
		return result;
	} catch (error) {
		success = false;
		errorMessage = error instanceof Error ? error.message : 'Unknown error';
		throw error;
	} finally {
		// Log audit event for mutations and sensitive queries
		if (type === 'mutation' || path.includes('delete') || path.includes('update')) {
			try {
				await auditLogger.logAudit({
					userId: (ctx as any).user?.id,
					action: type === 'mutation' ? 'API_KEY_USE' : 'PROJECT_UPDATE', // Map to appropriate action
					resource: 'trpc',
					details: {
						procedure: path,
						type,
						duration: Date.now() - startTime,
						inputSize: JSON.stringify(input || {}).length,
					},
					success,
					errorMessage,
				});
			} catch (auditError) {
				console.error('Failed to log tRPC audit event:', auditError);
			}
		}
	}
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.user` is not null.
 */
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(authMiddleware)
	.use(rateLimitMiddleware)
	.use(auditMiddleware);
