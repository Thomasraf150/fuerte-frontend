/**
 * Borrower page: a saved borrower's form opens only once BOTH the picklists and the borrower
 * have loaded (Rafael, 2026-10-13).
 *
 * The bug: the page loaded the picklists (chiefs, areas, companies, branches) and the borrower
 * side by side under one `loading` flag, and whichever finished first cleared it. When the
 * picklists won, a saved borrower's form opened in Create shape ("Check for Existing Borrower",
 * the multi-branch picker on its home branch) and anything typed then was overwritten when the
 * borrower landed. A borrower that failed to load showed the empty Create form until the error.
 *
 * The record is held back here until the picklists have answered, so the order is set by the
 * test. A MutationObserver records whether the Create shape was EVER on screen, so a brief
 * flash fails the test too. Fictional people only. NO CREDENTIALS AND NO BACKEND: see
 * ../26-new-application/borrowerFormHarness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/borrower-page-waits.spec.ts --reporter=line --workers=1
 */
import { Page } from '@playwright/test';
import { expect, FakeBackend, signedInAs, test } from '../26-new-application/borrowerFormHarness';
import { Gate, sleep } from './harness';

test.setTimeout(180_000);

const BORROWER_ID = 8803;
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** getBorrower's answer: the fields the form and the header read. */
const BORROWER = {
  id: String(BORROWER_ID), payer_standing: 'GOOD', decision: null, user_id: 90001, chief_id: 9202,
  amount_applied: '15000', purpose: 'Store capital', firstname: 'MARIA', middlename: 'REYES', lastname: 'SANTOS',
  terms_of_payment: '12 months', residence_address: '1 Sample St', is_rent: false, other_source_of_inc: 'None',
  est_monthly_fam_inc: '25000', employment_position: 'Teacher I', gender: 'Female', photo: null, is_deleted: 0,
  chief: { id: '9202', name: 'E2E Chief Two' },
  borrower_details: { id: '1', dob: '1990-01-15', place_of_birth: 'Sample City', age: 36, email: 'e2e.maria@example.test', contact_no: '09170000031', civil_status: 'Widowed' },
  borrower_spouse_details: { work_address: '', occupation: '', fullname: '', company: '', dept_branch: '', length_of_service: '', salary: '', company_contact_person: '', contact_no: '' },
  borrower_work_background: {
    id: '1', company_borrower_id: 9302, employment_number: 'E2E-0031', area_id: 9401, sub_area_id: 9502,
    station: 'Sample School', term_in_service: '8 years', employment_status: 'Agency', division: 'Sample Division',
    monthly_gross: '28000', monthly_net: '21000', office_address: '12 Sample Avenue',
    area: { id: '9401', name: 'E2E Area With Sub-areas', branch_sub_id: 9101, branch_sub: { id: '9101', branch_id: 91, name: 'E2E Sub-branch A' } },
  },
  borrower_company_info: { id: '1', employer: 'E2E Employer', salary: '28000', contract_duration: 'Permanent' },
  borrower_reference: [],
  user: { id: 90001, name: 'E2E Admin', branchSub: { id: '9101', name: 'E2E Sub-branch A', branch_id: 91 } },
  branch_sub: { name: 'E2E Sub-branch A', branch: { name: 'E2E Branch FB' } },
};

const PICKLISTS = ['getChief', 'getAreas', 'getBorrCompanies', 'getMyAccessibleBranchSubs'];

/** Records, from the first paint, whether the Create shape of the form was ever on screen. */
async function watchForCreateShape(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __createShapeSeen?: string };
    const check = () => {
      if (w.__createShapeSeen) return;
      if ((document.body?.textContent ?? '').includes('Check for Existing Borrower')) w.__createShapeSeen = 'title';
      else if (document.querySelector('[data-testid="borrower-branch-picker"]')) w.__createShapeSeen = 'branch picker';
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, characterData: true });
  });
}

const createShapeSeen = (page: Page) =>
  page.evaluate(() => (window as unknown as { __createShapeSeen?: string }).__createShapeSeen ?? null);

/** Open the page with the borrower held, and wait until every picklist has answered. */
async function openWithBorrowerHeld(page: Page, backend: FakeBackend, gate: Gate, answer: () => unknown) {
  backend.extraGraphql.set('getBorrower', async () => {
    await gate.opened;
    return { data: { getBorrower: answer() } };
  });
  // The header asks for the borrower's photo: a blank image, as borrower-details.spec.ts serves.
  for (const pattern of ['http://localhost:8080/storage/**', 'http://localhost:3000/storage/**']) {
    await page.route(pattern, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG }));
  }
  // Assigned to two sub-branches: on the Create shape, the branch picker shows.
  await signedInAs(page, backend, [9101, 9102]);
  await watchForCreateShape(page);
  await page.goto(`/borrowers/${BORROWER_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect.poll(() => PICKLISTS.filter((field) => backend.calls(field).length === 0), { timeout: 120_000 }).toEqual([]);
  await expect.poll(() => backend.calls('getBorrower').length).toBeGreaterThan(0);
  // The picklists have answered; give React ample time to render whatever it would.
  await sleep(2_000);
}

test('a saved borrower never shows the Create form while the borrower is still loading', async ({ page, backend }) => {
  const gate = new Gate(false);
  await openWithBorrowerHeld(page, backend, gate, () => BORROWER);

  // Still loading: no form at all, in either shape.
  expect(await createShapeSeen(page)).toBeNull();
  await expect(page.locator('input[name="firstname"]')).toHaveCount(0);

  gate.open();
  const form = page.locator('form:has(input[name="firstname"])');
  await expect(form.locator('input[name="firstname"]')).toHaveValue('MARIA', { timeout: 60_000 });
  await expect(page.getByText('Name & Contact', { exact: true })).toBeVisible();
  await expect(page.getByText('Check for Existing Borrower')).toHaveCount(0);
  await expect(page.getByTestId('borrower-branch-picker')).toHaveCount(0);
  expect(await createShapeSeen(page)).toBeNull();
});

test('a borrower that fails to load shows the error, never the empty Create form', async ({ page, backend }) => {
  const gate = new Gate(false);
  await openWithBorrowerHeld(page, backend, gate, () => null);

  expect(await createShapeSeen(page)).toBeNull();
  await expect(page.locator('input[name="firstname"]')).toHaveCount(0);

  gate.open();
  await expect(page.getByRole('button', { name: 'Back to Borrowers List' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Borrower not found')).toBeVisible();
  await expect(page.locator('input[name="firstname"]')).toHaveCount(0);
  expect(await createShapeSeen(page)).toBeNull();
});
