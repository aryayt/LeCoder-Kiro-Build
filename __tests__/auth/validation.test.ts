import { describe, expect, it } from '@jest/globals';
import {
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  passwordResetSchema,
  passwordChangeSchema,
} from '~/lib/auth/validation';

/**
 * Tests for authentication validation schemas
 */

describe('Authentication Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Please enter a valid email address');
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password must be at least 8 characters long');
      }
    });

    it('should reject empty fields', () => {
      const invalidData = {
        email: '',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have at least 2 errors (one for each field)
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        const emailErrors = result.error.issues.filter(issue => issue.path[0] === 'email');
        const passwordErrors = result.error.issues.filter(issue => issue.path[0] === 'password');
        expect(emailErrors.length).toBeGreaterThan(0);
        expect(passwordErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weakpassword',
        confirmPassword: 'weakpassword',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(issue => issue.path[0] === 'password');
        expect(passwordError?.message).toContain('Password must contain at least one uppercase letter');
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
        confirmPassword: 'DifferentPass123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find(issue => issue.path[0] === 'confirmPassword');
        expect(confirmError?.message).toBe('Passwords do not match');
      }
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'A',
        email: 'john@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(issue => issue.path[0] === 'name');
        expect(nameError?.message).toBe('Name must be at least 2 characters long');
      }
    });

    it('should reject long name', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        email: 'john@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(issue => issue.path[0] === 'name');
        expect(nameError?.message).toBe('Name must be less than 100 characters');
      }
    });
  });

  describe('profileUpdateSchema', () => {
    it('should validate correct profile data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const validData = {
        name: 'John Doe',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Please enter a valid email address');
      }
    });
  });

  describe('passwordResetSchema', () => {
    it('should validate correct email', () => {
      const validData = {
        email: 'test@example.com',
      };

      const result = passwordResetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const result = passwordResetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Please enter a valid email address');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
      };

      const result = passwordResetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Email is required');
      }
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate correct password change data', () => {
      const validData = {
        currentPassword: 'oldpassword123',
        newPassword: 'NewStrongPass123',
        confirmNewPassword: 'NewStrongPass123',
      };

      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak new password', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'weak',
        confirmNewPassword: 'weak',
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordErrors = result.error.issues.filter(issue => issue.path[0] === 'newPassword');
        expect(passwordErrors.length).toBeGreaterThan(0);
        // Should have either length error or pattern error
        const hasLengthError = passwordErrors.some(error => error.message.includes('8 characters'));
        const hasPatternError = passwordErrors.some(error => error.message.includes('uppercase letter'));
        expect(hasLengthError || hasPatternError).toBe(true);
      }
    });

    it('should reject mismatched new passwords', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'NewStrongPass123',
        confirmNewPassword: 'DifferentPass123',
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find(issue => issue.path[0] === 'confirmNewPassword');
        expect(confirmError?.message).toBe('Passwords do not match');
      }
    });

    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'NewStrongPass123',
        confirmNewPassword: 'NewStrongPass123',
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const currentPasswordError = result.error.issues.find(issue => issue.path[0] === 'currentPassword');
        expect(currentPasswordError?.message).toBe('Current password is required');
      }
    });
  });

  describe('Password Strength Validation', () => {
    const testCases = [
      { password: 'StrongPass123', valid: true, description: 'valid strong password' },
      { password: 'strongpass123', valid: false, description: 'missing uppercase' },
      { password: 'STRONGPASS123', valid: false, description: 'missing lowercase' },
      { password: 'StrongPassword', valid: false, description: 'missing number' },
      { password: 'Strong1', valid: false, description: 'too short' },
      { password: 'MyVeryStrongPassword123!', valid: true, description: 'long strong password' },
    ];

    testCases.forEach(({ password, valid, description }) => {
      it(`should ${valid ? 'accept' : 'reject'} ${description}`, () => {
        const data = {
          name: 'Test User',
          email: 'test@example.com',
          password,
          confirmPassword: password,
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(valid);
      });
    });
  });
});