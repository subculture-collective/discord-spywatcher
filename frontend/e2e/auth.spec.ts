import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/');

        // Check if login button OR link exists using Playwright's .or() locator
        const loginElement = page
            .getByRole('button', { name: /login/i })
            .or(page.getByRole('link', { name: /login/i }));

        await expect(loginElement).toBeVisible();
    });

    test('should have Discord login button', async ({ page }) => {
        await page.goto('/');

        // Use locator to find Discord login element
        const discordLogin = page.getByRole('link', { name: /discord/i });

        await expect(discordLogin).toBeVisible();
    });
});

test.describe('Navigation', () => {
    test('should load the home page', async ({ page }) => {
        await page.goto('/');

        // Verify page loaded successfully
        await expect(page).toHaveURL(/localhost/);
    });

    test('should have proper page title', async ({ page }) => {
        await page.goto('/');

        // Title should exist and not be empty
        await expect(page).toHaveTitle(/.+/);
    });
});
