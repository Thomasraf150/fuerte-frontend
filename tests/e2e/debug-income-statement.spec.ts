import { test, expect } from '@playwright/test';

test.describe('Income Statement Debug', () => {
  test('view income statement page', async ({ page }) => {
    // Navigate to login first
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of current state
    await page.screenshot({ path: 'screenshots/01-initial-page.png', fullPage: true });

    // Check if we need to login
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Login required - please ensure you are logged in');
    }

    // Navigate to Income Statement page
    await page.goto('/accounting/income-statement');
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'screenshots/02-income-statement-page.png', fullPage: true });

    // Check if there are any date pickers
    const startDatePicker = page.locator('input[placeholder*="start"], .react-datepicker__input-container input').first();
    const endDatePicker = page.locator('input[placeholder*="end"], .react-datepicker__input-container input').nth(1);

    // Log what we see
    console.log('Page title:', await page.title());
    console.log('URL:', page.url());

    // Check for filter elements
    const filters = page.locator('text=Report Filters');
    if (await filters.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Found Report Filters section');
    }

    // Check for tables
    const tables = page.locator('table');
    const tableCount = await tables.count();
    console.log('Number of tables found:', tableCount);

    // Check for "No data available" messages
    const noDataMessages = page.locator('text=No data available');
    const noDataCount = await noDataMessages.count();
    console.log('Number of "No data available" messages:', noDataCount);

    // Check for loading spinner
    const loadingSpinner = page.locator('text=Loading financial data');
    if (await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('Loading spinner is visible');
    }

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/03-income-statement-final.png', fullPage: true });

    // Pause to allow manual inspection
    await page.pause();
  });
});
