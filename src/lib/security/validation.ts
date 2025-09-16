/**
 * Comprehensive input validation schemas using Zod
 * Used across all tRPC procedures and API endpoints
 */

import { z } from 'zod';

// Common validation patterns
export const commonSchemas = {
	// ID validation (CUID format)
	id: z.string().cuid('Invalid ID format'),

	// Email validation
	email: z.string().email('Invalid email format').max(254, 'Email too long'),

	// Password validation
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(128, 'Password too long')
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			'Password must contain at least one lowercase letter, one uppercase letter, and one number'
		),

	// Name validation
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name too long')
		.regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),

	// URL validation
	url: z.string().url('Invalid URL format').max(2048, 'URL too long'),

	// File size validation (in bytes)
	fileSize: z
		.number()
		.min(1, 'File cannot be empty')
		.max(50 * 1024 * 1024, 'File too large (max 50MB)'),

	// Pagination
	pagination: z.object({
		page: z.number().int().min(1, 'Page must be at least 1').default(1),
		limit: z
			.number()
			.int()
			.min(1, 'Limit must be at least 1')
			.max(100, 'Limit cannot exceed 100')
			.default(10),
	}),

	// Search query
	searchQuery: z.string().min(1, 'Search query cannot be empty').max(100, 'Search query too long'),
};

// Authentication schemas
export const authSchemas = {
	register: z
		.object({
			name: commonSchemas.name,
			email: commonSchemas.email,
			password: commonSchemas.password,
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "Passwords don't match",
			path: ['confirmPassword'],
		}),

	login: z.object({
		email: commonSchemas.email,
		password: z.string().min(1, 'Password is required'),
		rememberMe: z.boolean().optional(),
	}),

	forgotPassword: z.object({
		email: commonSchemas.email,
	}),

	resetPassword: z
		.object({
			token: z.string().min(1, 'Reset token is required'),
			password: commonSchemas.password,
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "Passwords don't match",
			path: ['confirmPassword'],
		}),

	changePassword: z
		.object({
			currentPassword: z.string().min(1, 'Current password is required'),
			newPassword: commonSchemas.password,
			confirmPassword: z.string(),
		})
		.refine((data) => data.newPassword === data.confirmPassword, {
			message: "Passwords don't match",
			path: ['confirmPassword'],
		}),
};

// Project schemas
export const projectSchemas = {
	create: z.object({
		title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
		paperContent: z
			.string()
			.min(100, 'Paper content too short')
			.max(1000000, 'Paper content too long'),
		metadata: z.object({
			fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
			fileSize: commonSchemas.fileSize,
			pageCount: z
				.number()
				.int()
				.min(1, 'Page count must be at least 1')
				.max(1000, 'Too many pages'),
			authors: z.array(z.string().max(100, 'Author name too long')).optional(),
			abstract: z.string().max(5000, 'Abstract too long').optional(),
			keywords: z
				.array(z.string().max(50, 'Keyword too long'))
				.max(20, 'Too many keywords')
				.optional(),
		}),
	}),

	update: z.object({
		id: commonSchemas.id,
		title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
		status: z.enum(['UPLOADED', 'PROCESSING', 'COMPLETED', 'ERROR', 'CANCELLED']).optional(),
	}),

	delete: z.object({
		id: commonSchemas.id,
	}),

	list: z.object({
		page: z.number().int().min(1, 'Page must be at least 1').default(1),
		limit: z
			.number()
			.int()
			.min(1, 'Limit must be at least 1')
			.max(100, 'Limit cannot exceed 100')
			.default(10),
		status: z.enum(['UPLOADED', 'PROCESSING', 'COMPLETED', 'ERROR', 'CANCELLED']).optional(),
		search: z
			.string()
			.min(1, 'Search query cannot be empty')
			.max(100, 'Search query too long')
			.optional(),
	}),

	getById: z.object({
		id: commonSchemas.id,
	}),
};

// File upload schemas
export const fileSchemas = {
	upload: z.object({
		file: z.object({
			name: z.string().min(1, 'File name is required').max(255, 'File name too long'),
			size: commonSchemas.fileSize,
			type: z.string().refine((type) => type === 'application/pdf', 'Only PDF files are allowed'),
		}),
		metadata: z
			.object({
				title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
			})
			.optional(),
	}),

	validate: z.object({
		content: z.string().min(100, 'File content too short').max(1000000, 'File content too long'),
		fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
	}),
};

