/**
 * Tab titles (2026-10-10): "{page} · Fuerte Lending" everywhere, record pages named by the record,
 * and the castle favicon. The root layout used to hard-code "Fuerte Lending System", which hid
 * every page's own title. NO CREDENTIALS AND NO BACKEND: ../26-new-application/borrowerFormHarness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/33-loan-page-and-lists/tab-titles.spec.ts --reporter=list
 */
import { expect, signedInAs, test } from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

const empty = { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false } };

const loan = {
  id: '7701', loan_ref: 'MA-0512', loan_proceeds: '17500.00', pn_amount: '20000.00', monthly: '5000.00', term: 4,
  status: 3, is_closed: '0', pn_balance: '20000.00', udi_balance: '3200.00', created_at: '2026-10-09 10:00:00', approved_date: null,
  released_date: '2026-10-09', is_pn_signed: 1, bank_id: null, check_no: null, addon_terms: 0, addon_amount: '0.00', addon_udi: '0.00', addon_total: '0.00',
  loan_product: { id: '9601', description: 'E2E PRIVATE 4MONTHS - 16%', terms: 4, interest_rate: '4.00', udi: '3200.00', processing: '0.00', agent_fee: '0.00', insurance: '0.00', commission: '0.00', collection: '0.00', notarial: '0.00' },
  loan_details: [], loan_schedules: [{ id: '1', amount: '5000.00', due_date: '2026-11-15' }], loan_udi_schedules: [],
  borrower: { id: '8811', firstname: 'ANA UNO', middlename: null, lastname: 'TESTPLAN' },
  loan_bank_details: null, previous_bank_details: null, acctg_entry: { id: '1' },
  branch_sub: { id: '9101', name: 'E2E Sub-branch A', branch: { name: 'E2E Branch FA' } }, user: { branch_sub_id: 9101 },
};

test('list pages, record pages and client-side navigation all title the tab; the favicon is the castle', async ({ page, backend }) => {
  backend.extraGraphql.set('getCollectionLists', () => ({ data: { getCollectionLists: empty } }));
  backend.extraGraphql.set('getLoans', () => ({ data: { getLoans: empty } }));
  backend.extraGraphql.set('getLoan', () => ({ data: { getLoan: loan } }));
  backend.extraGraphql.set('getBanks', () => ({ data: { getBanks: { data: [] } } }));
  backend.extraGraphql.set('getAllBranch', () => ({ data: { getAllBranch: [] } }));
  backend.extraGraphql.set('getChartOfAccounts', () => ({ data: { getChartOfAccounts: [] } }));
  backend.extraGraphql.set('getLoanProducts', () => ({ data: { getLoanProducts: { data: [] } } }));
  backend.extraGraphql.set('getLoanHistory', () => ({ data: { getLoanHistory: [] } }));
  backend.extraGraphql.set('pendingDeletionsForEntities', () => ({ data: { pendingDeletionsForEntities: [] } }));
  await signedInAs(page, backend, [9101]);

  await page.goto('/collection-list', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page).toHaveTitle('Collection List · Fuerte Lending', { timeout: 120_000 });
  // Exactly one <title>: the old hard-coded "Fuerte Lending System" is gone.
  expect(await page.locator('head title').count()).toBe(1);
  // The gold castle favicon (no tile), served by app/icon.svg; the template's stock favicon.ico is gone.
  const icon = page.locator('head link[rel="icon"]');
  await expect(icon.first()).toHaveAttribute('href', /icon\.svg/);
  const svg = await (await page.request.get(String(await icon.first().getAttribute('href')))).text();
  expect(svg).toContain('#E3A92E');

  await page.goto('/loans-list/7701', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page).toHaveTitle('TESTPLAN, ANA UNO · MA-0512 · Fuerte Lending', { timeout: 120_000 });

  // Record to record on the same route, when the second cannot be shown: the tab falls back to
  // "Loan", never keeping the first loan's borrower (Next writes no new <title> on the same route).
  backend.extraGraphql.set('getLoan', () => ({ data: { getLoan: null } }));
  await page.evaluate(() => (window as unknown as { next: { router: { push: (u: string) => void } } }).next.router.push('/loans-list/7702'));
  await expect(page).toHaveURL(/\/loans-list\/7702$/, { timeout: 60_000 });
  await expect(page).toHaveTitle('Loan · Fuerte Lending', { timeout: 60_000 });

  // Client-side navigation (the sidebar) retitles the tab for the next page.
  await page.locator('aside a[href="/collection-list"]').first().dispatchEvent('click');
  await expect(page).toHaveURL(/\/collection-list$/, { timeout: 60_000 });
  await expect(page).toHaveTitle('Collection List · Fuerte Lending', { timeout: 60_000 });
});
