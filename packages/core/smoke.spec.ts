import { test, expect } from '@playwright/test';

const url = process.env.LAYR_PREVIEW_URL || 'http://localhost:3000';

test.describe('Layr Smoke Tests', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto(url);
    await expect(page).toHaveTitle(/.+/); // Should have any title

    // Check for basic page structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('auth flow if present', async ({ page }) => {
    test.skip(!process.env.LAYR_HAS_AUTH || process.env.LAYR_HAS_AUTH !== 'true',
      'Auth not enabled');

    await page.goto(`${url}/sign-in`);

    // Should see sign-in page elements
    const heading = page.getByRole('heading', { name: /sign/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('can access API routes', async ({ page }) => {
    const response = await page.request.get(`${url}/api/health`);

    // Allow 200 or 404 (route might not exist in all blueprints)
    expect([200, 404]).toContain(response.status());
  });

  test('CRUD operations if available', async ({ page }) => {
    test.skip(!process.env.LAYR_HAS_CRUD || process.env.LAYR_HAS_CRUD !== 'true',
      'CRUD not enabled');

    // Try to access a protected route
    await page.goto(`${url}/app/projects`);

    // Should either redirect to login or show projects
    const urlAfterNav = page.url();
    const isAuthRedirect = urlAfterNav.includes('sign-in') || urlAfterNav.includes('login');
    const isProjectsPage = urlAfterNav.includes('projects');

    expect(isAuthRedirect || isProjectsPage).toBeTruthy();
  });

  test('payment flow if configured', async ({ page }) => {
    test.skip(!process.env.LAYR_HAS_PAYMENTS || process.env.LAYR_HAS_PAYMENTS !== 'true',
      'Payments not enabled');

    await page.goto(`${url}/pricing`);

    // Should see pricing page
    const pricingContent = page.getByText(/pricing|plans|subscribe/i);
    await expect(pricingContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('static assets load correctly', async ({ page }) => {
    await page.goto(url);

    // Check that CSS loads (page should have styles)
    const hasStyles = await page.evaluate(() => {
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      const styleElements = document.querySelectorAll('style');
      return stylesheets.length > 0 || styleElements.length > 0;
    });

    expect(hasStyles).toBeTruthy();
  });

  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(url);

    // Page should still be accessible on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Performance checks', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});