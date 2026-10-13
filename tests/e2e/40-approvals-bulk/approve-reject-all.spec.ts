/**
 * /approvals: "Approve all" / "Reject all" on the Pending for me tab (Rafael, 2026-10-13).
 *
 * The rules under test:
 * - the buttons act on exactly the decidable requests on screen when clicked (not the
 *   viewer's own, nothing that arrives later), sent as ids in calls of at most 50;
 * - "Approve all" covers loans and borrowers only, and says what it left out;
 * - "Reject all" covers every decidable request and needs a reason (3 to 1000 characters);
 * - a partial failure decides the rest, lists each failure with the server's reason, and the
 *   failed request stays pending.
 *
 * NO CREDENTIALS AND NO BACKEND, as in tests/e2e/38-users-setup/edit-user-prefill.spec.ts:
 * a made-up token in the persisted auth store, and every request to the backend origin
 * answered here, GraphQL by its root field. Nothing reaches the API, so (unlike
 * tests/e2e/06-deletion-approval) nothing here touches dev data.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/40-approvals-bulk --reporter=line --workers=1
 */
import { test as base, expect, Page, Route } from '@playwright/test';
import path from 'path';

const APP = 'http://localhost:3000';
const BACKEND = 'http://localhost:8080';
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };
const SCREENS = path.join(__dirname, '__screens__');

const OWNER = {
  id: 90005, name: 'E2E OWNER', email: 'e2e.own@example.test', role_id: 5,
  role: { id: 5, name: 'OWNER', code: 'OWN' }, branch_sub_id: null, branch_sub: null, assignedBranchSubIds: [],
};
const PROCESSOR = { ...OWNER, id: 90003, name: 'E2E PROC', role_id: 3, role: { id: 3, name: 'PROCESSING', code: 'PROC' } };

type Req = { id: string; entity_type: string; label: string; by?: number };

/** What the Owner sees on Pending for me: 6 they can decide, plus one of their own. */
const PENDING: Req[] = [
  { id: '101', entity_type: 'loan', label: 'LN-2026-0101 · DELA CRUZ, JUAN · PHP 25,000.00' },
  { id: '102', entity_type: 'loan', label: 'LN-2026-0102 · SANTOS, MARIA · PHP 18,500.00' },
  { id: '103', entity_type: 'branch', label: 'Marikina FA' },
  { id: '104', entity_type: 'borrower', label: 'REYES, ANTONIO BAUTISTA' },
  { id: '105', entity_type: 'loan', label: 'LN-2026-0105 · GARCIA, ROSA · PHP 9,000.00' },
  { id: '106', entity_type: 'branch', label: 'Telabastagan Old' },
  { id: '107', entity_type: 'loan', label: 'LN-2026-0107 · OWN REQUEST', by: OWNER.id },
];

const row = (r: Req) => ({
  id: r.id, entity_type: r.entity_type, entity_id: Number(r.id) * 10, branch_id: 1, branch_sub_id: 5,
  requested_by_user_id: r.by ?? 777, reason: 'duplicate entry', status: 'pending',
  decided_by_user_id: null, decided_at: null, decision_note: null,
  entity_snapshot: JSON.stringify({ label: r.label }),
  created_at: '2026-10-12 09:15:00', updated_at: '2026-10-12 09:15:00',
  requestedBy: { id: r.by ?? 777, name: 'Branch Clerk', email: 'clerk@example.test' },
  decidedBy: null, branchSub: { id: 5, name: 'Telebastagan Main', code: 'TM' }, branch: { id: 1, name: 'FB' },
});

