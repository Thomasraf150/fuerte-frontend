/**
 * Applicant funnel (spec docs/superpowers/specs/2026-10-05-applicant-funnel-design.md), the
 * Applications list:
 *
 *   1. The logic with no browser: readListParams takes only well-formed outcome, status and
 *      period params; listHref writes only what is set.
 *   2. A borrower's row shows where it ended up (the outcome pill, its key in data-outcome) under
 *      its status; a row that is not a borrower does not repeat its status.
 *   3. The Outcome select sends `outcome`, says so in the result line and in the address, and
 *      "Any outcome" sends none.
 *   4. `?outcome=&from=&to=` (the funnel's links): the FIRST fetch carries them, the select and a
 *      removable "Applied …" chip show them, and removing the chip fetches without the days.
 *   5. 360px: the filters fit and nothing scrolls sideways.
 *
 * NO CREDENTIALS AND NO BACKEND: the fake backend of ../27-application-page/applicationPageHarness.ts,
 * with getLoanApplications answered here. Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/30-applicant-funnel --reporter=list
 */
import type { Locator, Page } from '@playwright/test';
import { listHref, readListParams } from '../../../src/utils/applicationOutcome';
import type { LoanApplicationRow } from '../../../src/utils/DataTypes';
import { expect, sidewaysScroll, signedInAs, test, type FakeBackend } from '../27-application-page/applicationPageHarness';

test.setTimeout(180_000);

const row = (over: Partial<LoanApplicationRow>): LoanApplicationRow => ({
  id: '1', source: 'manual', channel: 'walk_in', submitted_at: '2026-10-02 09:15:00', location: null,
  branch_sub: { id: '9101', name: 'E2E Sub-branch A' }, status: 'interviewed', full_name: 'E2E Applicant One',
  contact_no: '09170000001', amount_applied: '15000.00', purpose: 'Store capital', intake_flags: [],
  outcome: 'interviewed', outcome_label: 'Interviewed', decline_reason: null,
  ...over,
});

const ROWS: LoanApplicationRow[] = [
  row({ id: '1' }),
  row({ id: '2', full_name: 'E2E Applicant Two', status: 'borrower_created', outcome: 'loan_released', outcome_label: 'Loan released' }),
  row({ id: '3', full_name: 'E2E Applicant Three', status: 'borrower_created', outcome: 'rejected', outcome_label: 'Rejected by Marketing' }),
];

/** getLoanApplications answers ROWS, whatever it is asked: what it was asked is what these tests read. */
function stubList(backend: FakeBackend): void {
  backend.overrides.set('getLoanApplications', () => ({
    data: { getLoanApplications: { data: ROWS, paginatorInfo: { total: ROWS.length, currentPage: 1, lastPage: 1, hasMorePages: false } } },
  }));
}

const listCalls = (backend: FakeBackend) => backend.calls('getLoanApplications').map((call) => call.variables);
const outcomeSelect = (page: Page): Locator => page.getByLabel('Outcome', { exact: true });
const nameLink = (page: Page, name: string): Locator => page.getByRole('link', { name, exact: true });
/** The line over the table that says what the rows were fetched with ("3 applications · Declined · …"). */
const resultLine = (page: Page): Locator => page.locator('[role="status"][aria-busy] p');

