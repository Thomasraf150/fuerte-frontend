/**
 * A borrower created directly versus one made from Marketing's application (Rafael 2026-10-23):
 * Approve / Reject is for applicants Call Center brought in, so New Borrower first asks whether the
 * person has an open application (findOpenApplicationForApplicant) and offers it.
 *
 *   1. Found, and the user may open it: "Open the application" goes there, and nothing is saved.
 *   2. Found: "Create directly anyway" saves as before (the duplicate check, then saveBorrower).
 *   3. Found, but not the user's to open: no "Open the application"; Back saves nothing.
 *   4. Not found: the save goes on exactly as before.
 *   5. The Borrowers list's Source chips send the source filter, and All sends none.
 *
 * NO CREDENTIALS AND NO BACKEND: see ../26-new-application/borrowerFormHarness.ts. Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/44-direct-vs-application --reporter=list
 */
import type { Locator, Page } from '@playwright/test';
import {
  AREA_WITH_SUB_AREAS,
  expect,
  openNewBorrower,
  saveButton,
  selectControl,
  signedInAs,
  test,
  type FakeBackend,
} from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

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

type Match = { application_id: number; status: string; branch_name: string | null; can_open: boolean };

const MATCH: Match = { application_id: 412, status: 'interviewed', branch_name: 'E2E Sub-branch A', can_open: true };

/**
 * Open a react-select and pick an option. The menu is portaled to <body> (ReactSelect's
 * menuPortalTarget), so the option is found on the page, not inside the form as the harness's
 * pick() looks for it.
 */
async function pick(page: Page, form: Locator, field: string, option: string): Promise<void> {
  await selectControl(form, field).click();
  await page.locator('.react-select__option').filter({ hasText: new RegExp(`^${option}$`) }).click();
}

/** Fill New Borrower with a complete fictional borrower and press Save. */
async function fillAndSave(page: Page, backend: FakeBackend, match: Match | null): Promise<Locator> {
  backend.extraGraphql.set('findOpenApplicationForApplicant', () => ({ data: { findOpenApplicationForApplicant: match } }));
  await signedInAs(page, backend, [9101]);
  const form = await openNewBorrower(page);
  for (const [name, value] of Object.entries(TYPED)) {
    await form.locator(`input[name="${name}"]`).fill(value);
  }
  await form.locator('select[name="gender"]').selectOption('Female');
  await form.locator('select[name="civil_status"]').selectOption('Single');
  await form.locator('select[name="employment_status"]').selectOption('Permanent');
  await pick(page, form, 'chief_id', 'E2E Chief One');
  await pick(page, form, 'company_borrower_id', 'E2E Company One');
  await pick(page, form, 'area_id', AREA_WITH_SUB_AREAS);
  await expect.poll(() => backend.calls('getOneSubArea').length).toBe(1);
  await pick(page, form, 'sub_area_id', 'E2E Sub-area Two');
  await saveButton(form).click();
  return form;
}

const warning = (page: Page): Locator => page.getByRole('dialog').filter({ hasText: 'This person already has an application' });

test('1. found, and the user may open it: "Open the application" goes there and nothing is saved', async ({ page, backend }) => {
  // Where the button leads: the application page asks for its record and the bell; neither matters here.
  backend.extraGraphql.set('getLoanApplication', () => ({ errors: [{ message: 'Application not found.' }] }));
  await fillAndSave(page, backend, MATCH);

  const dialog = warning(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('open-application-facts')).toHaveText('Application #000412 · Interviewed · E2E Sub-branch A');
  await expect(dialog).toContainText('A borrower created directly gets no Approve / Reject.');
  expect(backend.calls('findOpenApplicationForApplicant')[0].variables).toEqual({ firstname: 'Juana', lastname: 'Dela Cruz', contact_no: '09170000011' });
  await dialog.getByRole('button', { name: 'Open the application →' }).click();

  await expect(page).toHaveURL(/\/applications\/412$/, { timeout: 60_000 });
  expect(backend.calls('checkBorrowerDuplicate')).toHaveLength(0);
  expect(backend.calls('saveBorrower')).toHaveLength(0);
});

test('2. found: "Create directly anyway" saves as before, the duplicate check then saveBorrower', async ({ page, backend }) => {
  await fillAndSave(page, backend, MATCH);

  await warning(page).getByRole('button', { name: 'Create directly anyway' }).click();

  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  expect(backend.graphql.map((call) => call.field).filter((field) => ['findOpenApplicationForApplicant', 'checkBorrowerDuplicate', 'saveBorrower'].includes(field)))
    .toEqual(['findOpenApplicationForApplicant', 'checkBorrowerDuplicate', 'saveBorrower']);
  expect(backend.calls('saveBorrower')[0].variables).not.toHaveProperty('application_id');
});

test('3. found, but not the user\'s to open: no "Open the application"; Back saves nothing and keeps the form', async ({ page, backend }) => {
  const form = await fillAndSave(page, backend, { ...MATCH, status: 'for_interview', branch_name: null, can_open: false });

  const dialog = warning(page);
  await expect(dialog.getByTestId('open-application-facts')).toHaveText('Application #000412 · For Interview · not placed on a branch yet');
  await expect(dialog).toContainText('Ask Call Center to create the borrower from it');
  await expect(dialog.getByRole('button', { name: 'Open the application →' })).toBeHidden();
  await dialog.getByRole('button', { name: 'Back' }).click();

  await expect(dialog).toBeHidden();
  await expect(form.locator('input[name="firstname"]')).toHaveValue('Juana');
  expect(backend.calls('checkBorrowerDuplicate')).toHaveLength(0);
  expect(backend.calls('saveBorrower')).toHaveLength(0);
});

test('4. not found: no warning, and the save goes on as before', async ({ page, backend }) => {
  await fillAndSave(page, backend, null);

  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  await expect(warning(page)).toHaveCount(0);
  expect(backend.calls('findOpenApplicationForApplicant')).toHaveLength(1);
  expect(backend.calls('checkBorrowerDuplicate')).toHaveLength(1);
});

test('5. the Borrowers list\'s Source chips send the source filter, and All sends none', async ({ page, backend }) => {
  backend.extraGraphql.set('getBorrowers', () => ({
    data: { getBorrowers: { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, perPage: 20, hasMorePages: false } } },
  }));
  backend.extraGraphql.set('pendingDeletionsForEntities', () => ({ data: { pendingDeletionsForEntities: [] } }));
  await signedInAs(page, backend, [9101]);
  await page.goto('/borrowers', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const chips = page.getByRole('group', { name: 'Filter by source' });
  await expect(chips).toBeVisible({ timeout: 120_000 });
  await expect.poll(() => backend.calls('getBorrowers').length).toBeGreaterThan(0);
  const last = () => backend.calls('getBorrowers').at(-1)?.variables ?? {};
  expect(last()).not.toHaveProperty('source');

  await chips.getByRole('button', { name: 'Created directly' }).click();
  await expect.poll(() => last().source).toBe('DIRECT');
  await expect(chips.getByRole('button', { name: 'Created directly' })).toHaveAttribute('aria-pressed', 'true');

  await chips.getByRole('button', { name: 'From application' }).click();
  await expect.poll(() => last().source).toBe('APPLICATION');

  await chips.getByRole('button', { name: 'All' }).click();
  await expect.poll(() => 'source' in last()).toBe(false);
});
