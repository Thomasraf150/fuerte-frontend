/**
 * Filter-interaction coverage for the collapsed usePagination auto-fetch effect.
 *
 * usePagination previously had FOUR mount-time effects (search / statusFilter /
 * extraFilters / initial-fetch), three of them needing first-run ref guards to
 * avoid duplicating the fourth. They are now ONE effect keyed on
 * [debouncedSearchQuery, statusFilter, extraFiltersKey].
 *
 * That means the status chips and the month/year/branch bar on /loans-list, and
 * the date filters on the accounting screens, all now flow through code that was
 * rewritten. The main regression suite only LOADS those pages — it never drives
 * the filters. This file does, because these are the paths most likely to break.
 *
 * Each check asserts the same two things:
 *   1. changing a filter fires EXACTLY ONE list query (not zero — the effect
 *      still runs; not two — no duplicate crept back in)
 *   2. that query resets to page 1
 *
 * Run against a PRODUCTION build (see pagination-guard-regression.spec.ts).
 */

import { test, expect, Page, Request } from '@playwright/test';

const FRONTEND = process.env.TEST_FRONTEND_URL ?? 'http://localhost:3001';
const REST_BASE = process.env.TEST_REST_URL ?? 'http://localhost:8080';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN ?? '';
const GRAPHQL_PATH = '/fuerte-api';
const SLOW = 120_000;
const SETTLE = 6000;

interface Call {
  op: string;
  status: number;
  search: string | null;
  page: number | null;
}

const CHROME_OPS =
  /^(maintenance|PendingForMeCount|PendingDeletionsForEntities|GetAllBranch|GetBranches|GetLoanProducts|GetLoanTypes|GetLoanClient|GetAreas|role)$/i;