const rootField = (query: string): string =>
  query.slice(query.indexOf('{') + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '(unparsed)';

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

type Outcome = { outcome: string; message?: string };
type BulkCall = { field: string; ids: string[]; note: unknown };
const BULK_FIELDS = new Set(['approveDeletionRequests', 'rejectDeletionRequests']);

/** Holds an answer back until the test opens it, so an order is set by the test, not hoped for. */
class Gate {
  private release: () => void = () => undefined;
  readonly opened = new Promise<void>((resolve) => { this.release = resolve; });
  open(): void { this.release(); }
}

class FakeBackend {
  user: typeof OWNER = OWNER;
  pending: Req[] = [...PENDING];
  /** Per-id answers that are not the plain success. */
  outcomes: Record<string, Outcome> = {};
  /** Bulk calls (1-based) that fail as a whole: a GraphQL error, or an HTTP 429 throttle. */
  failCalls: Record<number, 'graphql' | 'throttle'> = {};
  /** When set, the page's pending-list query waits for it (the bell's count query does not). */
  holdPending: Gate | null = null;
  /** When set, the bulk mutations wait for it. */
  holdBulk: Gate | null = null;
  readonly bulkCalls: BulkCall[] = [];
  badgeFetches = 0;
  readonly pageErrors: string[] = [];

  async handle(route: Route): Promise<void> {
    const request = route.request();
    const urlPath = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': '*' },
      });
    }
    if (urlPath === '/api/user') return json(route, this.user);
    if (urlPath !== '/fuerte-api') return route.abort('blockedbyclient');
    const { query = '', variables = {} } = request.postDataJSON() ?? {};
    const field = rootField(query);
    if (field === 'pendingDeletionRequestsForMe' && !query.includes('PendingForMeCount')) await this.holdPending?.opened;
    if (BULK_FIELDS.has(field)) {
      await this.holdBulk?.opened;
      const failure = this.failCalls[this.bulkCalls.length + 1];
      if (failure) return this.failBulk(route, field, variables ?? {}, failure);
    }
    return json(route, { data: this.answer(query, field, variables ?? {}) });
  }

  private failBulk(route: Route, field: string, variables: Record<string, unknown>, failure: 'graphql' | 'throttle') {
    this.bulkCalls.push({ field, ids: (variables.ids as string[]).map(String), note: variables.note });
    if (failure === 'graphql') {
      return json(route, { data: null, errors: [{ message: 'Deletion approvals are paused for maintenance.' }] });
    }
    return route.fulfill({
      status: 429, contentType: 'application/json', headers: CORS, body: JSON.stringify({ message: 'Too Many Attempts.' }),
    });
  }

  private answer(query: string, field: string, variables: Record<string, unknown>): Record<string, unknown> {
    switch (field) {
      case 'pendingDeletionRequestsForMe':
        if (query.includes('PendingForMeCount')) this.badgeFetches += 1;
        return { [field]: this.pending.map(row) };
      case 'myDeletionRequests':
        return { [field]: [] };
      case 'allDeletionRequests':
        return { [field]: { data: [], paginatorInfo: { currentPage: 1, lastPage: 1, perPage: 20, total: 0, hasMorePages: false } } };
      case 'deletionRequestsDecidedTodayCount':
        return { [field]: 0 };
      case 'approveDeletionRequests':
      case 'rejectDeletionRequests':
        return { [field]: this.decide(field, variables) };
      case 'maintenance':
        return { maintenance: { data: { isMaintenanceModeOn: 0 } } };
      case 'getApplicationNotifications':
      case 'pendingDeletionsForEntities':
        return { [field]: [] };
      default:
        return {};
    }
  }

  private decide(field: string, variables: Record<string, unknown>) {
    const ids = (variables.ids as string[]).map(String);
    this.bulkCalls.push({ field, ids, note: variables.note });
    const done = field === 'approveDeletionRequests' ? 'approved' : 'rejected';
    const results = ids.map((id) => {
      const o = this.outcomes[id] ?? { outcome: done };
      return { id, entity_type: this.pending.find((p) => p.id === id)?.entity_type ?? null, outcome: o.outcome, message: o.message ?? null };
    });
    const decided = new Set(results.filter((r) => r.outcome !== 'not_decided').map((r) => r.id));
    this.pending = this.pending.filter((p) => !decided.has(p.id));
    return { results };
  }
}

const test = base.extend<{ backend: FakeBackend }>({
  backend: async ({ page }, use) => {
    const backend = new FakeBackend();
    page.on('pageerror', (error) => backend.pageErrors.push(error.message));
    await page.route(`${BACKEND}/**`, (route) => backend.handle(route));
    await page.route(`${APP}/storage/**`, (route) => route.abort('blockedbyclient'));
    await use(backend);
    expect(backend.pageErrors, 'uncaught errors in the page').toEqual([]);
  },
});

