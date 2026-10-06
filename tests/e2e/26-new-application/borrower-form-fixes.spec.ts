/**
 * Fixes to the borrower Details form (shared by New Borrower and New application),
 * checked on /borrowers/new. New application's side is in new-application.spec.ts.
 *
 *   A. Enter pressed inside Amount Applied For posts the amount on screen. FormInput
 *      used to reach react-hook-form without the field's name, so only leaving the
 *      field stored it, and Enter posted the amount from before.
 *   B. The toast a save fires before it goes back to the list is still on screen on
 *      the list: one ToastContainer in the root layout, not one per page layout.
 *   C. New Borrower's branch picker keeps its placeholder, and its error is drawn in
 *      the danger colour (it used a red-600 class, which this Tailwind build lacks).
 *   D. At 360px every text box and select is 48px or taller, and nothing scrolls
 *      sideways.
 *
 * NO CREDENTIALS AND NO BACKEND: see borrowerFormHarness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/26-new-application --reporter=line
 */
import type { Locator, Page } from '@playwright/test';
import {
  AREA_WITHOUT_SUB_AREAS,
  type FakeBackend,
  expect,
  fieldHeights,
  openNewBorrower,
  pick,
  saveButton,
  sidewaysScroll,
  signedInAs,
  submitAndReadErrors,
  test,
} from './borrowerFormHarness';

test.setTimeout(180_000);

const APP = 'http://localhost:3000';
const ONE_BRANCH = [9101];

/** tailwind.config.ts `danger` (BRAND.danger, #B5372F), as the browser reports it. */
const DANGER = 'rgb(181, 55, 47)';

/** Every text field New Borrower requires, for a fictional borrower. */
const TYPED: Record<string, string> = {
  firstname: 'Juana',
  lastname: 'Dela Cruz',
  contact_no: '09170000011',
  amount_applied: '15000',
  purpose: 'Store capital',
  terms_of_payment: '12 months',
  other_source_of_inc: 'Sari-sari store',
  residence_address: '11 Sample Street, Sample City',
  est_monthly_fam_inc: '25000',
  employment_position: 'Teacher I',
  dob: '1990-01-15',
  place_of_birth: 'Sample City',
  age: '36',
  employment_number: 'E2E-0011',
  station: 'Sample Elementary School',
  term_in_service: '8 years',
  division: 'Sample Division',
  monthly_gross: '28000',
  monthly_net: '21000',
  office_address: '12 Sample Avenue, Sample City',
  'reference.0.name': 'E2E Reference One',
  'reference.0.contact_no': '09170000021',
  'reference.1.name': 'E2E Reference Two',
  'reference.1.contact_no': '09170000022',
  'reference.2.name': 'E2E Reference Three',
  'reference.2.contact_no': '09170000023',
  employer: 'E2E Employer',
  company_salary: '28000',
  contract_duration: 'Permanent',
};

/** Fill in everything New Borrower requires. Each field is left for the next, so the amount is held as "15,000". */
async function fillRequired(form: Locator, backend: FakeBackend): Promise<void> {
  for (const [name, value] of Object.entries(TYPED)) {
    await form.locator(`input[name="${name}"]`).fill(value);
  }
  await form.locator('select[name="gender"]').selectOption('Female');
  await form.locator('select[name="civil_status"]').selectOption('Single');
  await form.locator('select[name="employment_status"]').selectOption('Permanent');
  await pick(form, 'chief_id', 'E2E Chief One');
  await pick(form, 'company_borrower_id', 'E2E Company One');
  await pick(form, 'area_id', AREA_WITHOUT_SUB_AREAS);
  await expect.poll(() => backend.calls('getOneSubArea').length).toBe(1);
  // No sub-areas under that area: Sub Area stops being required once they have loaded.
  await expect(form.locator('label[for="sub_area_id"] span')).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// A. Enter inside the amount
// ---------------------------------------------------------------------------

test('A. Enter pressed inside Amount Applied For posts the amount on screen, not the one from before', async ({ page, backend }) => {
  await signedInAs(page, backend, ONE_BRANCH);
  const form = await openNewBorrower(page);
  await fillRequired(form, backend);

  const amount = form.locator('input[name="amount_applied"]');
  await amount.selectText();
  await amount.pressSequentially('20000');
  await expect(amount).toHaveValue('20,000');
  await expect(amount).toBeFocused();
  await amount.press('Enter');

  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  const info = backend.calls('saveBorrower')[0].variables.inputBorrInfo as Record<string, unknown>;
  expect(info.amount_applied).toBe('20000');
});

/**
 * A stray letter typed before Enter (next to Enter on a phone keyboard) is
 * dropped from the screen, and must be dropped from what is posted too: the
 * form holds what the field shows, never "20000m", which payment posting
 * would read as 0 and silently skip.
 */
test('A2. a stray letter typed before Enter is not posted: the amount on screen is', async ({ page, backend }) => {
  await signedInAs(page, backend, ONE_BRANCH);
  const form = await openNewBorrower(page);
  await fillRequired(form, backend);

  const amount = form.locator('input[name="amount_applied"]');
  await amount.selectText();
  await amount.pressSequentially('20000m');
  await expect(amount).toHaveValue('20,000');
  await amount.press('Enter');

  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  const info = backend.calls('saveBorrower')[0].variables.inputBorrInfo as Record<string, unknown>;
  expect(info.amount_applied).toBe('20000');
});

// ---------------------------------------------------------------------------
// B. A toast outlives the page change that follows it
// ---------------------------------------------------------------------------

const SAVED_TOAST = 'E2E stub: borrower saved.';

/** The Borrowers list, empty: where a saved New Borrower goes back to. */
function stubBorrowerList(backend: FakeBackend): void {
  backend.extraGraphql.set('getBorrowers', () => ({
    data: {
      getBorrowers: {
        data: [],
        paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false, count: 0, perPage: 10 },
      },
    },
  }));
}

