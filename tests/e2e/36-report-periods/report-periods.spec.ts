/**
 * Reports open pre-loaded (2026-10-12): no dashboard or statement waits for picks.
 * Checks the period maths (utils/reportPeriod.ts) directly, then that each screen's
 * FIRST request already carries its default period, with a fake backend and a made-up
 * token (no real login, no database).
 *
 * Defaults, following CHR: Summary Ticket and the journal/voucher lists the last 30 days;
 * Income Statement last month vs this month; General Ledger month-to-date; Balance Sheet
 * and Trial Balance "as of" today (no start date at all).
 */
import { test, expect, signedInAs, fakeUser, FakeBackend } from '../26-new-application/borrowerFormHarness';
import { reportRange, manilaToday } from '../../../src/utils/reportPeriod';

test.describe.configure({ mode: 'serial' });

test('period maths: Manila days, month edges, year edges', () => {
  expect(reportRange('last30', '2026-10-12')).toEqual({ from: '2026-09-13', to: '2026-10-12' });
  expect(reportRange('last30', '2026-03-01')).toEqual({ from: '2026-01-31', to: '2026-03-01' });
  expect(reportRange('monthToDate', '2026-10-12')).toEqual({ from: '2026-10-01', to: '2026-10-12' });
  expect(reportRange('thisMonth', '2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  expect(reportRange('lastMonth', '2026-01-15')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  expect(reportRange('nextMonth', '2026-12-05')).toEqual({ from: '2027-01-01', to: '2027-01-31' });
  // 7am Manila is still the previous day in UTC; the report must use the Manila day.
  expect(manilaToday(new Date('2026-10-11T23:30:00Z'))).toBe('2026-10-12');
});

const empty = (field: string, value: unknown) => () => ({ data: { [field]: value } });
const PAGE = { data: [], paginatorInfo: { count: 0, currentPage: 1, firstItem: null, hasMorePages: false, lastItem: null, lastPage: 1, perPage: 20, total: 0 } };

/** An Owner, so every report and every branch scope is open to them. */
async function asOwner(page: import('@playwright/test').Page, backend: FakeBackend) {
  await signedInAs(page, backend, [1]);
  backend.user = { ...fakeUser([1]), role_id: 5, role: { id: 5, name: 'OWNER', code: 'OWN' } } as typeof backend.user;
  await page.addInitScript((user) => {
    const store = JSON.parse(localStorage.getItem('authStore') ?? '{}');
    store.state.user = user;
    localStorage.setItem('authStore', JSON.stringify(store));
  }, backend.user);
  backend.extraGraphql.set('getBranchGroups', empty('getBranchGroups', []));
  backend.extraGraphql.set('getSubBranches', empty('getSubBranches', []));
}

/** Wait for the first request to a report field and hand back its variables. */
async function firstCall(backend: FakeBackend, field: string) {
  await expect.poll(() => backend.calls(field).length, { timeout: 90_000 }).toBeGreaterThan(0);
  return backend.calls(field)[0].variables as Record<string, any>;
}

/** Report screens also call fields this spec does not care about; they are not the subject here. */
const forgetUnrelated = (backend: FakeBackend) => { backend.unstubbed.length = 0; };

test('Summary Ticket: an Owner lands on the last 30 days, every branch, without picking anything', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asOwner(page, backend);
  backend.extraGraphql.set('getSummaryTicket', () => ({ errors: [{ message: 'E2E stub' }] }));
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const vars = await firstCall(backend, 'getSummaryTicket');
  const { from, to } = reportRange('last30');
  expect(vars.input).toMatchObject({ startDate: from, endDate: to, branch_sub_id: 'all', branch_id: 'all' });
  await expect(page.getByRole('button', { name: 'Last 30 days' })).toHaveAttribute('aria-pressed', 'true');
  forgetUnrelated(backend);
});

test('Cash Receipts Journal: the first list query is already the last 30 days', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asOwner(page, backend);
  backend.extraGraphql.set('getJournal', empty('getJournal', PAGE));
  await page.goto('/accounting/crj', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const vars = await firstCall(backend, 'getJournal');
  const { from, to } = reportRange('last30');
  expect(vars.input).toMatchObject({ startDate: from, endDate: to });
  // Picking "Last month" re-queries once with that month.
  const before = backend.calls('getJournal').length;
  await page.getByRole('button', { name: 'Last month' }).click();
  const last = reportRange('lastMonth');
  await expect.poll(() => backend.calls('getJournal').at(-1)?.variables?.input).toMatchObject({ startDate: last.from, endDate: last.to });
  expect(backend.calls('getJournal').length).toBe(before + 1);
  forgetUnrelated(backend);
});

test('Balance Sheet: "as of" today, every branch, and no start date is sent', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asOwner(page, backend);
  backend.extraGraphql.set('getBalanceSheet', empty('getBalanceSheet', {
    assets: [], liabilities: [], equity: [], total_assets: '0', total_liabilities: '0', total_equity: '0',
  }));
  await page.goto('/accounting/balance-sheet', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const vars = await firstCall(backend, 'getBalanceSheet');
  expect(vars).toMatchObject({ endDate: manilaToday(), branch_sub_id: 'all' });
  expect(vars.startDate).toBeUndefined();
  await expect(page.getByLabel('As of')).toBeVisible();
  forgetUnrelated(backend);
});

test('Trial Balance: "as of" today', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asOwner(page, backend);
  backend.extraGraphql.set('getUnadjustedTBal', empty('getUnadjustedTBal', { assets: [], liabilities: [], capital: [], revenue: [], expenses: [] }));
  await page.goto('/accounting/unadjusted-trial-balance', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const vars = await firstCall(backend, 'getUnadjustedTBal');
  expect(vars.input).toMatchObject({ endDate: manilaToday() });
  expect(vars.input.startDate).toBeUndefined();
  forgetUnrelated(backend);
});

test('General Ledger: this month to date', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asOwner(page, backend);
  backend.extraGraphql.set('getGL', empty('getGL', []));
  await page.goto('/accounting/general-ledger', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const vars = await firstCall(backend, 'getGL');
  const { from, to } = reportRange('monthToDate');
  expect(vars.input).toMatchObject({ startDate: from, endDate: to });
  forgetUnrelated(backend);
});

test('Income Statement: last month against this month, every branch', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asOwner(page, backend);
  backend.extraGraphql.set('getIncomeStatement', empty('getIncomeStatement', []));
  await page.goto('/accounting/income-statement', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const vars = await firstCall(backend, 'getIncomeStatement');
  expect(vars).toMatchObject({ startDate: reportRange('lastMonth').from, endDate: manilaToday(), branch_sub_id: 'all' });
  forgetUnrelated(backend);
});