test.setTimeout(120_000);

async function open(page: Page, user = OWNER): Promise<void> {
  await page.addInitScript(([u, token]) => {
    try {
      localStorage.setItem('authStore', JSON.stringify({ state: { user: u, authToken: token }, version: 0 }));
    } catch {
      // about:blank and other opaque frames have no storage; the app's own origin does.
    }
  }, [user, 'e2e-fake-token'] as const);
  await page.goto(`${APP}/approvals`);
}

const bar = (page: Page) => page.locator('section.appr-batch');
const approveAll = (page: Page) => bar(page).getByRole('button', { name: /^Approve \d+ deletions?$/ });
const rejectAll = (page: Page) => bar(page).getByRole('button', { name: /^Reject all \d+$/ });
const dialog = (page: Page) => page.locator('.swal2-popup');
const strip = (page: Page) => page.getByTestId('appr-result');
const card = (page: Page, label: string) => page.locator('article.appr-card').filter({ hasText: label });

const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SCREENS, name), fullPage: false });

test('the bar counts what can be decided and labels each button with its count and effect', async ({ page, backend }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  await expect(bar(page)).toBeVisible();
  await expect(page.getByTestId('appr-batch-counts')).toHaveText('6 waiting·3 loans·1 borrower·2 branches');
  await expect(approveAll(page)).toHaveText('Approve 4 deletions');
  await expect(rejectAll(page)).toHaveText('Reject all 6');
  await expect(bar(page)).toContainText('2 branch deletions need a one-by-one review.');
  await bar(page).scrollIntoViewIfNeeded();
  await shot(page, 'bar-desktop-1280.png');
  expect(backend.bulkCalls).toEqual([]);
});

test('Approve all sends only the loan and borrower ids that were on screen, and says what it left out', async ({ page, backend }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const badgeBefore = await (async () => { await expect(bar(page)).toBeVisible(); return backend.badgeFetches; })();
  await approveAll(page).click();

  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).locator('.swal2-title')).toHaveText('Approve 4 deletions?');
  await expect(dialog(page).locator('.appr-bulk-preview li')).toHaveCount(4);
  await expect(dialog(page).locator('.appr-bulk-preview')).toContainText('REYES, ANTONIO BAUTISTA');
  await expect(dialog(page).locator('.appr-bulk-preview')).not.toContainText('Marikina FA');
  await expect(dialog(page)).toContainText('Left out: 2 branch deletions need a one-by-one review.');
  await expect(dialog(page)).toContainText("Each record is deleted. This can't be undone from Fuerte.");
  await expect(page.locator('.swal2-cancel')).toBeFocused();
  await shot(page, 'dialog-approve-desktop-1280.png');

  await dialog(page).getByRole('button', { name: 'Approve 4 deletions' }).click();

  await expect(strip(page)).toContainText('Approved 4');
  expect(backend.bulkCalls).toHaveLength(1);
  expect(backend.bulkCalls[0].field).toBe('approveDeletionRequests');
  // Loans first, then borrowers, each by ascending id: not the screen order (101, 102, 104, 105).
  expect(backend.bulkCalls[0].ids).toEqual(['101', '102', '105', '104']);
  expect(backend.bulkCalls[0].note).toBeNull();
  await expect(card(page, 'Marikina FA')).toBeVisible();
  await expect(card(page, 'DELA CRUZ, JUAN')).toHaveCount(0);
  await expect.poll(() => backend.badgeFetches).toBeGreaterThan(badgeBefore);
});

