/**
 * "Waiting on you" on the home page (2026-10-12): what the signed-in user can act on now.
 * Fake backend, made-up token, fictional people: no real login, no database.
 */
import { test, expect, signedInAs, fakeUser, FakeBackend, sidewaysScroll } from '../26-new-application/borrowerFormHarness';
import { manilaToday, waitedFor } from '../../../src/utils/reportPeriod';

test.describe.configure({ mode: 'serial' });

const PANEL = 'Waiting on you';

/** A signed-in user of `role`, with the home page's other calls answered quietly. */
async function asRole(page: import('@playwright/test').Page, backend: FakeBackend, role: { id: number; name: string; code: string }) {
  await signedInAs(page, backend, [1]);
  backend.user = { ...fakeUser([1]), role_id: role.id, role } as typeof backend.user;
  await page.addInitScript((user) => {
    const store = JSON.parse(localStorage.getItem('authStore') ?? '{}');
    store.state.user = user;
    localStorage.setItem('authStore', JSON.stringify(store));
  }, backend.user);
  backend.extraGraphql.set('getSummaryTicket', () => ({ errors: [{ message: 'E2E stub' }] }));
  backend.extraGraphql.set('getBranchGroups', () => ({ data: { getBranchGroups: [] } }));
  backend.extraGraphql.set('getSubBranches', () => ({ data: { getSubBranches: [] } }));
}

const worklist = (overrides: Record<string, unknown> = {}) => () => ({
  data: {
    myWorklist: {
      loans: [], loans_total: 0, interviewed: null, approved_no_loan: null, undecided_borrowers: null,
      ...overrides,
    },
  },
});

const daysAgo = (n: number) => {
  const d = new Date(`${manilaToday()}T09:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return `${d.toISOString().slice(0, 10)} 09:00:00`;
};

test('waited-for words', () => {
  expect(waitedFor('2026-10-12 08:00:00', '2026-10-12')).toBe('today');
  expect(waitedFor('2026-10-11 23:59:00', '2026-10-12')).toBe('1 day');
  expect(waitedFor('2026-09-30 10:00:00', '2026-10-12')).toBe('12 days');
  expect(waitedFor(null)).toBe('');
});

test('Processing: unfinished loans by name and next step, and the applicant hand-offs, each a link', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asRole(page, backend, { id: 3, name: 'PROCESSING', code: 'PROC' });
  backend.extraGraphql.set('myWorklist', worklist({
    loans: [
      { id: '501', borrower_name: 'SANTOS, MARIA L.', pn_amount: '25000.00', step: 'release', updated_at: daysAgo(2) },
      { id: '502', borrower_name: 'REYES, JOSE', pn_amount: '15000.00', step: 'bank', updated_at: daysAgo(0) },
    ],
    loans_total: 2,
    interviewed: { count: 2, oldest_at: daysAgo(3) },
    approved_no_loan: { count: 1, oldest_at: daysAgo(1) },
  }));
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const panel = page.getByRole('region', { name: PANEL });
  await expect(panel.getByText('Finish 2 loans')).toBeVisible({ timeout: 60_000 });
  const first = panel.getByRole('link', { name: /SANTOS, MARIA L\./ });
  await expect(first).toHaveAttribute('href', '/loans-list/501');
  await expect(first).toContainText('Next: Approve and Release');
  await expect(first).toContainText('₱25,000.00');
  await expect(first).toContainText('2 days');
  await expect(panel.getByRole('link', { name: /Create borrowers for 2 interviewed applicants/ })).toHaveAttribute('href', '/applications?status=interviewed');
  await expect(panel.getByRole('link', { name: /Start a loan for 1 approved borrower\b/ })).toHaveAttribute('href', '/applications?outcome=approved');
  // 2 loans + 2 + 1 = 5 things, said in words for screen readers too.
  await expect(panel).toContainText('5 things to do');
  backend.unstubbed.length = 0;
});

test('an approver sees the deletion requests the bell counts, with the same number', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asRole(page, backend, { id: 6, name: 'BRANCH_ADMIN', code: 'BRADM' });
  backend.extraGraphql.set('pendingDeletionRequestsForMe', () => ({ data: { pendingDeletionRequestsForMe: [{ id: '1' }, { id: '2' }] } }));
  backend.extraGraphql.set('myWorklist', worklist());
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const panel = page.getByRole('region', { name: PANEL });
  await expect(panel.getByRole('link', { name: 'Decide on 2 deletion requests' })).toHaveAttribute('href', '/approvals', { timeout: 60_000 });
  backend.unstubbed.length = 0;
});

test('nothing waiting: one quiet line, no count, no sideways scroll on a phone', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 360, height: 760 });
  await asRole(page, backend, { id: 2, name: 'COLLECTION', code: 'COL' });
  backend.extraGraphql.set('myWorklist', worklist({ undecided_borrowers: { count: 0, oldest_at: null } }));
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const panel = page.getByRole('region', { name: PANEL });
  await expect(panel.getByText('Nothing is waiting on you.')).toBeVisible({ timeout: 60_000 });
  await expect(panel.getByRole('link')).toHaveCount(0);
  expect(await sidewaysScroll(page)).toBe(0);
  await page.screenshot({ path: '../.playwright-mcp/worklist-empty-360.png' });
  backend.unstubbed.length = 0;
});

test('a failed load says so and offers Try again', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asRole(page, backend, { id: 3, name: 'PROCESSING', code: 'PROC' });
  let calls = 0;
  backend.extraGraphql.set('myWorklist', () => {
    calls += 1;
    return calls === 1
      ? { errors: [{ message: 'Your to-do list is not available right now. Please try again.' }] }
      : worklist({ interviewed: { count: 1, oldest_at: daysAgo(0) } })();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const panel = page.getByRole('region', { name: PANEL });
  await panel.getByRole('button', { name: 'Try again' }).click({ timeout: 60_000 });
  await expect(panel.getByRole('link', { name: /Create borrowers for 1 interviewed applicant\b/ })).toBeVisible();
  backend.unstubbed.length = 0;
});

test('screenshots: Processing with work, 1440 and 360', async ({ page, backend }) => {
  test.setTimeout(180_000);
  await asRole(page, backend, { id: 3, name: 'PROCESSING', code: 'PROC' });
  backend.extraGraphql.set('myWorklist', worklist({
    loans: [
      { id: '501', borrower_name: 'SANTOS, MARIA L.', pn_amount: '25000.00', step: 'release', updated_at: daysAgo(2) },
      { id: '502', borrower_name: 'REYES, JOSE', pn_amount: '15000.00', step: 'bank', updated_at: daysAgo(0) },
    ],
    loans_total: 2,
    interviewed: { count: 2, oldest_at: daysAgo(3) },
    approved_no_loan: { count: 1, oldest_at: daysAgo(1) },
  }));
  for (const [width, height] of [[1440, 900], [360, 760]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.getByRole('region', { name: PANEL }).getByText('Finish 2 loans')).toBeVisible({ timeout: 60_000 });
    expect(await sidewaysScroll(page)).toBe(0);
    await page.screenshot({ path: `../.playwright-mcp/worklist-proc-${width}.png` });
  }
  backend.unstubbed.length = 0;
});
