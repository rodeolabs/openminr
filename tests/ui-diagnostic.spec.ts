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
  
  // Check for main app container (monitor view doesn't have tactical-grid, it's on other views)
  await expect(page.locator('[class*="tactical-scan"]')).toBeVisible();
  
  // Verify navigation is present
  await expect(page.locator('nav')).toBeVisible();
  
  // Switch to Targeting view to find tactical-grid
  await page.getByRole('button', { name: 'Targeting', exact: true }).click();
  await page.waitForTimeout(500);
  
  // Now check for tactical grid container (on Targeting view)
  const tacticalGrid = page.locator('.tactical-grid');
  await expect(tacticalGrid).toBeVisible();

  // Switch back to Monitor and check for Map Markers
  await page.getByRole('button', { name: 'Monitor', exact: true }).click();
  await page.waitForTimeout(1000);
  
  await page.waitForSelector('.maplibregl-marker, .maplibregl-canvas', { timeout: 15000 }).catch(() => null);
  const markers = await page.locator('.maplibregl-marker').count();
  console.log(`Map Markers count: ${markers}`);
  
  await page.screenshot({ path: 'diagnostic-map-screenshot.png', fullPage: true });
});