// AI processing schemas
export const aiSchemas = {
	processStage: z.object({
		projectId: commonSchemas.id,
		stageNumber: z
			.number()
			.int()
			.min(1, 'Stage number must be at least 1')
			.max(6, 'Stage number cannot exceed 6'),
		inputData: z.record(z.any()).optional(),
	}),

	retryStage: z.object({
		projectId: commonSchemas.id,
		stageNumber: z
			.number()
			.int()
			.min(1, 'Stage number must be at least 1')
			.max(6, 'Stage number cannot exceed 6'),
	}),

	cancelProcessing: z.object({
		projectId: commonSchemas.id,
	}),
};

// User management schemas
export const userSchemas = {
	updateProfile: z.object({
		name: commonSchemas.name.optional(),
		email: commonSchemas.email.optional(),
	}),

	deleteAccount: z.object({
		password: z.string().min(1, 'Password is required for account deletion'),
		confirmation: z.literal('DELETE', {
			errorMap: () => ({
				message: "You must type 'DELETE' to confirm account deletion",
			}),
		}),
	}),

	updatePreferences: z.object({
		emailNotifications: z.boolean().optional(),
		theme: z.enum(['light', 'dark', 'system']).optional(),
		language: z.string().length(2, 'Language code must be 2 characters').optional(),
	}),
};

// API Key management schemas
export const apiKeySchemas = {
	create: z.object({
		provider: z.enum(['OPENAI', 'GOOGLE', 'ANTHROPIC'], {
			errorMap: () => ({ message: 'Invalid AI provider' }),
		}),
		keyName: z.string().min(1, 'Key name is required').max(50, 'Key name too long').optional(),
		apiKey: z.string().min(10, 'API key too short').max(500, 'API key too long'),
	}),

	update: z.object({
		id: commonSchemas.id,
		keyName: z.string().min(1, 'Key name is required').max(50, 'Key name too long').optional(),
		isActive: z.boolean().optional(),
	}),

	delete: z.object({
		id: commonSchemas.id,
	}),

	test: z.object({
		id: commonSchemas.id,
	}),
};

// Admin schemas (for future admin functionality)
export const adminSchemas = {
	getUserStats: z.object({
		userId: commonSchemas.id.optional(),
		startDate: z.date().optional(),
		endDate: z.date().optional(),
	}),

	moderateProject: z.object({
		projectId: commonSchemas.id,
		action: z.enum(['approve', 'reject', 'flag']),
		reason: z.string().max(500, 'Reason too long').optional(),
	}),
};

// Webhook schemas (for future integrations)
export const webhookSchemas = {
	create: z.object({
		url: commonSchemas.url,
		events: z.array(z.enum(['project.created', 'project.completed', 'project.failed'])),
		secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
	}),

	update: z.object({
		id: commonSchemas.id,
		url: commonSchemas.url.optional(),
		events: z.array(z.enum(['project.created', 'project.completed', 'project.failed'])).optional(),
		isActive: z.boolean().optional(),
	}),
};

// Sanitization helpers
export const sanitizers = {
	/**
	 * Sanitize HTML content to prevent XSS
	 */
	html: (input: string): string => {
		return input
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;')
			.replace(/\//g, '&#x2F;');
	},

	/**
	 * Sanitize file names to prevent path traversal
	 */
	fileName: (input: string): string => {
		return input
			.replace(/[\/\\]/g, '') // Remove path separators
			.replace(/\.\./g, '') // Remove path traversal
			.replace(/[^a-zA-Z0-9._-]/g, '_')
			.replace(/\.+/g, '.')
			.replace(/^\.+|\.+$/g, '')
			.substring(0, 255);
	},

	/**
	 * Sanitize search queries
	 */
	searchQuery: (input: string): string => {
		return input.trim().replace(/[<>]/g, '').substring(0, 100);
	},

	/**
	 * Sanitize user input for database storage
	 */
	userInput: (input: string): string => {
		return input.trim().replace(/\0/g, ''); // Remove null bytes
	},
};

// Validation middleware for API routes
export function validateInput<T>(schema: z.ZodSchema<T>) {
	return (input: unknown): T => {
		try {
			return schema.parse(input);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const formattedErrors = error.errors.map((err) => ({
					field: err.path.join('.'),
					message: err.message,
				}));

				throw new Error(
					`Validation failed: ${formattedErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
				);
			}
			throw error;
		}
	};
}

// Type exports for use in other files
export type AuthRegisterInput = z.infer<typeof authSchemas.register>;
export type AuthLoginInput = z.infer<typeof authSchemas.login>;
export type ProjectCreateInput = z.infer<typeof projectSchemas.create>;
export type ProjectUpdateInput = z.infer<typeof projectSchemas.update>;
export type FileUploadInput = z.infer<typeof fileSchemas.upload>;
export type ApiKeyCreateInput = z.infer<typeof apiKeySchemas.create>;
