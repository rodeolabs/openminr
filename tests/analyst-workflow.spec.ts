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

    const firstCard = page.getByTestId('intel-card').first();
    await expect(firstCard).toBeVisible({ timeout: 20000 });
    
    const cardTitle = await firstCard.locator('h3').innerText();
    console.log(`Testing card: ${cardTitle}`);

    await firstCard.click();

    await expect(page.locator('aside').last()).toContainText('Situation Analysis');
    await expect(page.locator('aside').last()).toContainText(cardTitle, { ignoreCase: true });

    const claimButton = page.getByRole('button', { name: 'Claim', exact: true });
    await expect(claimButton).toBeVisible();
    await claimButton.click();
    
    await expect(page.locator('aside').last()).toContainText('You are working this incident', { ignoreCase: true });
  });

  test('should trigger critical audio alert', async ({ page, request }) => {
    await page.goto('http://localhost:5173');

    console.log('Waiting for Realtime initialization...');
    await page.waitForFunction(() => {
      return (window as any)._logs && (window as any)._logs.some((l: string) => l.includes('REALTIME_SUBSCRIPTION_STATUS: SUBSCRIBED'));
    }, { timeout: 20000 });

    await request.post('http://localhost:5173/api/ingest', {
      data: {
        content: "CRITICAL ALERT: Seismic sensors detecting 8.2 magnitude earthquake near populated coastal regions. Tsunami warning in effect.",
        source: "GLOBAL-GEOWATCH",
        lat: -15.0,
        lon: 167.0
      }
    });

    const criticalCard = page.getByTestId('intel-card').first();
    await expect(criticalCard).toBeVisible({ timeout: 25000 });
    await expect(criticalCard).toContainText('CRITICAL');
  });
});
