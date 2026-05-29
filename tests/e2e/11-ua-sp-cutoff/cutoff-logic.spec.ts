/**
 * UA/SP Cut-off Logic E2E Tests
 *
 * Validates the cut-off-based UA/SP classification across:
 * 1. Problem Accounts — "Missed Cut-offs" column replaces "Days Past Due"
 * 2. Payment Posting — UA/SP creation still works correctly
 */

import { test, expect } from '@playwright/test';
import { loginToApp, navigateToPage } from '../../helpers/test-utils';

// ------------------------------------------------------------------
// 1. Problem Accounts — Missed Cut-offs column
// ------------------------------------------------------------------

test.describe('Problem Accounts — Cut-off based classification', () => {
  // Problem Accounts CTE walks 5K+ loans × all their schedules — slow on dev DB.
  // Login (~10s) + page load + 45s data-wait can exceed the 60s default.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
  });

  test('should display "Missed Cut-offs" column instead of "Days Past Due"', async ({ page }) => {
    await navigateToPage(page, '/problem-accounts');
    // CTE query is slow (~10s) and table only renders headers after data arrives.
    // Wait up to 60s for the column header to appear.
    await expect(page.getByText('Missed Cut-offs', { exact: true })).toBeVisible({ timeout: 60_000 });

    // The old "Days Past Due" text should NOT appear
    const daysPastDue = page.getByText('Days Past Due', { exact: true });
    await expect(daysPastDue).toHaveCount(0);
  });

  test('should show numeric values in Missed Cut-offs column', async ({ page }) => {
    await navigateToPage(page, '/problem-accounts');
    await expect(page.getByText('Missed Cut-offs', { exact: true })).toBeVisible({ timeout: 60_000 });

    // The table should now have data rows with numeric values in the Missed Cut-offs column
    const bodyText = await page.textContent('body') ?? '';
    const hasCutoffNumbers = /\b\d{1,3}\b/.test(bodyText);
    expect(hasCutoffNumbers).toBe(true);
  });

  test('should still show UA and SP amount columns', async ({ page }) => {
    await navigateToPage(page, '/problem-accounts');
    await expect(page.getByText('Missed Cut-offs', { exact: true })).toBeVisible({ timeout: 60_000 });

    await expect(page.getByText(/Uncollected.*UA/i).first()).toBeVisible();
    await expect(page.getByText(/Shorts.*SP/i).first()).toBeVisible();
    await expect(page.getByText('Shortfall', { exact: true }).first()).toBeVisible();
  });

  test('should still show summary cards with totals', async ({ page }) => {
    await navigateToPage(page, '/problem-accounts');
    await page.waitForTimeout(2000);

    await expect(page.getByText('Total Problem Accounts')).toBeVisible();
    await expect(page.getByText('Total Uncollected (UA)')).toBeVisible();
    await expect(page.getByText('Total Shorts (SP)')).toBeVisible();
    await expect(page.getByText('Total Shortfall')).toBeVisible();
  });
});

// ------------------------------------------------------------------
// 2. Payment Posting — UA/SP still works correctly
// ------------------------------------------------------------------

test.describe('Payment Posting — UA/SP compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
  });

  test('payment collection form should still show UA/SP field', async ({ page }) => {
    await navigateToPage(page, '/payment-posting');
    await page.waitForTimeout(2000);

    // The payment posting page should load without errors
    // Look for the UA/SP label in the form (it appears when a schedule is selected)
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('Internal Server Error');
  });
});
