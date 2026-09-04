/**
 * General Voucher — Payee combobox (manual payee entry)
 *
 * Guards the change that replaced the read-only Payee input + "Select" modal
 * with a searchable creatable combobox, after Accounting reported they could not
 * file a voucher for a payee that was not already a vendor.
 *
 * Two groups:
 *   READ-ONLY  — safe to run any time. Proves the control lists every payee
 *                without choosing a category, surfaces near-matches, and
 *                suppresses the "Add new payee" row on an existing name.
 *   WRITES DB  — creates a vendor row and a balanced Check Voucher. Run only
 *                against a local/dev database. Skipped unless
 *                PAYEE_E2E_WRITE=1 is set.
 *
 * Credentials come from E2E_EMAIL / E2E_PASSWORD (no hardcoded logins — the
 * suite's stored ones are stale).
 *
 * Prereqs: frontend on :3000, backend on :8080.
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';
const ALLOW_WRITES = process.env.PAYEE_E2E_WRITE === '1';

/**
 * The shared uiLogin helper cannot be used: a global `fixed inset-0 z-9999`
 * spinner sits over the sign-in page long enough to intercept the submit click.
 * Wait it out, then submit — clicking only once the overlay is gone.
 */
async function login(page: Page) {
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 30_000 });
  await page.locator('div.z-9999').first().waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('/auth/signin'), { timeout: 60_000 });
  await page.waitForTimeout(2_000);
}

/** Open General Voucher → New CV and return the payee combobox input. */
async function openNewCv(page: Page) {
  await page.goto('/accounting/general-voucher', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'New CV' }).click();
  const payeeInput = page.locator('#vendor_id');
  await expect(payeeInput, 'payee combobox must render').toBeVisible({ timeout: 30_000 });
  return payeeInput;
}

const menuOptions = (page: Page) => page.locator('[class*="react-select__option"]');

test.describe('General Voucher — payee combobox', () => {
  test.setTimeout(180_000);

  test.beforeEach(async () => {
    test.skip(!EMAIL || !PASSWORD, 'set E2E_EMAIL and E2E_PASSWORD to run');
  });

  test('lists every payee without choosing a category first', async ({ page }) => {
    await login(page);
    const payee = await openNewCv(page);

    // THE regression this change exists for: previously the picker showed
    // nothing until one of six vendor categories was guessed.
    await payee.click();
    await expect(menuOptions(page).first()).toBeVisible({ timeout: 30_000 });
    const count = await menuOptions(page).count();
    expect(count, 'payees must be listed with no category chosen').toBeGreaterThan(1);
  });

  test('surfaces existing near-matches before offering to create', async ({ page }) => {
    await login(page);
    const payee = await openNewCv(page);

    await payee.click();
    await payee.fill('telab');
    await expect(menuOptions(page).first()).toBeVisible({ timeout: 20_000 });
    const texts = (await menuOptions(page).allTextContents()).join(' | ');
    // The anti-duplication affordance: the four FLC-TELABASTAGAN rows and
    // friends must be visible above any "Add new payee" row.
    expect(texts.toUpperCase(), `expected existing TELAB* payees, got: ${texts}`).toContain('TELAB');
  });

  test('does NOT offer to create a payee that already exists', async ({ page }) => {
    await login(page);
    const payee = await openNewCv(page);
    await payee.click();

    // Case and stray whitespace must all suppress the create row — the vendors
    // table has no unique index, so this client-side guard is the only one.
    for (const typed of ['FLC', 'flc', 'FLC ']) {
      await payee.fill(typed);
      await page.waitForTimeout(600);
      const texts = (await menuOptions(page).allTextContents()).join(' | ');
      // Assert the menu is POPULATED first. Without this the negative check below
      // passes vacuously when the payee list failed to load — which is exactly the
      // state in which the duplicate guard is broken, so the test would go green
      // on the one failure it exists to catch.
      expect(texts, `"${typed}" must match the existing FLC payee`).toContain('FLC');
      expect(texts, `"${typed}" must not offer a duplicate create`).not.toContain('Add new payee');
    }
  });

  test('offers to create a payee that does not exist', async ({ page }) => {
    await login(page);
    const payee = await openNewCv(page);

    await payee.click();
    await payee.fill('TELABASTAGAN - ANGELES ALLIANCE');
    await expect(
      page.locator('[class*="react-select__option"]', { hasText: 'Add new payee' }),
      'a brand-new payee name must offer an inline create',
    ).toBeVisible({ timeout: 20_000 });
  });

  test('WRITES DB: creates a payee inline without losing the voucher draft', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'set PAYEE_E2E_WRITE=1 to allow database writes');
    await login(page);
    const payee = await openNewCv(page);

    // Fill the rest of the voucher FIRST — the whole point is that creating a
    // payee no longer destroys a half-typed draft.
    await page.locator('#journal_date').fill('2026-09-04');
    await page.locator('#check_no').fill('E2E-DRAFT-CHECK');
    await page.locator('#journal_desc').fill('E2E PAYEE DRAFT SURVIVAL');

    const newName = `ZZ E2E PAYEE ${Date.now()}`;
    await payee.click();
    await payee.fill(newName);
    await page.locator('[class*="react-select__option"]', { hasText: 'Add new payee' }).click();

    // The form must still be mounted with every field intact — no route change.
    await expect(page.locator('#journal_desc')).toHaveValue('E2E PAYEE DRAFT SURVIVAL', { timeout: 30_000 });
    await expect(page.locator('#check_no')).toHaveValue('E2E-DRAFT-CHECK');
    await expect(page.locator('#journal_date')).toHaveValue('2026-09-04');
    await expect(page.getByText(newName).first()).toBeVisible();
  });

  test('the category picker still works as a secondary path', async ({ page }) => {
    await login(page);
    await openNewCv(page);

    await page.getByRole('button', { name: /browse by category/i }).click();
    await expect(
      page.getByPlaceholder(/search payee/i),
      'the old picker must still open',
    ).toBeVisible({ timeout: 20_000 });
  });
});
