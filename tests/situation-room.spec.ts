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
    await expect(page.locator('h1')).toContainText('OpenMinr', { ignoreCase: true });
    await expect(page.locator('nav')).toContainText('Monitor', { ignoreCase: true });
    await expect(page.locator('nav')).toContainText('Archive', { ignoreCase: true });
  });

  test('should receive real-time incident updates', async ({ page, request }) => {
    await page.goto('http://localhost:5173');

    console.log('Waiting for Realtime subscription...');
    await page.waitForFunction(() => {
      return (window as any)._logs && (window as any)._logs.some((l: string) => l.includes('REALTIME_SUBSCRIPTION_STATUS: SUBSCRIBED'));
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

    // Look for the new card at the top. Use a broader filter since Grok summarizes the headline.
    const newCard = page.getByTestId('intel-card').first();
    await expect(newCard).toBeVisible({ timeout: 15000 });
  });
});
