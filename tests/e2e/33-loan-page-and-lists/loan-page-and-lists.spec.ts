/**
 * The 2026-10-09 round (commit d19c60d + the 2026-10-10 security pass), through the stubbed harness:
 *   1. The loan page opens the step to do next; a released loan opens on nothing.
 *   2. Loan page More ▾ → Delete loan: offered exactly when the Loans list offers Remove; a pending
 *      request shows on the menu; the prompt says only the owner deletes immediately.
 *   3. Step 3 Bank Details: pre-filled from the previous loan (never PINs) or the borrower's name;
 *      browser autofill switched off (it filled staff login emails into Account Name).
 *   4. Collection List: Borrower first, "Loan Product", the search says what it searches; the entry
 *      page names the borrower.
 *   5. The sidebar's Approvals item carries the count waiting for the user's decision.
 * Visual-only changes (Compute skeleton, ₱ position on error) are in the manual test run.
 *
 * NO CREDENTIALS AND NO BACKEND: see ../26-new-application/borrowerFormHarness.ts. Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/33-loan-page-and-lists --reporter=list
 */
import type { Page } from '@playwright/test';
import { expect, signedInAs, test, type FakeBackend } from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

const LOAN_ID = 7701;
const SCHEDULED = {
  loan_schedules: [{ id: '1', amount: '5000.00', due_date: '2026-11-15' }],
  loan_udi_schedules: [{ id: '1', amount: '800.00', due_date: '2026-11-15' }],
};

const loan = (over: Record<string, unknown> = {}) => ({
  id: String(LOAN_ID), loan_ref: null, loan_proceeds: '17500.00', pn_amount: '20000.00', monthly: '5000.00', term: 4,
  status: 0, is_closed: '0', pn_balance: '20000.00', udi_balance: '3200.00', created_at: '2026-10-09 10:00:00', approved_date: null,
  released_date: null, is_pn_signed: 0, bank_id: null, check_no: null,
  addon_terms: 0, addon_amount: '0.00', addon_udi: '0.00', addon_total: '0.00',
  loan_product: { id: '9601', description: 'E2E PRIVATE 4MONTHS - 16%', terms: 4, interest_rate: '4.00', udi: '3200.00', processing: '0.00', agent_fee: '0.00', insurance: '0.00', commission: '0.00', collection: '0.00', notarial: '0.00' },
  loan_details: [], loan_schedules: [], loan_udi_schedules: [],
  borrower: { id: '8811', firstname: 'ROSARIO', middlename: 'LIM', lastname: 'BAUTISTA' },
  loan_bank_details: null, previous_bank_details: null, acctg_entry: null,
  branch_sub: { id: '9101', name: 'E2E Sub-branch A', branch: { name: 'E2E Branch FA' } },
  user: { branch_sub_id: 9101 },
  ...over,
});

function loanPageStubs(backend: FakeBackend, over: Record<string, unknown>, pending = false): void {
  backend.extraGraphql.set('getLoan', () => ({ data: { getLoan: loan(over) } }));
  backend.extraGraphql.set('getBanks', () => ({ data: { getBanks: { data: [{ id: '9701', name: 'E2E Bank One' }, { id: '9702', name: 'E2E Bank Two' }] } } }));
  backend.extraGraphql.set('getAllBranch', () => ({ data: { getAllBranch: [] } }));
  backend.extraGraphql.set('getChartOfAccounts', () => ({ data: { getChartOfAccounts: [] } }));
  backend.extraGraphql.set('getLoans', () => ({ data: { getLoans: { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false } } } }));
  backend.extraGraphql.set('getLoanProducts', () => ({ data: { getLoanProducts: { data: [] } } }));
  backend.extraGraphql.set('getLoanHistory', () => ({ data: { getLoanHistory: [] } }));
  backend.extraGraphql.set('pendingDeletionsForEntities', () => ({
    data: {
      pendingDeletionsForEntities: pending
        ? [{ request_id: '55', entity_type: 'loan', entity_id: LOAN_ID, requested_by_user_id: 1, requested_by_name: 'E2E Processing', reason: 'E2E reason', created_at: '2026-10-09 11:00:00', is_mine: true }]
        : [],
    },
  }));
}

