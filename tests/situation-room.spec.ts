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

  test('should receive real-time incident updates', async ({ page, request }) => {
    await page.goto('http://localhost:5173');

    console.log('Waiting for Realtime subscription...');
    await page.waitForFunction(() => {
      return (window as any)._logs && (window as any)._logs.some((l: string) => l.includes('[REALTIME] Subscription status: SUBSCRIBED'));
    }, { timeout: 20000 });

    const testIncident = {
      content: "URGENT: Reports of unidentified drones entering restricted airspace over Sector 7. Air defense systems on standby.",
      source: "RADAR-SENTRY-01",
      lat: 52.5200,
      lon: 13.4050
    };

    const response = await request.post('http://localhost:5173/api/ingest', {
      data: testIncident
    });
    expect(response.ok()).toBeTruthy();

    // Look for the new incident in the feed - use the button with incident ID
    await page.waitForSelector('button[id^="incident-"]', { timeout: 15000 });
    const newCard = page.locator('button[id^="incident-"]').first();
    await expect(newCard).toBeVisible({ timeout: 15000 });
  });
});
