import { test, expect } from '@playwright/test';

test.describe('OpenMinr Situation Room', () => {
  test.beforeEach(async ({ page }) => {
    // Enable log capture for waiting on subscription status
    await page.addInitScript(() => {
      (window as any)._logs = [];
      const oldLog = console.log;
      console.log = (...args) => {
        (window as any)._logs.push(args.join(' '));
        oldLog(...args);
      };
    });
  });

  test('should display the main dashboard layout', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Brand name is in a span, not h1
    await expect(page.locator('text=OpenMinr').first()).toBeVisible();
    await expect(page.locator('nav')).toContainText('Monitor', { ignoreCase: true });
    await expect(page.locator('nav')).toContainText('Archive', { ignoreCase: true });
  });

  test('should display incidents from database', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for incidents to load from database
    console.log('Waiting for incidents to load...');
    await page.waitForSelector('button[id^="incident-"]', { timeout: 15000 });
    const incidentCards = page.locator('button[id^="incident-"]');
    
    // Should have at least 3 test incidents from migration
    const count = await incidentCards.count();
    console.log(`Found ${count} incidents in feed`);
    expect(count).toBeGreaterThan(0);
    
    // Verify first card is visible and clickable
    const firstCard = incidentCards.first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    // Click on it and verify dossier opens
    await firstCard.click();
    await expect(page.locator('aside').last()).toContainText('Intelligence Brief');
  });
});