/** Open the list and wait for it. The dev server compiles it on the first visit, which can outlast a toast. */
async function openBorrowerList(page: Page): Promise<void> {
  await page.goto('/borrowers', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('heading', { name: 'Borrowers', exact: true, level: 2 })).toBeVisible({ timeout: 90_000 });
}

test('B. the toast of a save that goes back to the list is still on screen on the list, once', async ({ page, backend }) => {
  stubBorrowerList(backend);
  backend.extraGraphql.set('saveBorrower', () => ({ data: { saveBorrower: { success: true, message: SAVED_TOAST } } }));
  await signedInAs(page, backend, ONE_BRANCH);
  await openBorrowerList(page);
  const form = await openNewBorrower(page);
  await fillRequired(form, backend);

  await saveButton(form).click();

  // Hold the toast's 3s timer (pauseOnHover) while the list loads: on the dev server the first
  // move to /borrowers in a freshly loaded page can take longer than the toast lives (measured
  // 3.9s, 2026-10-02). A per-page ToastContainer, the bug this pins, still unmounts it with the page.
  const toast = page.getByRole('alert').filter({ hasText: SAVED_TOAST });
  await toast.hover();
  await expect(page).toHaveURL(`${APP}/borrowers`, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Borrowers', exact: true, level: 2 })).toBeVisible();
  await expect(toast).toBeVisible();
  await expect(toast).toHaveCount(1);
});

// ---------------------------------------------------------------------------
// C. New Borrower's branch picker
// ---------------------------------------------------------------------------

test('C. New Borrower\'s branch picker keeps its placeholder, and its error is in the danger colour', async ({ page, backend }) => {
  // Home branch outside the two assigned: the picker starts empty.
  await signedInAs(page, backend, [9101, 9102], 9103);
  const form = await openNewBorrower(page);
  const picker = form.getByTestId('borrower-branch-picker');

  await expect(picker.locator('.react-select__placeholder')).toHaveText('Select the branch this borrower belongs to...');
  expect((await submitAndReadErrors(form, 'branch_sub_id')).branch_sub_id).toBe('Branch is required');
  const error = picker.locator('p', { hasText: 'Branch is required' });
  expect(await error.evaluate((p) => getComputedStyle(p).color)).toBe(DANGER);
});

// ---------------------------------------------------------------------------
// D. Phones
// ---------------------------------------------------------------------------

test('D. at 360px every text box and select is 48px or taller, and nothing scrolls sideways', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await signedInAs(page, backend, ONE_BRANCH);
  const form = await openNewBorrower(page);

  const fields = await fieldHeights(form);
  expect(fields.length).toBeGreaterThan(30);
  expect(fields.filter(({ height }) => height < 48), 'fields under 48px at 360px').toEqual([]);
  expect(await sidewaysScroll(page), '/borrowers/new scrolled sideways at 360px').toBeLessThanOrEqual(0);
});