test('Reject all is blocked until there is a reason, then sends every decidable id with it', async ({ page, backend }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  await rejectAll(page).click();

  await expect(dialog(page).locator('.swal2-title')).toHaveText('Reject 6 requests?');
  await expect(dialog(page).locator('.appr-bulk-preview li')).toHaveCount(6);
  await expect(dialog(page)).not.toContainText('Left out');
  const confirm = dialog(page).getByRole('button', { name: 'Reject 6 requests' });
  await expect(confirm).toBeDisabled();
  await expect(page.locator('.swal2-cancel')).toBeFocused();

  const reason = dialog(page).locator('textarea.swal2-textarea');
  await reason.fill('ab');
  await expect(page.locator('.swal2-validation-message')).toContainText('at least 3 characters');
  await expect(confirm).toBeDisabled();
  await reason.fill('Still being collected, please re-check');
  await expect(confirm).toBeEnabled();
  await expect(page.locator('.swal2-validation-message')).toBeHidden();
  await shot(page, 'dialog-reject-desktop-1280.png');
  await confirm.click();

  await expect(strip(page)).toContainText('Rejected 6');
  expect(backend.bulkCalls).toHaveLength(1);
  expect(backend.bulkCalls[0].field).toBe('rejectDeletionRequests');
  expect([...backend.bulkCalls[0].ids].sort()).toEqual(['101', '102', '103', '104', '105', '106']);
  expect(backend.bulkCalls[0].note).toBe('Still being collected, please re-check');
});

test('a partial failure decides the rest, lists the failure with its reason, and keeps it pending', async ({ page, backend }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  backend.outcomes = {
    '102': { outcome: 'not_decided', message: 'This loan has payments posted after the request was filed.' },
    '105': { outcome: 'superseded' },
  };
  await open(page);
  await approveAll(page).click();
  await dialog(page).getByRole('button', { name: 'Approve 4 deletions' }).click();

  await expect(strip(page)).toHaveText(/Approved\s*2\s*·\s*1 superseded\s*·\s*1 not approved/);
  // Announced through the page's one persistent live region, and focus lands on the result.
  await expect(page.getByTestId('appr-bulk-announcer')).toHaveText('Approved 2, 1 superseded, 1 not approved.');
  await expect(strip(page).getByRole('heading')).toBeFocused();
  await strip(page).getByText('Why 1 request is still pending').click();
  await expect(strip(page)).toContainText('SANTOS, MARIA');
  await expect(strip(page)).toContainText('This loan has payments posted after the request was filed.');
  await expect(card(page, 'SANTOS, MARIA')).toBeVisible();
  await strip(page).scrollIntoViewIfNeeded();
  await shot(page, 'result-strip-desktop-1280.png');

  await strip(page).getByRole('button', { name: 'Dismiss result' }).click();
  await expect(strip(page)).toHaveCount(0);
});

test('Cancel and Escape both close the review without sending anything, and focus returns to the button', async ({ page, backend }) => {
  await open(page);
  await approveAll(page).click();
  await dialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(approveAll(page)).toBeFocused();

  await rejectAll(page).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(rejectAll(page)).toBeFocused();

  await page.waitForTimeout(300);
  expect(backend.bulkCalls).toEqual([]);
  await expect(strip(page)).toHaveCount(0);
});