function parseCall(req: Request): Omit<Call, 'status'> {
  try {
    const body = JSON.parse(req.postData() ?? '');
    const q: string = body.query ?? '';
    const named = q.match(/\b(?:query|mutation)\s+(\w+)/);
    const field = q.match(/\{\s*([A-Za-z_]\w*)/);
    const vars = body.variables ?? {};
    return {
      op: named ? named[1] : field ? field[1] : 'anonymous',
      search: vars.search ?? null,
      page: typeof vars.page === 'number' ? vars.page : null,
    };
  } catch {
    return { op: 'unparseable', search: null, page: null };
  }
}

function record(page: Page, sink: Call[]): void {
  page.on('response', (res) => {
    const req = res.request();
    if (!req.url().includes(GRAPHQL_PATH) || req.method() !== 'POST') return;
    sink.push({ ...parseCall(req), status: res.status() });
  });
}

/** Only the page's own paginated list query — not dropdown/chrome queries. */
function listCalls(calls: Call[]): Call[] {
  return calls.filter((c) => !CHROME_OPS.test(c.op));
}

async function injectAuth(page: Page): Promise<void> {
  const res = await page.request.get(`${REST_BASE}/api/user`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}`, Accept: 'application/json' },
  });
  expect(res.ok(), `token did not resolve a user: HTTP ${res.status()}`).toBeTruthy();
  const user = await res.json();
  await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([u, t]) => {
      localStorage.setItem('authStore', JSON.stringify({ state: { user: u, authToken: t }, version: 0 }));
    },
    [user, AUTH_TOKEN] as const,
  );
}

async function waitForRows(page: Page): Promise<void> {
  await expect
    .poll(() => page.locator('[role="row"]').count().catch(() => 0), {
      timeout: SLOW,
      intervals: [500],
    })
    .toBeGreaterThan(1);
}

/**
 * Resolve when the page's own list query RESPONDS.
 *
 * Do not replace this with a fixed sleep. The dev backend answers heavy list
 * queries in 5-15s under load, and `page.on('response')` only records completed
 * responses — a fixed wait reports "(none)" while the table is still visibly
 * showing "Loading data…", which reads as a broken filter when nothing is wrong.
 */
function waitForListResponse(page: Page): Promise<unknown> {
  return page.waitForResponse(
    (res) => {
      const req = res.request();
      if (!req.url().includes(GRAPHQL_PATH) || req.method() !== 'POST') return false;
      return !CHROME_OPS.test(parseCall(req).op);
    },
    { timeout: SLOW },
  );
}

/** Assert a filter change produced exactly one page-1 list query. */
function expectSingleReset(calls: Call[], label: string): void {
  const list = listCalls(calls);
  console.log(`${label}: ${list.map((c) => `${c.op}(page=${c.page},search=${c.search})`).join(', ') || '(none)'}`);
  expect(calls.filter((c) => c.status === 429), `${label} was throttled`).toHaveLength(0);
  expect(list.length, `${label} should fire exactly one list query`).toBe(1);
  expect(list[0].page, `${label} should reset to page 1`).toBe(1);
}

test.describe('filter interactions drive exactly one refetch', () => {
  test.setTimeout(300_000);
  test.skip(!AUTH_TOKEN, 'set TEST_AUTH_TOKEN to run');

  test('/loans-list: status chip fires one page-1 query', async ({ page }) => {
    await injectAuth(page);
    await page.goto(`${FRONTEND}/loans-list`, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);

    const calls: Call[] = [];
    record(page, calls);

    const chip = page.getByRole('button', { name: 'Filter by Posted' });
    await expect(chip).toBeVisible();
    const landed = waitForListResponse(page);
    await chip.click();
    await landed;
    await page.waitForTimeout(SETTLE); // window for a duplicate to show up

    expectSingleReset(calls, 'status chip -> Posted');
  });

  test('/loans-list: release-month filter fires one page-1 query', async ({ page }) => {
    await injectAuth(page);
    await page.goto(`${FRONTEND}/loans-list`, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);

    const calls: Call[] = [];
    record(page, calls);

    const month = page.getByLabel('Filter by release month');
    await expect(month).toBeVisible();
    const landed = waitForListResponse(page);
    await month.selectOption('6'); // June
    await landed;
    await page.waitForTimeout(SETTLE);

    expectSingleReset(calls, 'month filter -> June');
  });

  test('/accounting/crj: date filter fires one page-1 query', async ({ page }) => {
    await injectAuth(page);
    await page.goto(`${FRONTEND}/accounting/crj`, { waitUntil: 'domcontentloaded' });
    // The journal list can legitimately be empty; wait on the network instead.
    await page
      .waitForResponse(
        (res) =>
          res.request().url().includes(GRAPHQL_PATH) &&
          res.request().method() === 'POST' &&
          !CHROME_OPS.test(parseCall(res.request()).op),
        { timeout: SLOW },
      )
      .catch(() => {});
    await page.waitForTimeout(SETTLE);

    const calls: Call[] = [];
    record(page, calls);

    // VoucherFilters renders react-datepicker inputs; type a date into the first.
    const dateInput = page.locator('input.react-datepicker-ignore-onclickoutside, .react-datepicker__input-container input').first();
    if ((await dateInput.count()) === 0) {
      console.log('no date input found on /accounting/crj — skipping');
      test.skip();
    }
    const landed = waitForListResponse(page);
    await dateInput.click();
    await dateInput.fill('01/01/2026');
    await dateInput.press('Enter');
    await landed;
    await page.waitForTimeout(SETTLE);

    expectSingleReset(calls, 'crj start-date filter');
  });

  test('/borrowers: page-size change fires one query with the new size', async ({ page }) => {
    await injectAuth(page);
    await page.goto(`${FRONTEND}/borrowers`, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);

    const calls: Call[] = [];
    const sizes: number[] = [];
    page.on('response', (res) => {
      const req = res.request();
      if (!req.url().includes(GRAPHQL_PATH) || req.method() !== 'POST') return;
      try {
        const first = JSON.parse(req.postData() ?? '{}')?.variables?.first;
        if (typeof first === 'number') sizes.push(first);
      } catch {
        /* ignore */
      }
    });
    record(page, calls);

    const sizeSelect = page.locator('select').first();
    const landed = waitForListResponse(page);
    await sizeSelect.selectOption('50');
    await landed;
    await page.waitForTimeout(SETTLE);

    console.log('page sizes requested:', sizes);
    expectSingleReset(calls, 'page size -> 50');
    expect(sizes).toContain(50);
  });
});
