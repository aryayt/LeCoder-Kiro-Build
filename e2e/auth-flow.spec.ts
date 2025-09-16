import { expect, test } from '@playwright/test';

test.describe('Authentication Flow', () => {
	test('should allow user registration', async ({ page }) => {
		await page.goto('/auth/register');

		// Fill registration form
		await page.fill('[data-testid="email-input"]', 'test@example.com');
		await page.fill('[data-testid="password-input"]', 'TestPassword123!');
		await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');

		// Submit form
		await page.click('[data-testid="register-button"]');

		// Should redirect to dashboard or show success message
		await expect(page).toHaveURL(/\/dashboard|\/auth\/login/);
	});

	test('should allow user login', async ({ page }) => {
		await page.goto('/auth/login');

		// Fill login form
		await page.fill('[data-testid="email-input"]', 'test@example.com');
		await page.fill('[data-testid="password-input"]', 'TestPassword123!');

		// Submit form
		await page.click('[data-testid="login-button"]');

		// Should redirect to dashboard
		await expect(page).toHaveURL('/dashboard');
	});

	test('should show validation errors for invalid input', async ({ page }) => {
		await page.goto('/auth/register');

		// Try to submit with invalid email
		await page.fill('[data-testid="email-input"]', 'invalid-email');
		await page.fill('[data-testid="password-input"]', '123');
		await page.click('[data-testid="register-button"]');

		// Should show validation errors
		await expect(page.getByText(/invalid email/i)).toBeVisible();
		await expect(page.getByText(/password.*too short/i)).toBeVisible();
	});

	test('should handle logout', async ({ page }) => {
		// First login
		await page.goto('/auth/login');
		await page.fill('[data-testid="email-input"]', 'test@example.com');
		await page.fill('[data-testid="password-input"]', 'TestPassword123!');
		await page.click('[data-testid="login-button"]');

		// Navigate to dashboard
		await page.goto('/dashboard');

		// Click logout
		await page.click('[data-testid="user-menu-trigger"]');
		await page.click('[data-testid="logout-button"]');

		// Should redirect to home
		await expect(page).toHaveURL('/');
	});
});
