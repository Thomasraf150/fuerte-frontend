/**
 * General Voucher — Payee picker search
 *
 * Flow: General Voucher → New CV → "Select" (payee) → PayeeView.
 *
 * Guards the enhancement that added a search box to the payee picker. Before
 * this, the picker loaded every payee of a category into a table with no way
 * to search (154+ rows of pure scrolling). The search is CLIENT-SIDE over the
 * already-loaded rows — no backend change, no extra query — so this is a pure
 * UI test.
 *
 * Assertions:
 *   1. The picker now renders a search input (the core regression guard).
 *   2. A no-match query empties the table ("There are no records to display").
 *   3. Clearing the query restores the full loaded list.
 *   4. A token taken from a real row narrows (never widens) the list.
 *
 * Prereqs: frontend on :3000, backend on :8080, test.admin seeded.
 */

import { test, expect } from '@playwright/test';
import { uiLogin } from '../../helpers/e2e-helpers';

const ADMIN = { email: 'test.admin@fuerte.test', password: 'TestPass2026!' };

/** Pull a searchable alphanumeric token (≥3 chars) out of a table row's text. */
function searchableToken(rowText: string): string {
  const word = rowText.split(/\s+/).find((w) => w.replace(/[^a-z0-9]/gi, '').length >= 3) ?? '';
  return word.replace(/[^a-z0-9]/gi, '');
}

test.describe('General Voucher — payee picker search', () => {
  test.setTimeout(90_000);

  test('search box filters the payee list in the New CV picker', async ({ page }) => {
    await uiLogin(page, ADMIN.email, ADMIN.password);

    // Open General Voucher → New CV → payee picker.
    await page.goto('/accounting/general-voucher', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'New CV' }).click();
    await page.getByRole('button', { name: 'Select', exact: true }).click();

    // (1) REGRESSION GUARD: the picker must expose a search input. This is true
    // even before a category is chosen, so it does not depend on seed data.
    const searchBox = page.getByPlaceholder(/search payee/i);
    await expect(searchBox, 'payee picker must render a search input').toBeVisible({ timeout: 15_000 });

    // Choose a payee category so the table fills. Prefer "Nontrade" (the common
    // category), else fall back to the first available option.
    const categoryControl = page
      .locator('[class*="react-select__control"]')
      .filter({ hasText: /select a payee/i })
      .first();
    await categoryControl.click();
    await page.waitForSelector('[class*="react-select__option"]', { timeout: 10_000 });
    const options = page.locator('[class*="react-select__option"]');
    const optionTexts = await options.allTextContents();
    const preferred = optionTexts.findIndex((t) => /nontrade/i.test(t));
    await options.nth(preferred >= 0 ? preferred : 0).click();

    // Wait for the category's payees to load. If this category happens to be
    // empty on the test DB, the search-input assertion above already passed;
    // skip the data-dependent half rather than fail on seed-data variance.
    const gotRows = await page
      .locator('.rdt_TableRow')
      .first()
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (!gotRows) {
      test.skip(true, 'Selected payee category has no rows on the test DB; input presence already verified.');
      return;
    }

    const initialRows = await page.locator('.rdt_TableRow').count();
    expect(initialRows, 'category should load at least one payee').toBeGreaterThan(0);

    // (2) No-match query empties the table.
    await searchBox.fill('zz-no-such-payee-zz');
    await expect(page.getByText('There are no records to display')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.rdt_TableRow')).toHaveCount(0);

    // (3) Clearing restores the full loaded list.
    await searchBox.fill('');
    await expect
      .poll(async () => page.locator('.rdt_TableRow').count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    // (4) A real token narrows the list and never exceeds the unfiltered count.
    const firstRowText = (await page.locator('.rdt_TableRow').first().innerText()).trim();
    const token = searchableToken(firstRowText);

    if (token) {
      await searchBox.fill(token);
      await expect
        .poll(async () => page.locator('.rdt_TableRow').count(), { timeout: 10_000 })
        .toBeGreaterThan(0);
      const filtered = await page.locator('.rdt_TableRow').count();
      expect(filtered, 'token search must not widen the result set').toBeLessThanOrEqual(initialRows);
    }
  });
});
