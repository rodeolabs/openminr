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

  test('should open incident dossier and display details', async ({ page }) => {
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
    
    // Check that Operator Actions section is visible
    await expect(page.locator('aside').last()).toContainText('Operator Actions');
    
    // Verify action buttons are present (Claim, Add Note, Escalate, Resolve)
    await expect(page.getByRole('button', { name: 'Claim' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Note' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Escalate' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resolve' })).toBeVisible();
  });

  test('should display critical severity indicators', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for incidents to load
    console.log('Waiting for incidents to load...');
    await page.waitForSelector('button[id^="incident-"]', { timeout: 20000 });

    // Check all incidents for severity indicators
    const incidentCards = page.locator('button[id^="incident-"]');
    const count = await incidentCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify each card shows a severity level
    for (let i = 0; i < count; i++) {
      const card = incidentCards.nth(i);
      const text = await card.textContent();
      // Should have severity indicator (S1-S5)
      expect(text).toMatch(/S[1-5]/);
    }
    
    console.log(`Verified ${count} incidents with severity indicators`);
  });
});
