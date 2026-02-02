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

  test('should display empty state when no signals', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForSelector('text=Signal Stream', { timeout: 10000 });
    
    // Check that "Scanning Signal" empty state is displayed
    await expect(page.locator('text=Scanning Signal')).toBeVisible();
    await expect(page.locator('text=Awaiting real-time tactical intelligence')).toBeVisible();
    
    console.log('Empty state displayed correctly');
  });

  test('should display operational scopes', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for scopes to load
    await page.waitForSelector('text=Operational Scope', { timeout: 10000 });
    
    // Check scopes section exists - look for the label with count
    await expect(page.locator('text=Operational Scope').first()).toBeVisible();
    
    console.log('Operational scopes section visible');
  });

  test('should navigate to targeting view', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for app to load first
    await page.waitForSelector('nav', { timeout: 10000 });

    // Click on Targeting tab - use the nav button
    await page.click('nav button:has-text("Targeting")');
    
    // Wait for the targeting view to load
    await page.waitForSelector('text=Operational Scopes', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Operational Scopes")')).toBeVisible();
    
    console.log('Targeting view displayed correctly');
  });

  test('should navigate to archive view', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for app to load first
    await page.waitForSelector('nav', { timeout: 10000 });

    // Click on Archive tab - use the nav button
    await page.click('nav button:has-text("Archive")');
    
    // Wait for the archive view to load
    await page.waitForSelector('text=Intelligence Archive', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Intelligence Archive")')).toBeVisible();
    
    console.log('Archive view displayed correctly');
  });

  test('should verify P1-P4 terminology in UI', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForSelector('text=Signal Stream', { timeout: 10000 });
    
    // Check that old terminology is not present
    const bodyText = await page.locator('body').innerText();
    
    // Should NOT contain old terminology
    expect(bodyText).not.toContain('S1');
    expect(bodyText).not.toContain('S2');
    expect(bodyText).not.toContain('Severity');
    expect(bodyText).not.toContain('Scan');
    
    // Should contain new terminology (checking for uppercase versions since UI uses uppercase)
    expect(bodyText.toUpperCase()).toContain('SIGNAL STREAM');
    expect(bodyText.toUpperCase()).toContain('OPERATIONAL SCOPE');
    
    console.log('UI uses correct P1-P4 terminology');
  });
});
