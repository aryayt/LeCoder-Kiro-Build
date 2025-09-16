import { z } from 'zod';

/**
 * Validation schemas for authentication forms
 */

export const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
	password: z
		.string()
		.min(1, 'Password is required')
		.min(8, 'Password must be at least 8 characters long'),
});

export const registerSchema = z
	.object({
		name: z
			.string()
			.min(1, 'Full name is required')
			.min(2, 'Name must be at least 2 characters long')
			.max(100, 'Name must be less than 100 characters'),
		email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters long')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			),
		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export const profileUpdateSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters long')
		.max(100, 'Name must be less than 100 characters')
		.optional(),
	email: z.string().email('Please enter a valid email address').optional(),
});

export const passwordResetSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

export const passwordChangeSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters long')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			),
		confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: 'Passwords do not match',
		path: ['confirmNewPassword'],
	});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
