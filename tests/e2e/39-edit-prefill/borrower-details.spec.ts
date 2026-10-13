/**
 * Borrower page, Details tab: a saved borrower opens with every saved dropdown showing.
 *
 * The page loads the borrower and the form's picklists (chiefs, areas, companies) side by
 * side and opens the form as soon as EITHER finishes, so the form can open on the picklists
 * with the borrower still on its way, or the other way round. Both orders are tested.
 * Fictional people only. NO CREDENTIALS AND NO BACKEND: see ../26-new-application/borrowerFormHarness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/borrower-details.spec.ts --reporter=line --workers=1
 */
import { expect, selectedText, signedInAs, test } from '../26-new-application/borrowerFormHarness';
import { Gate } from './harness';

test.setTimeout(180_000);

const BORROWER_ID = 8802;
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** getBorrower's answer. No saved dropdown value is its list's first option. */
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

for (const order of [
  { name: 'the borrower answers first', borrowerFirst: true },
  { name: 'the picklists answer first', borrowerFirst: false },
]) {
  test(`a saved borrower opens with its saved dropdowns (${order.name})`, async ({ page, backend }) => {
    // Whichever answers second waits until the form is on screen with the first.
    const gate = new Gate(false);
    backend.extraGraphql.set('getBorrower', async () => {
      if (!order.borrowerFirst) await gate.opened;
      return { data: { getBorrower: BORROWER } };
    });
    if (order.borrowerFirst) {
      backend.extraGraphql.set('getAreas', async () => {
        await gate.opened;
        return { data: { getAreas: { data: [
          { id: '9401', name: 'E2E Area With Sub-areas', sub_area: [{ id: '9501', name: 'E2E Sub-area One' }, { id: '9502', name: 'E2E Sub-area Two' }] },
          { id: '9402', name: 'E2E Area Without Sub-areas', sub_area: [] },
        ] } } };
      });
    }
    for (const pattern of ['http://localhost:8080/storage/**', 'http://localhost:3000/storage/**']) {
      await page.route(pattern, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG }));
    }
    await signedInAs(page, backend, [9101]);

    await page.goto(`/borrowers/${BORROWER_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const form = page.locator('form:has(input[name="firstname"])');
    await expect(form.locator('input[name="firstname"]')).toBeVisible({ timeout: 120_000 });
    gate.open();
    await expect(form.locator('input[name="firstname"]')).toHaveValue('MARIA');

    // Native selects (fixed options).
    await expect(form.locator('select[name="gender"]')).toHaveValue('Female');
    await expect(form.locator('select[name="civil_status"]')).toHaveValue('Widowed');
    await expect(form.locator('select[name="employment_status"]')).toHaveValue('Agency');
    await expect(form.locator('select[name="is_rent"]')).toHaveValue('0');
    // react-selects (options from the page's picklists).
    await expect.poll(() => selectedText(form, 'chief_id')).toBe('E2E Chief Two');
    await expect.poll(() => selectedText(form, 'company_borrower_id')).toBe('E2E Company Two');
    await expect.poll(() => selectedText(form, 'area_id')).toBe('E2E Area With Sub-areas');
    await expect.poll(() => selectedText(form, 'sub_area_id')).toBe('E2E Sub-area Two');
  });
}
