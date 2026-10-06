/**
 * Applicant funnel (spec docs/superpowers/specs/2026-10-05-applicant-funnel-design.md), the
 * Source tracker (/applications/tracker):
 *
 *   1. The logic with no browser: counts are made whole, channels come in the form's order with
 *      "no source" last, and every number links where the list can show exactly those applications.
 *   2. The funnel asks getApplicationFunnel for the period on screen, and again when it changes.
 *   3. The four steps with their % of Applied; the exits and the waiting stages; the exceptions only
 *      when they happened; the per-source table.
 *   4. A number opens the Applications list filtered to those applications and those days.
 *   5. A refused funnel shows its message and Retry; the source counts above are unaffected.
 *   6. 360px: everything stacks and nothing scrolls sideways.
 *
 * THE CLOCK: 10:00 on Monday 5 Oct 2026 in Manila, so "This month" is Oct 1 – Oct 31, 2026.
 *
 * NO CREDENTIALS AND NO BACKEND: the fake backend of ../27-application-page/applicationPageHarness.ts,
 * with the tracker's two queries answered here. Fictional numbers only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/30-applicant-funnel --reporter=list
 */
import type { Locator, Page } from '@playwright/test';
import { FUNNEL_STEPS, funnelHref, normalizeFunnel, wholeCounts } from '../../../src/utils/applicationFunnel';
import type { ApplicationFunnel, ApplicationFunnelCounts } from '../../../src/utils/DataTypes';
import { expect, sidewaysScroll, signedInAs, test, type FakeBackend } from '../27-application-page/applicationPageHarness';

test.setTimeout(180_000);

const NOW = new Date('2026-10-05T10:00:00+08:00');
const OCTOBER = { from: '2026-10-01', to: '2026-10-31' };
const SEPTEMBER = { from: '2026-09-01', to: '2026-09-30' };

const counts = (over: Partial<ApplicationFunnelCounts> = {}): ApplicationFunnelCounts => ({
  ...wholeCounts({}),
  ...over,
});

/** Forty applicants; 20 became borrowers, 12 approved, 9 got a loan (22.5%, shown 23%). */
const TOTAL = counts({
  applied: 40, became_borrower: 20, approved: 12, loan_released: 9,
  declined: 6, rejected: 3, loan_cancelled: 1,
  for_interview: 8, interviewed: 6, borrower: 4, approved_no_loan: 2, loan_in_process: 1,
  rejected_with_loan: 1, released_without_approval: 2, borrower_deleted: 0,
});

/** The server's channels, NOT in the form's order: the page puts them in it, "no source" last. */
const FUNNEL: ApplicationFunnel = {
  total: TOTAL,
  by_channel: [
    { channel: 'unknown', counts: counts({ applied: 1 }) },
    { channel: 'walk_in', counts: counts({ applied: 4, became_borrower: 3, approved: 2, loan_released: 2 }) },
    { channel: 'google_form', counts: counts({ applied: 25, became_borrower: 12, approved: 7, loan_released: 5 }) },
    { channel: 'facebook', counts: counts({ applied: 10, became_borrower: 5, approved: 3, loan_released: 2 }) },
  ],
};

const SOURCE_COUNTS = [
  { channel: 'google_form', count: 25 }, { channel: 'facebook', count: 10 },
  { channel: 'walk_in', count: 4 }, { channel: 'phone', count: 0 }, { channel: 'unknown', count: 1 },
];

function stubTracker(backend: FakeBackend, funnel: () => unknown = () => ({ data: { getApplicationFunnel: FUNNEL } })): void {
  backend.overrides.set('getApplicationSourceCounts', () => ({ data: { getApplicationSourceCounts: SOURCE_COUNTS } }));
  backend.overrides.set('getApplicationFunnel', funnel as never);
}

const funnel = (page: Page): Locator => page.getByRole('region', { name: 'From application to loan' });
const step = (page: Page, key: string): Locator => funnel(page).locator(`[data-step="${key}"]`);
const stage = (page: Page, key: string): Locator => funnel(page).locator(`[data-stage="${key}"]`);
const funnelCalls = (backend: FakeBackend) => backend.calls('getApplicationFunnel').map((call) => call.variables);

