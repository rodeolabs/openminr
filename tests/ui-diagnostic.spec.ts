import { test, expect } from '@playwright/test';

test('UI Diagnostic Test', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  console.log('Detected Console Errors:', errors);
  
  // Check for tactical grid container
  const tacticalGrid = await page.locator('.tactical-grid');
  await expect(tacticalGrid).toBeVisible();

  // Check for Map Markers
  await page.waitForSelector('.maplibregl-marker', { timeout: 15000 }).catch(() => null);
  const markers = await page.locator('.maplibregl-marker').count();
  console.log(`Map Markers count: ${markers}`);
  
  await page.screenshot({ path: 'diagnostic-map-screenshot.png', fullPage: true });
});
