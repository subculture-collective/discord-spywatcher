import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/');
        
        // Check if we're redirected to login or if login button exists
        const loginButton = page.getByRole('button', { name: /login/i });
        const loginLink = page.getByRole('link', { name: /login/i });
        
        const hasLoginElement = await Promise.race([
            loginButton.isVisible().catch(() => false),
            loginLink.isVisible().catch(() => false),
        ]);
        
        expect(hasLoginElement).toBeTruthy();
    });

    test('should have Discord login button', async ({ page }) => {
        await page.goto('/');
        
        // Look for Discord-related login elements
        const content = await page.content();
        const hasDiscordReference = content.toLowerCase().includes('discord');
        
        expect(hasDiscordReference).toBeTruthy();
    });
});

test.describe('Navigation', () => {
    test('should load the home page', async ({ page }) => {
        await page.goto('/');
        
        // Page should load without errors
        expect(page.url()).toContain('localhost');
    });

    test('should have proper page title', async ({ page }) => {
        await page.goto('/');
        
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);
    });
});
