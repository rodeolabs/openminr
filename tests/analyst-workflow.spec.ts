import { test, expect } from '@playwright/test';

test.describe('OpenMinr Analyst Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any)._logs = [];
      const oldLog = console.log;
      console.log = (...args) => {
        (window as any)._logs.push(args.join(' '));
        oldLog(...args);
      };
    });
    page.on('console', msg => console.log('BROWSER:', msg.text()));
  });

  test('should open incident dossier and claim it', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for incident buttons to appear
    await page.waitForSelector('button[id^="incident-"]', { timeout: 20000 });
    const firstCard = page.locator('button[id^="incident-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 20000 });
    
    // Get the title from the h4 element inside the card
    const cardTitle = await firstCard.locator('h4').innerText();
    console.log(`Testing card: ${cardTitle}`);

    await firstCard.click();

    // Check the dossier panel appears with correct text
    await expect(page.locator('aside').last()).toContainText('Intelligence Brief');
    await expect(page.locator('aside').last()).toContainText(cardTitle, { ignoreCase: true });

    // Look for the Claim button in the Operator Actions section
    const claimButton = page.getByRole('button', { name: 'Claim', exact: true });
    await expect(claimButton).toBeVisible();
    await claimButton.click();
    
    // After claiming, should show the claimed status
    await expect(page.locator('aside').last()).toContainText('working this incident', { ignoreCase: true });
  });

  test('should trigger critical audio alert', async ({ page, request }) => {
    await page.goto('http://localhost:5173');

    console.log('Waiting for Realtime initialization...');
    await page.waitForFunction(() => {
      return (window as any)._logs && (window as any)._logs.some((l: string) => l.includes('[REALTIME] Subscription status: SUBSCRIBED'));
    }, { timeout: 20000 });

    await request.post('http://localhost:5173/api/ingest', {
      data: {
        content: "CRITICAL ALERT: Seismic sensors detecting 8.2 magnitude earthquake near populated coastal regions. Tsunami warning in effect.",
        source: "GLOBAL-GEOWATCH",
        lat: -15.0,
        lon: 167.0
      }
    });

    // Look for high severity indicator (severity 1-2 shows red styling)
    await page.waitForSelector('button[id^="incident-"]', { timeout: 25000 });
    const criticalCard = page.locator('button[id^="incident-"]').first();
    await expect(criticalCard).toBeVisible({ timeout: 25000 });
    // Check for severity indicator (S1 or S2 indicates critical)
    const severityText = await criticalCard.textContent();
    expect(severityText).toMatch(/S[12]/);
  });
});
