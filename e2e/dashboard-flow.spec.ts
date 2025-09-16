import { expect, test } from '@playwright/test';

test.describe('Dashboard Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication state
		await page.goto('/dashboard');
	});

	test('should display project dashboard', async ({ page }) => {
		// Check dashboard elements
		await expect(page.getByTestId('dashboard-layout')).toBeVisible();
		await expect(page.getByTestId('navigation')).toBeVisible();
		await expect(page.getByTestId('project-list')).toBeVisible();
	});

	test('should show project statistics', async ({ page }) => {
		// Check for stats cards
		await expect(page.getByTestId('dashboard-stats')).toBeVisible();

		// Should show total projects, completed, in progress
		await expect(page.getByText(/total projects/i)).toBeVisible();
		await expect(page.getByText(/completed/i)).toBeVisible();
		await expect(page.getByText(/in progress/i)).toBeVisible();
	});

	test('should navigate to upload page', async ({ page }) => {
		// Click upload button
		await page.click('[data-testid="upload-new-button"]');

		// Should navigate to upload page
		await expect(page).toHaveURL('/upload');
		await expect(page.getByTestId('upload-zone')).toBeVisible();
	});

	test('should display project cards with actions', async ({ page }) => {
		// Mock some projects in the list
		const projectCard = page.getByTestId('project-card').first();

		if (await projectCard.isVisible()) {
			// Check project card elements
			await expect(projectCard.getByTestId('project-title')).toBeVisible();
			await expect(projectCard.getByTestId('project-status')).toBeVisible();
			await expect(projectCard.getByTestId('project-date')).toBeVisible();

			// Check action buttons
			await expect(projectCard.getByTestId('download-button')).toBeVisible();
			await expect(projectCard.getByTestId('delete-button')).toBeVisible();
		}
	});

	test('should handle project deletion with confirmation', async ({ page }) => {
		const projectCard = page.getByTestId('project-card').first();

		if (await projectCard.isVisible()) {
			// Click delete button
			await projectCard.getByTestId('delete-button').click();

			// Should show confirmation dialog
			await expect(page.getByTestId('confirmation-dialog')).toBeVisible();
			await expect(page.getByText(/are you sure/i)).toBeVisible();

			// Cancel deletion
			await page.click('[data-testid="cancel-button"]');
			await expect(page.getByTestId('confirmation-dialog')).not.toBeVisible();
		}
	});

	test('should handle project download', async ({ page }) => {
		const projectCard = page.getByTestId('project-card').first();

		if (await projectCard.isVisible()) {
			// Start download
			const downloadPromise = page.waitForEvent('download');
			await projectCard.getByTestId('download-button').click();

			// Should trigger download
			const download = await downloadPromise;
			expect(download.suggestedFilename()).toMatch(/\.zip$/);
		}
	});
});