async function openLoan(page: Page, backend: FakeBackend, over: Record<string, unknown> = {}, pending = false): Promise<void> {
  loanPageStubs(backend, over, pending);
  await signedInAs(page, backend, [9101]);
  await page.goto(`/loans-list/${LOAN_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('button', { name: /Set Effectivity\/Maturity/ })).toBeVisible({ timeout: 120_000 });
}

const currentStep = (page: Page) => page.locator('button[aria-current="step"]');

test.describe('1. the loan page opens the next step', () => {
  test('a new loan opens on Step 1', async ({ page, backend }) => {
    await openLoan(page, backend);
    await expect(currentStep(page)).toHaveText(/Set Effectivity\/Maturity/);
  });

  test('a scheduled, signed loan opens on Step 3 Bank Details Entry', async ({ page, backend }) => {
    await openLoan(page, backend, { ...SCHEDULED, status: 1, is_pn_signed: 1 });
    await expect(currentStep(page)).toHaveText(/Bank Details Entry/);
  });

  // 56 released loans carry is_pn_signed = 0; they must not open on PN Signing.
  test('a released loan opens on nothing, even with the PN flag unset', async ({ page, backend }) => {
    await openLoan(page, backend, { ...SCHEDULED, status: 3, is_pn_signed: 0, loan_ref: 'E2E-0001', acctg_entry: { id: '1' } });
    await page.waitForTimeout(500);
    await expect(currentStep(page)).toHaveCount(0);
  });
});

test.describe('2. delete on the loan page', () => {
  const more = (page: Page) => page.locator('summary', { hasText: 'More' });

  test('More → Delete loan, and the prompt says only the owner deletes immediately', async ({ page, backend }) => {
    await openLoan(page, backend);
    await more(page).click();
    await page.getByRole('button', { name: /Delete loan/ }).click();
    await expect(page.getByText('Delete this loan?')).toBeVisible();
    await expect(page.getByText('If you are the owner, this happens immediately.')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(backend.calls('removeLoans')).toHaveLength(0);
  });

  test('a loan posted to accounting offers no Delete (as the list offers no Remove)', async ({ page, backend }) => {
    await openLoan(page, backend, { ...SCHEDULED, status: 3, is_pn_signed: 1, acctg_entry: { id: '1' }, loan_ref: 'E2E-0001' });
    await expect(more(page)).toHaveCount(0);
  });

  test('a pending request shows on the menu, and Delete opens "already in the queue" instead of a new request', async ({ page, backend }) => {
    await openLoan(page, backend, {}, true);
    await expect(page.locator('summary[aria-label="More actions (deletion pending)"]')).toBeVisible();
    await more(page).click();
    await expect(page.getByText('Already in the deletion queue')).toBeVisible();
    await page.getByRole('button', { name: /Delete loan/ }).click();
    await expect(page.getByText('E2E reason')).toBeVisible();
    expect(backend.calls('removeLoans')).toHaveLength(0);
  });
});

test.describe('3. Step 3 Bank Details pre-fill and autofill', () => {
  const step3 = { ...SCHEDULED, status: 1, is_pn_signed: 1 };

  test('a repeat borrower starts from the previous loan, never its PINs', async ({ page, backend }) => {
    await openLoan(page, backend, {
      ...step3,
      previous_bank_details: { loan_ref: 'E2E-0480', account_name: 'BAUTISTA ROSARIO L', surrendered_bank_id: '9701', issued_bank_id: '9702', surrendered_acct_no: '1111222233334444', issued_acct_no: '5555666677778888' },
    });
    const name = page.locator('#account_name');
    await expect(name).toHaveValue('BAUTISTA ROSARIO L');
    await expect(page.getByText('Filled in from loan E2E-0480.')).toBeVisible();
    await expect(page.locator('#surrendered_acct_no')).toHaveValue('1111222233334444');
    await expect(page.locator('#issued_acct_no')).toHaveValue('5555666677778888');
    for (const pin of await page.locator('input[name$="_pin"]').all()) await expect(pin).toHaveValue('');
  });

  test('a first loan starts from the borrower\'s name; autofill is off on name, card and PIN boxes', async ({ page, backend }) => {
    await openLoan(page, backend, step3);
    const name = page.locator('#account_name');
    await expect(name).toHaveValue('ROSARIO BAUTISTA');
    await expect(page.getByText("Filled in with the borrower's name.")).toBeVisible();
    await expect(name).toHaveAttribute('autocomplete', 'off');
    await expect(page.locator('#surrendered_acct_no')).toHaveAttribute('autocomplete', 'off');
    for (const pin of await page.locator('input[name$="_pin"]').all()) await expect(pin).toHaveAttribute('autocomplete', 'new-password');
    // The label is a real <label for>, so the name box has an accessible name.
    await expect(page.getByLabel('Account Name')).toHaveValue('ROSARIO BAUTISTA');
  });

  test('saved bank details are shown as saved, with no pre-fill note', async ({ page, backend }) => {
    await openLoan(page, backend, {
      ...step3,
      loan_bank_details: { id: '3', loan_id: LOAN_ID, account_name: 'SAVED NAME', surrendered_bank_id: '9701', issued_bank_id: '9701', surrendered_acct_no: '000000', issued_acct_no: '000000', created_at: '2026-10-09 10:00:00', updated_at: '2026-10-09 10:00:00' },
      previous_bank_details: null,
    });
    await page.getByRole('button', { name: /Bank Details Entry/ }).click();
    await expect(page.locator('#account_name')).toHaveValue('SAVED NAME');
    await expect(page.getByText(/^Filled in/)).toHaveCount(0);
  });
});

test.describe('4. Collection List names the borrower', () => {
  const rows = [
    { loan_id: '7701', description: 'E2E PRIVATE 4MONTHS - 16%', loan_schedule_id: '124540', due_date: '2026-10-15', trans_date: '2026-10-09', loan_ref: 'E2E-0512', journal_ref: 'CRJ-E2E-1', borrower_name: 'BAUTISTA, ROSARIO' },
  ];

  test('Borrower is the first column; Loan Product; the search says what it searches and sends the words', async ({ page, backend }) => {
    backend.extraGraphql.set('getCollectionLists', () => ({ data: { getCollectionLists: { data: rows, paginatorInfo: { total: 1, currentPage: 1, lastPage: 1, hasMorePages: false } } } }));
    await page.setViewportSize({ width: 1280, height: 900 });
    await signedInAs(page, backend, [9101]);
    await page.goto('/collection-list', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.locator('.rdt_TableCol').first()).toHaveText(/Borrower/i, { timeout: 120_000 });
    await expect(page.locator('.rdt_TableCol', { hasText: /Loan Product/i })).toHaveCount(1);
    await expect(page.locator('.rdt_TableCol', { hasText: /^Description$/i })).toHaveCount(0);
    await expect(page.locator('.rdt_TableCell').first()).toHaveText('BAUTISTA, ROSARIO');

    const search = page.getByPlaceholder('Search by borrower name or loan ref');
    await search.fill('BAUTISTA, ROSARIO');
    await expect.poll(() => backend.calls('getCollectionLists').some((c) => c.variables.search === 'BAUTISTA, ROSARIO'), { timeout: 30_000 }).toBe(true);
  });

  test('the entry page leads with the borrower', async ({ page, backend }) => {
    backend.extraGraphql.set('getCollectionLists', () => ({ data: { getCollectionLists: { data: rows, paginatorInfo: { total: 1, currentPage: 1, lastPage: 1, hasMorePages: false } } } }));
    backend.extraGraphql.set('getCollectionEntry', () => ({
      data: { getCollectionEntry: [{ loan_schedule_id: '124540', loan_udi_schedule_id: null, description: 'Collection', amount: '5000.00', trans_date: '2026-10-09', journal_ref: 'CRJ-E2E-1', account_id: '1', is_deleted: '0', borrower_name: 'BAUTISTA, ROSARIO' }] },
    }));
    await signedInAs(page, backend, [9101]);
    await page.goto('/collection-list/124540?date=2026-10-09&ref=E2E-0512', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.locator('p.font-display', { hasText: 'BAUTISTA, ROSARIO' })).toBeVisible({ timeout: 120_000 });
  });
});

test('5. the sidebar Approvals item shows how many wait for your decision', async ({ page, backend }) => {
  backend.extraGraphql.set('pendingDeletionRequestsForMe', () => ({ data: { pendingDeletionRequestsForMe: [{ id: '1' }, { id: '2' }, { id: '3' }] } }));
  backend.extraGraphql.set('getCollectionLists', () => ({ data: { getCollectionLists: { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false } } } }));
  await page.setViewportSize({ width: 1280, height: 900 });
  await signedInAs(page, backend, [9101]);
  await page.goto('/collection-list', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const approvals = page.locator('aside a[href="/approvals"]');
  await expect(approvals).toContainText('3', { timeout: 120_000 });
  await expect(approvals).toContainText('waiting for your decision');
});
