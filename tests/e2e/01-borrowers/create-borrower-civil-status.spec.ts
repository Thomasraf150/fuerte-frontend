/**
 * E2E Test Suite: Borrower Civil Status — Conditional Spouse Section
 *
 * Validates the 2026-05 refactor where the "Borrower Spouse Details" card
 * only renders when civil_status is Married or Live-in, and is hidden +
 * non-required for Single / Widowed / Separated.
 *
 * These specs test the conditional render behavior of the form itself.
 * They intentionally do NOT submit the form — happy-path submission is
 * covered by create-borrower.spec.ts, and submission would also trip over
 * unrelated ReactSelect dropdowns (Office / Area / Sub-Area) that aren't in
 * scope for this feature.
 *
 * Scenarios:
 *   1. Single — civil_status is a dropdown set to "Single" and the spouse
 *      section is absent from the DOM.
 *   2. Married — picking "Married" mounts the spouse section and exposes the
 *      9 spouse inputs as required.
 *   3. Married → Single → Married — the useEffect that clears stale spouse
 *      values works (regression guard against leaking ex-spouse data).
 */

import { test, expect } from '@playwright/test';
import { loginToApp, navigateToPage } from '../../helpers/test-utils';

const SPOUSE_INPUTS = [
  'work_address',
  'occupation',
  'fullname',
  'company',
  'dept_branch',
  'length_of_service',
  'salary',
  'company_contact_person',
  'spouse_contact_no',
];

async function openCreateForm(page: import('@playwright/test').Page) {
  await loginToApp(page);
  await navigateToPage(page, '/borrowers');
  await page.click('button:has-text("Create")');
  await page.waitForSelector('form', { timeout: 5000 });
}

test.describe('Borrower civil status — conditional spouse section', () => {

  // ==========================================================================
  // 1. SINGLE — dropdown exposes the option set, spouse card is hidden
  // ==========================================================================
  test('Single hides the spouse section and exposes all 5 PH civil status options', async ({ page }) => {
    await openCreateForm(page);

    const civilStatus = page.locator('select[name="civil_status"]').first();
    await expect(civilStatus).toHaveCount(1);

    // All 5 PH options must be present (incl. Live-in and Separated added in this change).
    for (const option of ['Single', 'Married', 'Live-in', 'Widowed', 'Separated']) {
      await expect(civilStatus.locator(`option[value="${option}"]`)).toHaveCount(1);
    }

    await civilStatus.selectOption('Single');
    await page.waitForTimeout(400);
    await expect(civilStatus).toHaveValue('Single');

    // Spouse section header must be absent from the DOM.
    await expect(page.locator('text=Borrower Spouse Details')).toHaveCount(0);

    // Each individual spouse input must also be absent.
    for (const name of SPOUSE_INPUTS) {
      await expect(page.locator(`input[name="${name}"]`)).toHaveCount(0);
    }
  });

  // ==========================================================================
  // 2. MARRIED — picking Married mounts the spouse section with its 9 inputs
  // ==========================================================================
  test('Married mounts the spouse section with all 9 required inputs visible', async ({ page }) => {
    await openCreateForm(page);

    const civilStatus = page.locator('select[name="civil_status"]').first();
    await civilStatus.selectOption('Married');
    await page.waitForTimeout(400);

    await expect(page.locator('text=Borrower Spouse Details')).toHaveCount(1);

    for (const name of SPOUSE_INPUTS) {
      const input = page.locator(`input[name="${name}"]`).first();
      await expect(input).toBeVisible();
    }
  });

  // ==========================================================================
  // 3. SWITCH — Married → Single → Married clears stale spouse data
  // ==========================================================================
  test('Switching from Married to Single clears stale spouse fields on re-mount', async ({ page }) => {
    await openCreateForm(page);

    const civilStatus = page.locator('select[name="civil_status"]').first();

    // Type a stale value while Married.
    await civilStatus.selectOption('Married');
    await page.waitForTimeout(400);
    const spouseFullname = page.locator('input[name="fullname"]').first();
    await expect(spouseFullname).toBeVisible();
    await spouseFullname.fill('STALE Juan Dela Cruz');
    await expect(spouseFullname).toHaveValue('STALE Juan Dela Cruz');

    // Switch to Single — spouse card unmounts.
    await civilStatus.selectOption('Single');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Borrower Spouse Details')).toHaveCount(0);

    // Switch back to Married — spouse fullname is empty (useEffect cleared it).
    await civilStatus.selectOption('Married');
    await page.waitForTimeout(400);
    const spouseFullnameAgain = page.locator('input[name="fullname"]').first();
    await expect(spouseFullnameAgain).toBeVisible();
    await expect(spouseFullnameAgain).toHaveValue('');
  });

  // ==========================================================================
  // 4. LIVE-IN — equivalent to Married for the purposes of showing the section
  // ==========================================================================
  test('Live-in mounts the spouse section (treated equivalently to Married)', async ({ page }) => {
    await openCreateForm(page);

    const civilStatus = page.locator('select[name="civil_status"]').first();
    await civilStatus.selectOption('Live-in');
    await page.waitForTimeout(400);

    await expect(page.locator('text=Borrower Spouse Details')).toHaveCount(1);
    await expect(page.locator('input[name="fullname"]').first()).toBeVisible();
  });

  // ==========================================================================
  // 5. WIDOWED / SEPARATED — still hide the section
  // ==========================================================================
  test('Widowed and Separated keep the spouse section hidden', async ({ page }) => {
    await openCreateForm(page);

    const civilStatus = page.locator('select[name="civil_status"]').first();

    for (const value of ['Widowed', 'Separated']) {
      await civilStatus.selectOption(value);
      await page.waitForTimeout(300);
      await expect(page.locator('text=Borrower Spouse Details')).toHaveCount(0);
      await expect(page.locator('input[name="fullname"]')).toHaveCount(0);
    }
  });

});
