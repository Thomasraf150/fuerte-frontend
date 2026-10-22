/**
 * Borrower → Loans → Add Loans, the Branch dropdown (found 2026-10-21 while sweeping for the
 * Voucher Details clip). The form sits in BorrowerInfo's `overflow-clip` card with only the Loan
 * Product and Loan Amount fields and the save bar below the Branch field, so with eight or more
 * branches the bottom of the menu was cut off by the card, and the sticky save bar (z-20) drew
 * over its middle. The menu now renders on the page body, as Loan Product's already did.
 *
 * NO CREDENTIALS AND NO BACKEND: ../26-new-application/borrowerFormHarness.ts. Fictional people only.
 */
import type { Locator, Page } from '@playwright/test';
import { expect, signedInAs, test, type FakeBackend } from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

const BORROWER_ID = 8812;
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** Twelve sub-branches, all assigned: more than the menu's 300px holds. */
const BRANCHES = Array.from({ length: 12 }, (_, i) => ({
  id: String(9601 + i), branch_id: 96, code: `E2E-${i + 1}`, name: `E2E Sub-branch ${String(i + 1).padStart(2, '0')}`, address: `${i + 1} Sample Street`,
}));

/** getBorrower's answer: a fictional borrower with no decision, on the first sub-branch. */
const BORROWER = {
  id: String(BORROWER_ID), payer_standing: 'NONE', decision: null, user_id: 90001, chief_id: 9201,
  amount_applied: '15000', purpose: 'Store capital', firstname: 'MARISOL', middlename: 'DELA', lastname: 'FICTIONAL',
  terms_of_payment: '12 months', residence_address: '9 SAMPLE ST., SAMPLE CITY', is_rent: false, other_source_of_inc: '',
  est_monthly_fam_inc: '20000', employment_position: 'Teacher I', gender: 'Female', photo: null, is_deleted: 0,
  chief: { id: '9201', name: 'E2E Chief One' },
  borrower_details: { id: '1', dob: '1988-03-02', place_of_birth: 'Sample City', age: 38, email: 'e2e.marisol@example.test', contact_no: '09170000051', civil_status: 'Single' },
  borrower_spouse_details: { work_address: '', occupation: '', fullname: '', company: '', dept_branch: '', length_of_service: '', salary: '', company_contact_person: '', contact_no: '' },
  borrower_work_background: {
    id: '1', company_borrower_id: 9301, employment_number: 'E2E-0051', area_id: 9401, sub_area_id: 9501, station: 'Sample School',
    term_in_service: '5 years', employment_status: 'Permanent', division: 'Sample Division', monthly_gross: '26000', monthly_net: '20000',
    office_address: '12 Sample Avenue',
    area: { id: '9401', name: 'E2E Area With Sub-areas', branch_sub_id: 9601, branch_sub: { id: '9601', branch_id: 96, name: BRANCHES[0].name } },
  },
  borrower_company_info: { id: '1', employer: 'E2E Employer', salary: '26000', contract_duration: 'Permanent' },
  borrower_reference: [
    { id: '1', occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000061' },
    { id: '2', occupation: 'Co-worker', name: 'E2E Reference Two', contact_no: '09170000062' },
  ],
  user: { id: 90001, name: 'E2E Admin', branchSub: { id: '9601', name: BRANCHES[0].name, branch_id: 96 } },
  branch_sub: { name: BRANCHES[0].name, branch: { name: 'E2E Branch FB' } },
};

/** True when `target` shows at least four branches and its top, middle and bottom all receive clicks: nothing clips or covers it. */
const unclipped = (target: Locator) =>
  target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.height >= 180 && [r.top + 4, r.top + r.height / 2, r.bottom - 4].every((y) => {
      const hit = document.elementFromPoint(r.left + r.width / 2, y);
      return !!hit && el.contains(hit);
    });
  });

/** Opens the borrower's Loans tab, then Add Loans, and returns the Branch combobox. */
async function openAddLoans(page: Page, backend: FakeBackend): Promise<Locator> {
  backend.extraGraphql.set('getBorrower', () => ({ data: { getBorrower: BORROWER } }));
  backend.extraGraphql.set('getLoans', () => ({ data: { getLoans: { data: [] } } }));
  backend.extraGraphql.set('getBranchSub', () => ({ data: { getBranchSub: [] } }));
  backend.extraGraphql.set('getLoanProducts', () => ({ data: { getLoanProducts: { data: [] } } }));
  backend.extraGraphql.set('getMyAccessibleBranchSubs', () => ({ data: { getMyAccessibleBranchSubs: BRANCHES } }));
  for (const pattern of ['http://localhost:8080/storage/**', 'http://localhost:3000/storage/**']) {
    await page.route(pattern, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG }));
  }
  await signedInAs(page, backend, BRANCHES.map((b) => Number(b.id)));
  await page.goto(`/borrowers/${BORROWER_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.locator('input[name="firstname"]')).toHaveValue('MARISOL', { timeout: 120_000 });
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0);
  await page.getByRole('button', { name: 'Loans', exact: true }).click();
  await page.getByRole('button', { name: 'Add Loans' }).click();
  const branch = page.locator('form').filter({ hasText: 'Loan Product' }).locator('.react-select__control').first();
  await expect(branch).toBeVisible({ timeout: 60_000 });
  return branch;
}

test('Add Loans: the Branch menu shows whole, above the card edge and the save bar', async ({ page, backend }) => {
  const branch = await openAddLoans(page, backend);
  await branch.click();
  const list = page.locator('.react-select__menu-list');
  await expect(list).toBeVisible();
  expect(await unclipped(list), 'whole Branch menu receives clicks').toBe(true);

  // The wheel scrolls the menu to the last branch, and choosing it fills the field.
  await list.hover();
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => list.evaluate((el) => el.scrollTop), { message: 'menu scrolled by the wheel' }).toBeGreaterThan(0);
  await page.getByText(BRANCHES[11].name, { exact: true }).click();
  await expect(branch).toContainText(BRANCHES[11].name);
});

test('360px: the Branch menu still shows whole', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  const branch = await openAddLoans(page, backend);
  await branch.click();
  const list = page.locator('.react-select__menu-list');
  await expect(list).toBeVisible();
  expect(await unclipped(list), 'whole Branch menu receives clicks').toBe(true);
});