test('focus returns to the bar button even when clicking it did not focus it (as in Safari)', async ({ page, backend }) => {
  await open(page);
  await expect(approveAll(page)).toBeVisible();
  // A dispatched click runs the button's handler without moving focus, as Safari's click does:
  // focus stays on <body>, so only the button handed in explicitly can take it back.
  const clickWithoutFocus = async (button: ReturnType<typeof approveAll>) => {
    await button.evaluate((el) => {
      (document.activeElement as HTMLElement | null)?.blur();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
  };

  await clickWithoutFocus(approveAll(page));
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(approveAll(page)).toBeFocused();

  await clickWithoutFocus(rejectAll(page));
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(rejectAll(page)).toBeFocused();
  expect(backend.bulkCalls).toEqual([]);
});

/** Opens Approve all, then lands a held refetch that leaves only `remaining` pending, under the open dialog. */
async function approveWhileListShrinks(page: Page, backend: FakeBackend, remaining: Req[]): Promise<void> {
  await open(page);
  await expect(approveAll(page)).toHaveText('Approve 4 deletions');
  backend.holdPending = new Gate();
  await page.getByRole('button', { name: /^Requests/ }).click();
  await page.getByRole('button', { name: /Pending for me/ }).click();
  await approveAll(page).click();
  await expect(dialog(page)).toBeVisible();
  backend.pending = remaining;
  const gate = backend.holdPending;
  backend.holdPending = null;
  gate.open();
  // The Approve button that opened the dialog is gone (by class: the bar is aria-hidden behind the modal).
  await expect(page.locator('.appr-batch-btn.is-approve')).toHaveCount(0);
}

test('a cancel whose opener was removed by a refetch focuses the bar\'s other button', async ({ page, backend }) => {
  await approveWhileListShrinks(page, backend, [PENDING[2], PENDING[5]]); // two branches: nothing to approve
  await dialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(rejectAll(page)).toHaveText('Reject all 2');
  await expect(rejectAll(page)).toBeFocused();
  expect(backend.bulkCalls).toEqual([]);
});

test('a cancel whose whole bar was removed by a refetch focuses the Pending for me tab', async ({ page, backend }) => {
  await approveWhileListShrinks(page, backend, [PENDING[2]]); // one left: no bar at all
  await expect(page.locator('section.appr-batch')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole('button', { name: /Pending for me/ })).toBeFocused();
  expect(backend.bulkCalls).toEqual([]);
});

test('more than 50 on screen go in sequential calls of at most 50', async ({ page, backend }) => {
  backend.pending = Array.from({ length: 120 }, (_, i) => ({
    id: String(1000 + i), entity_type: 'loan', label: `LN-2026-${1000 + i} · BULK BORROWER`,
  }));
  await open(page);
  await expect(approveAll(page)).toHaveText('Approve 120 deletions');
  await approveAll(page).click();
  await dialog(page).getByRole('button', { name: 'Approve 120 deletions' }).click();

  await expect(strip(page)).toContainText('Approved 120');
  expect(backend.bulkCalls.map((c) => c.ids.length)).toEqual([50, 50, 20]);
  expect(new Set(backend.bulkCalls.flatMap((c) => c.ids)).size).toBe(120);
});

test('with more than 50, loans go before borrowers across the calls, each by ascending id', async ({ page, backend }) => {
  // Screen order is newest first, borrower and loan interleaved: B2030, L3030, B2029, L3029, ...
  backend.pending = Array.from({ length: 30 }, (_, i) => 30 - i).flatMap((n) => [
    { id: String(2000 + n), entity_type: 'borrower', label: `BORROWER ${n}` },
    { id: String(3000 + n), entity_type: 'loan', label: `LN-2026-${3000 + n} · BORROWER ${n}` },
  ]);
  await open(page);
  await approveAll(page).click();
  await dialog(page).getByRole('button', { name: 'Approve 60 deletions' }).click();

  await expect(strip(page)).toContainText('Approved 60');
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
  expect(backend.bulkCalls.map((c) => c.ids)).toEqual([
    [...range(3001, 3030), ...range(2001, 2020)],
    range(2021, 2030),
  ]);
});

test('ids are fixed at the click: a refetch that lands while the dialog is open changes nothing sent', async ({ page, backend }) => {
  await open(page);
  await expect(approveAll(page)).toHaveText('Approve 4 deletions');

  // Leave the tab and come back: the pending list refetches, and that answer is held.
  backend.holdPending = new Gate();
  await page.getByRole('button', { name: /^Requests/ }).click();
  await page.getByRole('button', { name: /Pending for me/ }).click();
  await approveAll(page).click();
  await expect(dialog(page)).toBeVisible();

  // While the dialog is open, the held answer lands with a new request in it.
  backend.pending.push({ id: '108', entity_type: 'loan', label: 'LN-2026-0108 · LATE ARRIVAL' });
  const gate = backend.holdPending;
  backend.holdPending = null;
  gate.open();
  // The list under the dialog did change (the bar is aria-hidden behind the modal, so by class).
  await expect(page.locator('.appr-batch-btn.is-approve')).toHaveText('Approve 5 deletions');
  await expect(dialog(page).locator('.appr-bulk-preview li')).toHaveCount(4);

  await dialog(page).getByRole('button', { name: 'Approve 4 deletions' }).click();
  await expect(strip(page)).toContainText('Approved 4');
  expect(backend.bulkCalls.map((c) => c.ids)).toEqual([['101', '102', '105', '104']]);
  await expect(card(page, 'LATE ARRIVAL')).toBeVisible();
});

test('the bar stays disabled, and the busy line is announced, until the lists have refreshed', async ({ page, backend }) => {
  await open(page);
  await approveAll(page).click();
  backend.holdBulk = new Gate();
  await dialog(page).getByRole('button', { name: 'Approve 4 deletions' }).click();

  await expect(page.getByTestId('appr-bulk-announcer')).toHaveText('Deciding 4 requests…');
  await expect(rejectAll(page)).toBeDisabled();

  // The decision answers, but the refresh after it is held: the bar must not wake on the old list.
  backend.holdPending = new Gate();
  backend.holdBulk.open();
  await expect(strip(page)).toContainText('Approved 4');
  await expect(page.getByTestId('appr-bulk-announcer')).toHaveText('Approved 4.');
  await expect(rejectAll(page)).toBeDisabled();
  await expect(rejectAll(page)).toHaveText('Reject all 6');

  backend.holdPending.open();
  await expect(rejectAll(page)).toHaveText('Reject all 2');
  await expect(rejectAll(page)).toBeEnabled();
});

test('a call that fails whole (a GraphQL error, a 429 throttle) leaves its requests pending with the reason; the rest are decided', async ({ page, backend }) => {
  backend.pending = Array.from({ length: 120 }, (_, i) => ({
    id: String(1000 + i), entity_type: 'loan', label: `LN-2026-${1000 + i} · BULK BORROWER`,
  }));
  backend.failCalls = { 2: 'graphql', 3: 'throttle' };
  await open(page);
  await approveAll(page).click();
  await dialog(page).getByRole('button', { name: 'Approve 120 deletions' }).click();

  await expect(strip(page)).toHaveText(/Approved\s*50\s*·\s*70 not approved/);
  expect(backend.bulkCalls.map((c) => c.ids.length)).toEqual([50, 50, 20]);
  await strip(page).getByText('Why 70 requests are still pending').click();
  const failures = strip(page).locator('.appr-result-list li');
  await expect(failures).toHaveCount(70);
  await expect(failures.filter({ hasText: 'LN-2026-1050' })).toContainText('Deletion approvals are paused for maintenance.');
  await expect(failures.filter({ hasText: 'LN-2026-1119' })).toContainText('Too many requests at once');
  await expect(card(page, 'LN-2026-1050')).toBeVisible();
  await expect(card(page, 'LN-2026-1119')).toBeVisible();
  await expect(card(page, 'LN-2026-1000 ')).toHaveCount(0);
});

test('a 360px phone shows the bar, the review and the result with no sideways scroll', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  backend.outcomes = { '102': { outcome: 'not_decided', message: 'This loan has payments posted after the request was filed.' } };
  await open(page);
  await expect(bar(page)).toBeVisible();
  const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(await noSideScroll()).toBe(true);
  const approveBox = await approveAll(page).boundingBox();
  expect(approveBox?.height ?? 0).toBeGreaterThanOrEqual(48);
  await bar(page).scrollIntoViewIfNeeded();
  await shot(page, 'bar-phone-360.png');

  await approveAll(page).click();
  await expect(dialog(page)).toBeVisible();
  await shot(page, 'dialog-approve-phone-360.png');
  await dialog(page).getByRole('button', { name: 'Approve 4 deletions' }).click();

  await expect(strip(page)).toBeVisible();
  await strip(page).getByText('Why 1 request is still pending').click();
  expect(await noSideScroll()).toBe(true);
  await strip(page).scrollIntoViewIfNeeded();
  await shot(page, 'result-strip-phone-360.png');
});

test('no bar with fewer than two decidable requests', async ({ page, backend }) => {
  backend.pending = [PENDING[0], PENDING[6]]; // one to decide, one of the viewer's own
  await open(page);
  await expect(card(page, 'DELA CRUZ, JUAN')).toBeVisible();
  await expect(bar(page)).toHaveCount(0);
});

test('no bar for a viewer who is not an approver', async ({ page, backend }) => {
  backend.user = PROCESSOR;
  await open(page, PROCESSOR);
  await expect(page.getByRole('button', { name: /^Requests/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pending for me/ })).toHaveCount(0);
  await expect(bar(page)).toHaveCount(0);
});
