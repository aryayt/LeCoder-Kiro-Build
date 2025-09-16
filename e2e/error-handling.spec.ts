import { expect, test } from '@playwright/test';

test.describe('Error Handling', () => {
	test('should handle network errors gracefully', async ({ page }) => {
		// Mock network failure
		await page.route('**/api/**', (route) => route.abort());

		await page.goto('/');

		// Try to upload a file
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test.pdf',
			mimeType: 'application/pdf',
			buffer: Buffer.from('%PDF-1.4\ntest'),
		});

		// Should show network error
		await expect(page.getByText(/network error|connection failed/i)).toBeVisible();
	});

	test('should show error boundary for component crashes', async ({ page }) => {
		// Navigate to a page that might crash
		await page.goto('/dashboard');

		// Inject an error to trigger error boundary
		await page.evaluate(() => {
			// Simulate a component error
			const event = new CustomEvent('test-error');
			window.dispatchEvent(event);
		});

		// Should show error boundary fallback
		await expect(page.getByText(/something went wrong/i)).toBeVisible();
	});

	test('should handle API rate limiting', async ({ page }) => {
		// Mock rate limit response
		await page.route('**/api/upload', (route) => {
			route.fulfill({
				status: 429,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Rate limit exceeded' }),
			});
		});

		await page.goto('/');

		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test.pdf',
			mimeType: 'application/pdf',
			buffer: Buffer.from('%PDF-1.4\ntest'),
		});

		// Should show rate limit message
		await expect(page.getByText(/rate limit|too many requests/i)).toBeVisible();
	});

	test('should handle server errors', async ({ page }) => {
		// Mock server error
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Internal server error' }),
			});
		});

		await page.goto('/dashboard');

		// Should show server error message
		await expect(page.getByText(/server error|something went wrong/i)).toBeVisible();
	});

	test('should show offline indicator when network is down', async ({ page }) => {
		await page.goto('/');

		// Simulate offline
		await page.context().setOffline(true);

		// Should show offline indicator
		await expect(page.getByTestId('network-status')).toBeVisible();
		await expect(page.getByText(/offline|no connection/i)).toBeVisible();

		// Restore online
		await page.context().setOffline(false);

		// Should hide offline indicator
		await expect(page.getByText(/online|connected/i)).toBeVisible();
	});
});