async function openTracker(page: Page, backend: FakeBackend): Promise<void> {
  await page.clock.install({ time: NOW });
  await signedInAs(page, backend, 'ADM');
  await page.goto('/applications/tracker', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(funnel(page)).toBeVisible({ timeout: 90_000 });
}

test.describe('1. The funnel logic, with no browser', () => {
  test('counts are whole, and channels come in the form\'s order with no source last', () => {
    const normal = normalizeFunnel({ total: { applied: '7', approved: -2, loan_released: 1.9 } as never, by_channel: FUNNEL.by_channel });
    expect(normal.total.applied).toBe(7);
    expect(normal.total.approved).toBe(0);
    expect(normal.total.loan_released).toBe(1);
    expect(normal.total.borrower_deleted).toBe(0);
    expect(normal.by_channel.map((row) => row.channel)).toEqual(['google_form', 'facebook', 'walk_in', 'unknown']);
  });

  test('a step links only where the list can show exactly its applications', () => {
    expect(FUNNEL_STEPS.map((item) => funnelHref(item.target, OCTOBER))).toEqual([
      '/applications?from=2026-10-01&to=2026-10-31',
      '/applications?status=borrower_created&from=2026-10-01&to=2026-10-31',
      null,
      '/applications?outcome=loan_released&from=2026-10-01&to=2026-10-31',
    ]);
  });
});

test.describe('2-6. The funnel on the Source tracker', () => {
  test('it asks for this month, and for the new days when the period changes', async ({ page, backend }) => {
    stubTracker(backend);
    await openTracker(page, backend);
    await expect(step(page, 'applied')).toContainText('40');
    // Every ask is for October (the dev build's Strict Mode mounts effects twice, so there may be two).
    expect(funnelCalls(backend).length).toBeGreaterThanOrEqual(1);
    expect(funnelCalls(backend).every((call) => call.from === OCTOBER.from && call.to === OCTOBER.to)).toBe(true);

    await page.getByRole('group', { name: 'Period' }).getByRole('button', { name: 'Last month', exact: true }).click();

    await expect.poll(() => funnelCalls(backend).at(-1)).toEqual(SEPTEMBER);
    await expect(funnel(page)).toContainText('Applied Sep 1 – Sep 30, 2026');
  });

  test('the four steps show their counts and % of Applied; Approved is the one step that is not a link', async ({ page, backend }) => {
    stubTracker(backend);
    await openTracker(page, backend);

    await expect(step(page, 'applied')).toContainText('01');
    await expect(step(page, 'applied')).toContainText('Everyone who applied');
    await expect(step(page, 'became_borrower').getByTestId('step-share')).toHaveText('50% of applied');
    await expect(step(page, 'approved').getByTestId('step-share')).toHaveText('30% of applied');
    await expect(step(page, 'loan_released').getByTestId('step-share')).toHaveText('23% of applied');

    await expect(step(page, 'applied').getByRole('link', { name: '40 Applied' })).toHaveAttribute('href', '/applications?from=2026-10-01&to=2026-10-31');
    await expect(step(page, 'became_borrower').getByRole('link', { name: '20 Became borrower' })).toHaveAttribute(
      'href', '/applications?status=borrower_created&from=2026-10-01&to=2026-10-31',
    );
    await expect(step(page, 'approved').getByRole('link')).toHaveCount(0);
    await expect(step(page, 'approved')).toContainText('12');
    await expect(step(page, 'loan_released').getByRole('link', { name: '9 Got a loan' })).toHaveAttribute(
      'href', '/applications?outcome=loan_released&from=2026-10-01&to=2026-10-31',
    );
  });

  test('exits and waiting stages always; exceptions only those that happened; the per-source table in the form\'s order', async ({ page, backend }) => {
    stubTracker(backend);
    await openTracker(page, backend);

    await expect(stage(page, 'declined').getByRole('link', { name: '6 Declined' })).toHaveAttribute(
      'href', '/applications?outcome=declined&from=2026-10-01&to=2026-10-31',
    );
    await expect(stage(page, 'approved_no_loan').getByRole('link', { name: '2 Approved, no loan' })).toHaveAttribute(
      'href', '/applications?outcome=approved&from=2026-10-01&to=2026-10-31',
    );
    await expect(stage(page, 'borrower').getByRole('link')).toHaveAttribute('href', '/applications?outcome=borrower&from=2026-10-01&to=2026-10-31');
    await expect(stage(page, 'rejected_with_loan').getByRole('link', { name: '1 Rejected but has a loan' })).toBeVisible();
    await expect(stage(page, 'released_without_approval')).toContainText('Got a loan without Approve2');
    await expect(stage(page, 'released_without_approval').getByRole('link')).toHaveCount(0);
    await expect(stage(page, 'borrower_deleted'), 'an exception that did not happen is shown').toHaveCount(0);

    const table = funnel(page).getByRole('table', { name: 'By source' });
    await expect(table.locator('tbody th')).toHaveText(['Google Form', 'Messenger', 'Walk-in', 'Not recorded']);
    await expect(table.locator('tbody tr').first().locator('td')).toHaveText(['25', '12', '7', '5']);
    await expect(table.locator('tfoot tr td')).toHaveText(['40', '20', '12', '9']);
  });

  test('no exceptions: the "Look into these" group is not drawn', async ({ page, backend }) => {
    stubTracker(backend, () => ({
      data: { getApplicationFunnel: { total: counts({ applied: 3, for_interview: 3 }), by_channel: [] } },
    }));
    await openTracker(page, backend);
    await expect(step(page, 'applied')).toContainText('3');
    await expect(funnel(page).getByRole('region', { name: 'Look into these' })).toHaveCount(0);
    await expect(funnel(page).getByRole('region', { name: 'Left' })).toBeVisible();
  });

  test('a number opens the Applications list with exactly those filters and days', async ({ page, backend }) => {
    stubTracker(backend);
    await openTracker(page, backend);

    await step(page, 'loan_released').getByRole('link', { name: '9 Got a loan' }).click();

    await expect(page).toHaveURL(/\/applications\?outcome=loan_released&from=2026-10-01&to=2026-10-31$/, { timeout: 90_000 });
    await expect.poll(() => backend.calls('getLoanApplications')[0]?.variables, { timeout: 60_000 }).toEqual({
      first: 20, page: 1, outcome: 'loan_released', from: '2026-10-01', to: '2026-10-31',
    });
    await expect(page.getByTestId('period-chip')).toHaveText('Applied Oct 1 – Oct 31, 2026');
    await expect(page.getByLabel('Outcome', { exact: true })).toHaveValue('loan_released');
  });

  test('a refused funnel shows the server\'s message and Retry; the source counts are not affected', async ({ page, backend }) => {
    let refuse = true;
    stubTracker(backend, () => (refuse ? { errors: [{ message: 'E2E: the funnel could not be counted.' }] } : { data: { getApplicationFunnel: FUNNEL } }));
    await openTracker(page, backend);

    await expect(funnel(page).getByRole('alert')).toContainText('E2E: the funnel could not be counted.');
    await expect(page.getByRole('region', { name: 'Applications by source' })).toContainText('25');

    refuse = false;
    await funnel(page).getByRole('button', { name: /retry/i }).click();
    await expect(step(page, 'applied')).toContainText('40');
  });

  test('360px: steps stack, the table fits, links are 48px tall, and nothing scrolls sideways', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    stubTracker(backend);
    await openTracker(page, backend);
    await expect(step(page, 'loan_released')).toBeVisible();

    const boxes = await Promise.all(['applied', 'became_borrower'].map(async (key) => (await step(page, key).boundingBox())!));
    expect(boxes[1].y, 'the steps did not stack').toBeGreaterThan(boxes[0].y + boxes[0].height - 1);
    expect((await stage(page, 'declined').getByRole('link').boundingBox())!.height).toBeGreaterThanOrEqual(48);
    expect((await step(page, 'loan_released').getByRole('link').boundingBox())!.height).toBeGreaterThanOrEqual(48);
    expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
    const table = funnel(page).getByRole('table', { name: 'By source' });
    const overflow = await table.evaluate((node) => node.parentElement!.scrollWidth - node.parentElement!.clientWidth);
    expect(overflow, 'the per-source table scrolls sideways at 360px').toBeLessThanOrEqual(0);
  });
});
