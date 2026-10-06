/**
 * Applicant funnel (spec docs/superpowers/specs/2026-10-05-applicant-funnel-design.md, part 1): the
 * loan steps a rejected borrower is refused. The server's guard answers in the payload,
 * `{ success: false, message }`, not with `errors`, so the page must read the payload: the refusal
 * is an error toast with the server's sentence, and there is no success toast.
 *
 *   1. Approve (Set Effectivity/Maturity, saveLoanSchedule).
 *   2. Release (Approve and Release, saveReleaseLoan): never "Loan released successfully.".
 *
 * NO CREDENTIALS AND NO BACKEND: see ../26-new-application/borrowerFormHarness.ts. Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/30-applicant-funnel --reporter=list
 */
import type { Page } from '@playwright/test';
import { expect, signedInAs, test, type FakeBackend } from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

const LOAN_ID = 7701;
const REFUSED = 'This borrower was rejected on Oct 5, 2026: E2E: may utang sa ibang lending. Approve them first to continue.';

/** getLoan's answer: a fictional loan on the user's sub-branch, at the step the test needs. */
const loan = (over: Record<string, unknown> = {}) => ({
  id: String(LOAN_ID), loan_ref: 'E2E-LN-0001', loan_proceeds: '9000.00', pn_amount: '12000.00', monthly: '1000.00', term: 12,
  status: 0, pn_balance: '12000.00', udi_balance: '1200.00', created_at: '2026-10-05 09:00:00', approved_date: null,
  released_date: null, is_pn_signed: 0, bank_id: null, check_no: null,
  addon_terms: 0, addon_amount: '0.00', addon_udi: '0.00', addon_total: '0.00',
  loan_product: {
    id: '9601', description: 'E2E Salary Loan', terms: 12, interest_rate: '2.00', udi: '1200.00', processing: '0.00',
    agent_fee: '0.00', insurance: '0.00', commission: '0.00', collection: '0.00', notarial: '0.00',
  },
  loan_details: [{ id: '1', description: 'udi', debit: '0.00', credit: '1200.00' }],
  loan_schedules: [],
  loan_udi_schedules: [],
  borrower: { id: '8811', firstname: 'ROSARIO', middlename: 'LIM', lastname: 'BAUTISTA' },
  loan_bank_details: null,
  acctg_entry: null,
  branch_sub: { id: '9101', name: 'E2E Sub-branch A', branch: { name: 'E2E Branch FB' } },
  user: { branch_sub_id: 9101 },
  ...over,
});

const SCHEDULED = { loan_schedules: [{ id: '1', amount: '12000.00', due_date: '2026-11-15' }], loan_udi_schedules: [{ id: '1', amount: '1200.00', due_date: '2026-11-15' }] };

async function openLoan(page: Page, backend: FakeBackend, over: Record<string, unknown>): Promise<void> {
  backend.extraGraphql.set('getLoan', () => ({ data: { getLoan: loan(over) } }));
  backend.extraGraphql.set('getBanks', () => ({ data: { getBanks: { data: [{ id: '9701', name: 'E2E Bank One' }] } } }));
  // What the loan page's tabs load beside the loan: empty lists.
  backend.extraGraphql.set('getAllBranch', () => ({ data: { getAllBranch: [] } }));
  backend.extraGraphql.set('getChartOfAccounts', () => ({ data: { getChartOfAccounts: [] } }));
  backend.extraGraphql.set('getLoans', () => ({ data: { getLoans: { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false } } } }));
  backend.extraGraphql.set('getLoanProducts', () => ({ data: { getLoanProducts: { data: [] } } }));
  await signedInAs(page, backend, [9101]);
  await page.goto(`/loans-list/${LOAN_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('button', { name: 'Set Effectivity/Maturity' })).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0);
}

const toast = (page: Page, text: string) => page.locator('.Toastify__toast').filter({ hasText: text });

test('Approve: a refused saveLoanSchedule is an error toast with the server\'s sentence, never "Loan Schedule Saved!"', async ({ page, backend }) => {
  backend.extraGraphql.set('saveLoanSchedule', () => ({ data: { saveLoanSchedule: { success: false, message: REFUSED } } }));
  await openLoan(page, backend, {});

  await page.getByRole('button', { name: 'Set Effectivity/Maturity' }).click();
  await page.locator('#manual_date').check();
  await page.getByPlaceholder('0').fill('1');
  // The manual-date box re-lays itself out while it waits, so Playwright never sees the button "stable": click it directly.
  await page.getByRole('button', { name: 'Generate' }).dispatchEvent('click');
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByRole('button', { name: 'Yes it is!' }).click();

  await expect(toast(page, REFUSED)).toBeVisible();
  await expect(page.locator('.Toastify__toast--error').filter({ hasText: REFUSED })).toHaveCount(1);
  await expect(toast(page, 'Loan Schedule Saved!')).toHaveCount(0);
  expect(backend.calls('saveLoanSchedule')).toHaveLength(1);
});

test('Release: a refused saveReleaseLoan is an error toast with the server\'s sentence, never "Loan released successfully."', async ({ page, backend }) => {
  backend.extraGraphql.set('saveReleaseLoan', () => ({
    data: { saveReleaseLoan: { success: false, message: REFUSED, auto_posted: false, unmapped: [] } },
  }));
  await openLoan(page, backend, { ...SCHEDULED, status: 2, is_pn_signed: 1, bank_id: 9701, check_no: 'E2E-0001' });

  await page.getByRole('button', { name: 'Approve and Release' }).click();
  await page.getByTestId('release-loans-section').locator('button[type="submit"]').click();
  await page.getByRole('button', { name: 'Yes it is!' }).click();

  await expect(toast(page, REFUSED)).toBeVisible();
  await expect(page.locator('.Toastify__toast--error').filter({ hasText: REFUSED })).toHaveCount(1);
  await expect(toast(page, 'Loan released')).toHaveCount(0);
  expect(backend.calls('saveReleaseLoan')).toHaveLength(1);
});
