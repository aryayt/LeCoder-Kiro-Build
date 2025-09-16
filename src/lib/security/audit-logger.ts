/**
 * Audit logging service for tracking sensitive operations
 */

import type { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/server/db';

export type AuditAction =
	// User actions
	| 'USER_REGISTER'
	| 'USER_LOGIN'
	| 'USER_LOGOUT'
	| 'USER_UPDATE_PROFILE'
	| 'USER_DELETE_ACCOUNT'
	| 'USER_CHANGE_PASSWORD'
	// Project actions
	| 'PROJECT_CREATE'
	| 'PROJECT_UPDATE'
	| 'PROJECT_DELETE'
	| 'PROJECT_DOWNLOAD'
	// File actions
	| 'FILE_UPLOAD'
	| 'FILE_DOWNLOAD'
	| 'FILE_DELETE'
	// API Key actions
	| 'API_KEY_CREATE'
	| 'API_KEY_UPDATE'
	| 'API_KEY_DELETE'
	| 'API_KEY_USE'
	// AI actions
	| 'AI_PROCESS_START'
	| 'AI_PROCESS_COMPLETE'
	| 'AI_PROCESS_FAIL'
	// Security actions
	| 'RATE_LIMIT_EXCEEDED'
	| 'INVALID_LOGIN_ATTEMPT'
	| 'SUSPICIOUS_ACTIVITY'
	| 'FILE_QUARANTINE'
	// Admin actions
	| 'ADMIN_USER_MODERATE'
	| 'ADMIN_PROJECT_MODERATE';

export type SecurityEventType =
	| 'RATE_LIMIT_EXCEEDED'
	| 'INVALID_LOGIN_ATTEMPT'
	| 'SUSPICIOUS_FILE_UPLOAD'
	| 'MALICIOUS_CONTENT_DETECTED'
	| 'UNAUTHORIZED_ACCESS_ATTEMPT'
	| 'BRUTE_FORCE_ATTACK'
	| 'SQL_INJECTION_ATTEMPT'
	| 'XSS_ATTEMPT'
	| 'CSRF_ATTEMPT'
	| 'FILE_QUARANTINE'
	| 'API_ABUSE';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AuditLogEntry {
	userId?: string;
	action: AuditAction;
	resource: string;
	resourceId?: string;
	details?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	success?: boolean;
	errorMessage?: string;
}

interface SecurityEventEntry {
	eventType: SecurityEventType;
	severity: EventSeverity;
	description: string;
	details?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	userId?: string;
}

class AuditLogger {
	/**
	 * Log an audit event
	 */
	async logAudit(entry: AuditLogEntry): Promise<void> {
		try {
			await db.auditLog.create({
				data: {
					userId: entry.userId || undefined,
					action: entry.action,
					resource: entry.resource,
					resourceId: entry.resourceId || undefined,
					details: entry.details || undefined,
					ipAddress: entry.ipAddress || undefined,
					userAgent: entry.userAgent || undefined,
					success: entry.success ?? true,
					errorMessage: entry.errorMessage || undefined,
				},
			});
		} catch (error) {
			console.error('Failed to log audit event:', error);
			// Don't throw - audit logging should not break the main flow
		}
	}

	/**
	 * Log a security event
	 */
	async logSecurityEvent(entry: SecurityEventEntry): Promise<void> {
		try {
			await db.securityEvent.create({
				data: {
					eventType: entry.eventType,
					severity: entry.severity,
					description: entry.description,
					details: entry.details || undefined,
					ipAddress: entry.ipAddress || undefined,
					userAgent: entry.userAgent || undefined,
					userId: entry.userId || undefined,
				},
			});

			// For critical events, also log to console immediately
			if (entry.severity === 'CRITICAL') {
				console.error('[CRITICAL SECURITY EVENT]', {
					type: entry.eventType,
					description: entry.description,
					details: entry.details,
					ip: entry.ipAddress,
					user: entry.userId,
				});
			}
		} catch (error) {
			console.error('Failed to log security event:', error);
		}
	}

	/**
	 * Log audit event from HTTP request
	 */
	async logAuditFromRequest(
		request: NextRequest,
		action: AuditAction,
		resource: string,
		options: {
			resourceId?: string;
			details?: Record<string, any>;
			success?: boolean;
			errorMessage?: string;
		} = {}
	): Promise<void> {
		let userId: string | undefined;

		try {
			const session = await auth.api.getSession({
				headers: request.headers,
			});
			userId = session?.user?.id;
		} catch {
			// Continue without user ID if session check fails
		}

		await this.logAudit({
			userId,
			action,
			resource,
			resourceId: options.resourceId,
			details: options.details,
			ipAddress: this.getClientIP(request),
			userAgent: request.headers.get('user-agent') || undefined,
			success: options.success,
			errorMessage: options.errorMessage,
		});
	}

	/**
	 * Log security event from HTTP request
	 */
	async logSecurityEventFromRequest(
		request: NextRequest,
		eventType: SecurityEventType,
		severity: EventSeverity,
		description: string,
		details?: Record<string, any>
	): Promise<void> {
		let userId: string | undefined;

		try {
			const session = await auth.api.getSession({
				headers: request.headers,
			});
			userId = session?.user?.id;
		} catch {
			// Continue without user ID if session check fails
		}

		await this.logSecurityEvent({
			eventType,
			severity,
			description,
			details,
			ipAddress: this.getClientIP(request),
			userAgent: request.headers.get('user-agent') || undefined,
			userId,
		});
	}

	/**
	 * Log user authentication events
	 */
	async logAuthEvent(
		action: 'USER_LOGIN' | 'USER_LOGOUT' | 'INVALID_LOGIN_ATTEMPT',
		request: NextRequest,
		options: {
			userId?: string;
			email?: string;
			success?: boolean;
			errorMessage?: string;
		} = {}
	): Promise<void> {
		// Log audit event
		await this.logAudit({
			userId: options.userId,
			action,
			resource: 'user',
			resourceId: options.userId,
			details: {
				email: options.email,
			},
			ipAddress: this.getClientIP(request),
			userAgent: request.headers.get('user-agent') || undefined,
			success: options.success,
			errorMessage: options.errorMessage,
		});

		// Log security event for failed attempts
		if (action === 'INVALID_LOGIN_ATTEMPT' || options.success === false) {
			await this.logSecurityEvent({
				eventType: 'INVALID_LOGIN_ATTEMPT',
				severity: 'MEDIUM',
				description: `Failed login attempt for email: ${options.email || 'unknown'}`,
				details: {
					email: options.email,
					error: options.errorMessage,
				},
				ipAddress: this.getClientIP(request),
				userAgent: request.headers.get('user-agent') || undefined,
				userId: options.userId,
			});
		}
	}

	/**
	 * Log file operations
	 */
	async logFileOperation(
		action: 'FILE_UPLOAD' | 'FILE_DOWNLOAD' | 'FILE_DELETE',
		request: NextRequest,
		options: {
			userId?: string;
			projectId?: string;
			fileName?: string;
			fileSize?: number;
			success?: boolean;
			errorMessage?: string;
			securityThreats?: Array<{
				type: string;
				severity: string;
				description: string;
			}>;
		} = {}
	): Promise<void> {
		// Log audit event
		await this.logAudit({
			userId: options.userId,
			action,
			resource: 'file',
			resourceId: options.projectId,
			details: {
				fileName: options.fileName,
				fileSize: options.fileSize,
				securityThreats: options.securityThreats,
			},
			ipAddress: this.getClientIP(request),
			userAgent: request.headers.get('user-agent') || undefined,
			success: options.success,
			errorMessage: options.errorMessage,
		});

		// Log security events for suspicious files
		if (options.securityThreats && options.securityThreats.length > 0) {
			const highSeverityThreats = options.securityThreats.filter((t) => t.severity === 'high');

			if (highSeverityThreats.length > 0) {
				await this.logSecurityEvent({
					eventType: 'SUSPICIOUS_FILE_UPLOAD',
					severity: 'HIGH',
					description: `Suspicious file upload detected: ${options.fileName}`,
					details: {
						fileName: options.fileName,
						fileSize: options.fileSize,
						threats: options.securityThreats,
						projectId: options.projectId,
					},
					ipAddress: this.getClientIP(request),
					userAgent: request.headers.get('user-agent') || undefined,
					userId: options.userId,
				});
			}
		}
	}

	/**
	 * Log API key operations
	 */
	async logApiKeyOperation(
		action: 'API_KEY_CREATE' | 'API_KEY_UPDATE' | 'API_KEY_DELETE' | 'API_KEY_USE',
		request: NextRequest,
		options: {
			userId?: string;
			keyId?: string;
			provider?: string;
			success?: boolean;
			errorMessage?: string;
		} = {}
	): Promise<void> {
		await this.logAudit({
			userId: options.userId,
			action,
			resource: 'api_key',
			resourceId: options.keyId,
			details: {
				provider: options.provider,
			},
			ipAddress: this.getClientIP(request),
			userAgent: request.headers.get('user-agent') || undefined,
			success: options.success,
			errorMessage: options.errorMessage,
		});
	}

	/**
	 * Log rate limiting events
	 */
	async logRateLimitEvent(
		request: NextRequest,
		endpoint: string,
		options: {
			userId?: string;
			limit?: number;
			remaining?: number;
			resetTime?: number;
		} = {}
	): Promise<void> {
		// Log audit event
		await this.logAudit({
			userId: options.userId,
			action: 'RATE_LIMIT_EXCEEDED',
			resource: 'api',
			details: {
				endpoint,
				limit: options.limit,
				remaining: options.remaining,
				resetTime: options.resetTime,
			},
			ipAddress: this.getClientIP(request),
			userAgent: request.headers.get('user-agent') || undefined,
			success: false,
			errorMessage: 'Rate limit exceeded',
		});

		// Log security event
		await this.logSecurityEvent({
			eventType: 'RATE_LIMIT_EXCEEDED',
			severity: 'MEDIUM',
			description: `Rate limit exceeded for endpoint: ${endpoint}`,
			details: {
				endpoint,
				limit: options.limit,
				remaining: options.remaining,
			},
			ipAddress: this.getClientIP(request),
			userAgent: request.headers.get('user-agent') || undefined,
			userId: options.userId,
		});
	}

	/**
	 * Get audit logs for a user
	 */
	async getUserAuditLogs(
		userId: string,
		options: {
			limit?: number;
			offset?: number;
			actions?: AuditAction[];
			startDate?: Date;
			endDate?: Date;
		} = {}
	) {
		const where: any = { userId };

		if (options.actions && options.actions.length > 0) {
			where.action = { in: options.actions };
		}

		if (options.startDate || options.endDate) {
			where.createdAt = {};
			if (options.startDate) {
				where.createdAt.gte = options.startDate;
			}
			if (options.endDate) {
				where.createdAt.lte = options.endDate;
			}
		}

		return db.auditLog.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: options.limit || 50,
			skip: options.offset || 0,
		});
	}

	/**
	 * Get security events
	 */
	async getSecurityEvents(
		options: {
			limit?: number;
			offset?: number;
			severity?: EventSeverity[];
			eventTypes?: SecurityEventType[];
			resolved?: boolean;
			startDate?: Date;
			endDate?: Date;
		} = {}
	) {
		const where: any = {};

		if (options.severity && options.severity.length > 0) {
			where.severity = { in: options.severity };
		}

		if (options.eventTypes && options.eventTypes.length > 0) {
			where.eventType = { in: options.eventTypes };
		}

		if (typeof options.resolved === 'boolean') {
			where.resolved = options.resolved;
		}

		if (options.startDate || options.endDate) {
			where.createdAt = {};
			if (options.startDate) {
				where.createdAt.gte = options.startDate;
			}
			if (options.endDate) {
				where.createdAt.lte = options.endDate;
			}
		}

		return db.securityEvent.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: options.limit || 50,
			skip: options.offset || 0,
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
					},
				},
			},
		});
	}

	private getClientIP(request: NextRequest): string {
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

		return 'unknown';
	}
}

// Global audit logger instance
export const auditLogger = new AuditLogger();

/**
 * Decorator for automatic audit logging
 */
export function withAuditLog(
	action: AuditAction,
	resource: string,
	getResourceId?: (args: any[]) => string | undefined
) {
	return <T extends any[], R>(
		target: any,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
	) => {
		const originalMethod = descriptor.value!;

		descriptor.value = async function (...args: T): Promise<R> {
			const startTime = Date.now();
			let success = true;
			let errorMessage: string | undefined;
			let result: R;

			try {
				result = await originalMethod.apply(this, args);
				return result;
			} catch (error) {
				success = false;
				errorMessage = error instanceof Error ? error.message : 'Unknown error';
				throw error;
			} finally {
				// Log the audit event
				try {
					await auditLogger.logAudit({
						action,
						resource,
						resourceId: getResourceId ? getResourceId(args) : undefined,
						details: {
							method: propertyKey,
							duration: Date.now() - startTime,
							args: args.length > 0 ? { argCount: args.length } : undefined,
						},
						success,
						errorMessage,
					});
				} catch (auditError) {
					console.error('Failed to log audit event:', auditError);
				}
			}
		};

		return descriptor;
	};
}