async function openList(page: Page, backend: FakeBackend, query = ''): Promise<void> {
  stubList(backend);
  await signedInAs(page, backend, 'ADM');
  await page.goto(`/applications${query}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(nameLink(page, 'E2E Applicant One')).toBeVisible({ timeout: 90_000 });
}

test.describe('1. The address params, with no browser', () => {
  test('readListParams keeps only what is well formed', () => {
    expect(readListParams({ outcome: 'loan_released', from: '2026-10-01', to: '2026-10-31' })).toEqual({
      outcome: 'loan_released', status: null, period: { from: '2026-10-01', to: '2026-10-31' },
    });
    expect(readListParams({ status: 'borrower_created' })).toEqual({ outcome: null, status: 'borrower_created', period: null });
    // Unknown words, a lone day, a backwards range and a day that does not exist are all ignored.
    expect(readListParams({ outcome: 'won', status: 'deleted', from: '2026-10-01' })).toEqual({ outcome: null, status: null, period: null });
    expect(readListParams({ from: '2026-10-31', to: '2026-10-01' }).period).toBeNull();
    expect(readListParams({ from: '2026-02-30', to: '2026-03-01' }).period).toBeNull();
    expect(readListParams({ outcome: ['declined', 'rejected'] }).outcome).toBe('declined');
  });

  test('listHref writes only what is set', () => {
    expect(listHref({})).toBe('/applications');
    expect(listHref({ outcome: 'approved', period: { from: '2026-10-01', to: '2026-10-31' } })).toBe(
      '/applications?outcome=approved&from=2026-10-01&to=2026-10-31',
    );
    expect(listHref({ status: 'borrower_created' })).toBe('/applications?status=borrower_created');
  });
});

test.describe('2-5. The list', () => {
  test('a borrower row shows its outcome under its status; another row does not say its status twice', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openList(page, backend);
    const rowOf = (name: string) => page.getByRole('row').filter({ has: nameLink(page, name) });

    await expect(rowOf('E2E Applicant Two').locator('[data-outcome="loan_released"]')).toHaveText('Loan released');
    await expect(rowOf('E2E Applicant Three').locator('[data-outcome="rejected"]')).toHaveText('Rejected by Marketing');
    await expect(rowOf('E2E Applicant One').locator('[data-outcome]')).toHaveCount(0);
  });

  test('the Outcome select sends outcome, words the result line and the address; Any outcome sends none', async ({ page, backend }) => {
    await openList(page, backend);
    expect(listCalls(backend)[0]).toEqual({ first: 20, page: 1 });
    await expect(outcomeSelect(page)).toHaveValue('');
    // The dev build's Strict Mode may fetch the first page twice; count from what is already there.
    await page.waitForTimeout(800);
    const before = listCalls(backend).length;
    await expect(outcomeSelect(page).locator('option')).toHaveCount(12);

    await outcomeSelect(page).selectOption('loan_released');

    await expect.poll(() => listCalls(backend).at(-1)).toEqual({ first: 20, page: 1, outcome: 'loan_released' });
    await expect(resultLine(page)).toContainText('Loan released');
    await expect(page).toHaveURL(/\/applications\?outcome=loan_released$/);
    // The address follows without a navigation: the list is not fetched again because of it.
    await page.waitForTimeout(800);
    expect(listCalls(backend)).toHaveLength(before + 1);

    await outcomeSelect(page).selectOption('');
    await expect.poll(() => listCalls(backend).at(-1)).toEqual({ first: 20, page: 1 });
    await expect(page).toHaveURL(/\/applications$/);
  });

  test('?outcome=&from=&to=: the first fetch carries them, the chip shows the days, and removing it drops them', async ({ page, backend }) => {
    await openList(page, backend, '?outcome=declined&from=2026-10-01&to=2026-10-31');

    expect(listCalls(backend)[0], 'the first fetch did not carry the link\'s filters').toEqual({
      first: 20, page: 1, outcome: 'declined', from: '2026-10-01', to: '2026-10-31',
    });
    await expect(outcomeSelect(page)).toHaveValue('declined');
    await expect(page.getByTestId('period-chip')).toHaveText('Applied Oct 1 – Oct 31, 2026');
    await expect(resultLine(page)).toHaveText(/^3 applications.*Declined.*Applied Oct 1 – Oct 31, 2026$/);

    const remove = page.getByRole('button', { name: 'Remove the period: Applied Oct 1 – Oct 31, 2026' });
    await remove.click();

    await expect.poll(() => listCalls(backend).at(-1)).toEqual({ first: 20, page: 1, outcome: 'declined' });
    await expect(page.getByTestId('period-chip')).toHaveCount(0);
    await expect(page).toHaveURL(/\/applications\?outcome=declined$/);
  });

  test('?status=borrower_created picks the status chip, and a malformed period is ignored', async ({ page, backend }) => {
    await openList(page, backend, '?status=borrower_created&from=2026-10-31&to=2026-10-01');
    expect(listCalls(backend)[0]).toEqual({ first: 20, page: 1, status: 'borrower_created' });
    await expect(page.getByRole('button', { name: 'Borrower created', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('period-chip')).toHaveCount(0);
  });

  test('360px: the select and the chip are 48px tall, and nothing scrolls sideways', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openList(page, backend, '?outcome=rejected_with_loan&from=2026-09-01&to=2026-10-31');

    expect((await outcomeSelect(page).boundingBox())!.height).toBeGreaterThanOrEqual(48);
    const remove = page.getByRole('button', { name: /^Remove the period/ });
    const box = (await remove.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
  });
});
