import { expect, test } from '@playwright/test';

test.describe('PDF Upload Flow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should display upload interface on homepage', async ({ page }) => {
		// Check if upload zone is visible
		await expect(page.getByTestId('upload-zone')).toBeVisible();

		// Check for drag and drop text
		await expect(page.getByText(/drag.*drop.*pdf/i)).toBeVisible();

		// Check for file input
		await expect(page.locator('input[type="file"]')).toBeVisible();
	});

	test('should handle file upload and show progress', async ({ page }) => {
		// Create a mock PDF file for testing
		const fileContent = Buffer.from(
			'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n178\n%%EOF'
		);

		// Upload file
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test-paper.pdf',
			mimeType: 'application/pdf',
			buffer: fileContent,
		});

		// Should show processing state
		await expect(page.getByTestId('progress-tracker')).toBeVisible({ timeout: 10000 });

		// Should show stages
		await expect(page.getByText(/concept extraction/i)).toBeVisible();
		await expect(page.getByText(/algorithm analysis/i)).toBeVisible();
	});

	test('should reject invalid file types', async ({ page }) => {
		// Try to upload a text file
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('This is not a PDF'),
		});

		// Should show error message
		await expect(page.getByText(/only pdf files are accepted/i)).toBeVisible();
	});

	test('should show file size error for large files', async ({ page }) => {
		// Create a large mock file (simulate > 50MB)
		const largeContent = Buffer.alloc(51 * 1024 * 1024, 'a'); // 51MB

		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'large-file.pdf',
			mimeType: 'application/pdf',
			buffer: largeContent,
		});

		// Should show size error
		await expect(page.getByText(/file size exceeds/i)).toBeVisible();
	});
});
