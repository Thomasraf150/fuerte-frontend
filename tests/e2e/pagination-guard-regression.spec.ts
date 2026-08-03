/**
 * REGRESSION SUITE for the usePagination first-run search guard.
 *
 * Context: usePagination's debounced-search effect had no first-run guard, so
 * on mount it took its else-branch and fired a fetch identical to the dedicated
 * initial-fetch effect — two identical POSTs per list-page mount, on all 15
 * consumers of the hook. The guard removes the duplicate. Because the hook is
 * shared by every list page in the app, this suite proves the guard did not
 * change user-visible behavior.
 *
 * It also renders the HTTP 429 error banner (by intercepting the GraphQL call)
 * so the exact production symptom is confirmed in a real browser.
 *
 * Run against a PRODUCTION build — request counts differ under `next dev`,
 * where StrictMode double-invokes every effect:
 *
 *   NEXT_PUBLIC_API_URL=http://localhost:8080/api \
 *   NEXT_PUBLIC_API_GRAPHQL=http://localhost:8080/fuerte-api \
 *   NEXT_PUBLIC_BASE_URL=http://localhost:8080 npm run build
 *   npx next start -p 3001 &
 *
 *   TOKEN=$(docker exec fuerte-app-1 php artisan tinker --execute="\
 *     \$u=App\Models\User::find(1); echo \$u->createToken('e2e-pg')->plainTextToken;")
 *   TEST_AUTH_TOKEN="$TOKEN" TEST_FRONTEND_URL=http://localhost:3001 \
 *     npx playwright test pagination-guard-regression
 *
 * Read-only: navigates, types in search boxes, pages. Writes no business data.
 */

import { test, expect, Page, Request } from '@playwright/test';

const FRONTEND = process.env.TEST_FRONTEND_URL ?? 'http://localhost:3001';
const REST_BASE = process.env.TEST_REST_URL ?? 'http://localhost:8080';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN ?? '';
const GRAPHQL_PATH = '/fuerte-api';

/**
 * The dev backend answers GraphQL in ~5-9s, and slower under concurrent load,
 * so fixed sleeps are unreliable. Waits below are event-driven; this is only
 * the grace window used to catch a DUPLICATE request arriving after the first
 * one has already rendered.
 */
const DUPE_WINDOW = 6000;
const SLOW = 120_000;

interface Call {
  op: string;
  status: number;
  search: string | null;
  page: number | null;
  first: number | null;
}

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
      first: typeof vars.first === 'number' ? vars.first : null,
    };
  } catch {
    return { op: 'unparseable', search: null, page: null, first: null };
  }
}

/**
 * Identity of a request for duplicate detection. A "duplicate" is the SAME
 * operation with the SAME variables — not merely two page-1 queries, since a
 * page legitimately fires unrelated dropdown queries (e.g. /loans-list also
 * fetches loan products with first=200,page=1).
 */
function callKey(c: Call): string {
  return `${c.op}|first=${c.first}|page=${c.page}|search=${c.search}`;
}

function record(page: Page, sink: Call[]): void {
  page.on('response', (res) => {
    const req = res.request();
    if (!req.url().includes(GRAPHQL_PATH) || req.method() !== 'POST') return;
    sink.push({ ...parseCall(req), status: res.status() });
  });
}

/** The list query for a page = the op fired most often that isn't chrome. */
const CHROME_OPS = /^(maintenance|PendingForMeCount|PendingDeletionsForEntities)$/i;
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

/** Rows rendered by react-data-table-component (includes the header row). */
async function rowCount(page: Page): Promise<number> {
  return page.locator('[role="row"]').count().catch(() => 0);
}

/** Block until the table has actually rendered data rows. */
async function waitForRows(page: Page): Promise<void> {
  await expect
    .poll(() => rowCount(page), { timeout: SLOW, intervals: [500] })
    .toBeGreaterThan(1);
}

/** Block until a non-chrome (list) GraphQL response matching `predicate` lands. */
async function waitForListResponse(
  page: Page,
  predicate: (c: { op: string; search: string | null; page: number | null }) => boolean,
): Promise<void> {
  await page.waitForResponse(
    (res) => {
      const req = res.request();
      if (!req.url().includes(GRAPHQL_PATH) || req.method() !== 'POST') return false;
      const c = parseCall(req);
      return !CHROME_OPS.test(c.op) && predicate(c);
    },
    { timeout: SLOW },
  );
}

test.describe('usePagination first-run guard — regression', () => {
  test.setTimeout(240_000);
  test.skip(!AUTH_TOKEN, 'set TEST_AUTH_TOKEN to run (see header comment)');

  /**
   * The production symptom, rendered for real. Intercepts the GraphQL POST and
   * replies with Laravel's throttle response so the whole client path runs:
   * parseGraphQLResponse -> statusMessage(429) -> usePagination setError ->
   * BorrowerList error banner.
   */
  test('429 renders the honest throttle banner (not a cache/schema red herring)', async ({ page }) => {
    await injectAuth(page);

    await page.route(`**${GRAPHQL_PATH}`, async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}');
      // Let the layout's maintenance probe succeed; throttle only the list query.
      if ((body.query ?? '').includes('maintenance')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { maintenance: { data: { isMaintenanceModeOn: 0 } } } }),
        });
      }
      return route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Too Many Attempts.' }),
      });
    });

    await page.goto(`${FRONTEND}/borrowers`, { waitUntil: 'domcontentloaded' });
    const banner = page.locator('text=Too many requests at once');
    await expect(banner).toBeVisible({ timeout: 30000 });

    const text = await page.locator('text=Error loading borrowers').first().innerText();
    console.log('\n=== 429 BANNER TEXT ===\n' + text);

    // The banner must offer a Retry affordance.
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

    await page.screenshot({ path: 'test-results/429-banner-rendered.png', fullPage: true });
    // It must NOT blame the Lighthouse cache / schema (the old false lead).
    expect(text.toLowerCase()).not.toContain('cache');
    expect(text.toLowerCase()).not.toContain('schema');
  });

  test('borrowers: exactly ONE list query per mount', async ({ page }) => {
    await injectAuth(page);
    const calls: Call[] = [];
    record(page, calls);

    await page.goto(`${FRONTEND}/borrowers`, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);
    // Give any duplicate a fair chance to arrive before asserting there is none.
    await page.waitForTimeout(DUPE_WINDOW);

    const list = listCalls(calls);
    console.log('list queries on mount:', list.map((c) => `${c.op}(page=${c.page},search=${c.search})`));
    expect(list).toHaveLength(1);
    expect(calls.filter((c) => c.status === 429)).toHaveLength(0);
  });

  /**
   * THE critical path for this change: the guard lives in the search effect, so
   * searching and clearing must still refetch. Pre-fix, mount consumed one of
   * these fetches; post-fix the guard consumes the mount run instead.
   */
  test('borrowers: search fires a query, clearing restores the list', async ({ page }) => {
    await injectAuth(page);
    await page.goto(`${FRONTEND}/borrowers`, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);

    const baselineRows = await rowCount(page);
    console.log('baseline rows:', baselineRows);

    const calls: Call[] = [];
    record(page, calls);

    const search = page.locator('input[placeholder*="Search" i]').first();
    await expect(search).toBeVisible();

    // --- type a query -> must fire a search fetch, reset to page 1 ---
    const searchLanded = waitForListResponse(page, (c) => !!c.search);
    await search.fill('a');
    await searchLanded;

    const searched = listCalls(calls).filter((c) => c.search);
    console.log('search calls:', searched.map((c) => `${c.op}(page=${c.page},search=${c.search})`));
    expect(searched.length).toBeGreaterThanOrEqual(1);
    expect(searched[0].page).toBe(1);

    // --- clear it -> must fire another fetch and restore the list ---
    calls.length = 0;
    const clearLanded = waitForListResponse(page, (c) => !c.search);
    await search.fill('');
    await clearLanded;
    await waitForRows(page);

    const cleared = listCalls(calls);
    console.log('clear calls:', cleared.map((c) => `${c.op}(page=${c.page},search=${c.search})`));
    expect(cleared.length).toBeGreaterThanOrEqual(1);
    expect(cleared.every((c) => !c.search)).toBeTruthy();
    // INTENTIONAL BEHAVIOUR CHANGE: clearing the search box now returns to page
    // 1 rather than holding the page you were on. Collapsing usePagination's
    // four mount effects into one made every filter change reset to page 1
    // uniformly — which also avoids stranding you on a page that no longer
    // exists in the restored (larger or smaller) result set.
    expect(cleared[0].page).toBe(1);

    const restoredRows = await rowCount(page);
    console.log('restored rows:', restoredRows);
    expect(restoredRows).toBeGreaterThan(1);
  });

  test('borrowers: paging to page 2 fetches page 2', async ({ page }) => {
    await injectAuth(page);
    await page.goto(`${FRONTEND}/borrowers`, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);

    const calls: Call[] = [];
    record(page, calls);

    // CustomDatatable renders numbered page buttons (no "Next" control).
    const pageTwo = page.getByRole('button', { name: '2', exact: true }).first();
    if ((await pageTwo.count()) === 0) {
      console.log('only one page of data — skipping');
      test.skip();
    }
    const pagedLanded = waitForListResponse(page, (c) => c.page === 2);
    await pageTwo.click();
    await pagedLanded;

    const paged = listCalls(calls);
    console.log('paging calls:', paged.map((c) => `${c.op}(page=${c.page})`));
    expect(paged.some((c) => c.page === 2)).toBeTruthy();
    await expect(page.locator('text=/Page\\s*2\\s*of/i').first()).toBeVisible();
  });
});

/**
 * Broad smoke across every usePagination-backed list page: no operation may
 * fire twice with identical variables on mount.
 *
 * Route list derived from a full audit of all 15 usePagination consumers.
 * Deliberately excluded: /audit-logs (it is just `redirect('/')`) and all
 * [id]/detail routes (they mount list hooks incidentally and have their own
 * pre-existing multi-mount noise, unrelated to this change).
 */
const SMOKE_ROUTES = (process.env.TEST_SMOKE_ROUTES ??
  [
    '/loans-list',
    '/statement-of-account',
    '/payment-posting',
    '/clients',
    '/collection-list',
    '/companies',
    '/users-setup',
    '/area',
    '/sub-area',
    '/loan-products',
    '/loan-codes',
    '/accounting/general-voucher',
    '/accounting/general-journal',
    '/accounting/crj',
    '/accounting/cdj',
    '/accounting/adjusting-entries',
  ].join(',')
).split(',').map((r) => r.trim()).filter(Boolean);

/**
 * Routes with a KNOWN, PRE-EXISTING duplicate that this change does not cause
 * and does not claim to fix. Recorded explicitly rather than silently tolerated.
 *
 * /loan-codes: useLoanCodes.tsx:160 has its own mount effect calling
 * fetchLoanCodes() -> fetchLoanCodesForPagination(20, 1), the identical query
 * usePagination's initial effect already fires. Two getLoanCodes POSTs per
 * mount. Fixing it belongs in a separate change to useLoanCodes.
 */
const KNOWN_DUPLICATE_ROUTES: Record<string, string> = {
  '/loan-codes': 'pre-existing: useLoanCodes.tsx:160 mount effect refires the list query',

  // NOTE: the four VoucherFilters-backed accounting lists (/accounting/
  // general-voucher, general-journal, crj, cdj) USED to belong here too.
  // VoucherFilters emits onChange({...}) from a mount effect
  // (VoucherFilters.tsx:51-58), handing back a fresh object literal whose values
  // equal the hook's initial state; because useGeneralVoucher/useGeneralJournal
  // keyed their refetch effect on object IDENTITY, that no-op emit re-fired it
  // after the first-run guard was spent -> goToPage(1) -> a second identical
  // query. Both hooks now key on JSON.stringify(filters), so those routes are
  // held to the strict no-duplicates rule below.
};

test.describe('usePagination consumers — smoke', () => {
  test.setTimeout(300_000);
  test.skip(!AUTH_TOKEN, 'set TEST_AUTH_TOKEN to run');

  for (const route of SMOKE_ROUTES) {
    test(`${route} mounts with one list query and no error`, async ({ page }) => {
      await injectAuth(page);
      const calls: Call[] = [];
      const consoleErrors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
      });
      record(page, calls);

      const resp = await page.goto(`${FRONTEND}${route}`, { waitUntil: 'domcontentloaded' });
      if (resp && resp.status() === 404) {
        console.log(`${route} -> 404, route does not exist; skipping`);
        test.skip();
      }
      // Wait for the page's own list query to resolve, then leave a window for a
      // duplicate. Some routes legitimately render zero rows, so wait on the
      // network rather than on rows.
      let sawListQuery = true;
      await waitForListResponse(page, () => true).catch(() => {
        sawListQuery = false;
      });
      await page.waitForTimeout(DUPE_WINDOW);

      const list = listCalls(calls);
      const tally = new Map<string, number>();
      for (const c of list) tally.set(callKey(c), (tally.get(callKey(c)) ?? 0) + 1);
      const duplicated = [...tally.entries()].filter(([, n]) => n > 1);

      console.log(
        `${route}: ${list.length} query(ies) -> ` +
          [...tally.entries()].map(([k, n]) => `${k} x${n}`).join(' | '),
      );
      if (consoleErrors.length) console.log(`${route} console errors:`, consoleErrors.slice(0, 3));

      await page.screenshot({
        path: `test-results/smoke${route.replace(/\//g, '_')}.png`,
        fullPage: true,
      });

      // Fail loudly rather than vacuously "passing" a route that never rendered.
      // A broken harness (e.g. serving a standalone build with `next start`, so
      // static chunks 404/400 and the client never hydrates) leaves the app stuck
      // on the global Loading overlay, firing zero queries — which would satisfy
      // a naive "no duplicates" assertion.
      expect(
        sawListQuery,
        `${route} fired NO list query at all — the page did not render (check the screenshot)`,
      ).toBeTruthy();

      // A 429 would inflate counts via fetchWithRecache's 5x retry, so assert
      // this before counting — otherwise a throttle reads as a duplicate.
      expect(calls.filter((c) => c.status === 429), `${route} was throttled`).toHaveLength(0);

      const known = KNOWN_DUPLICATE_ROUTES[route];
      if (known) {
        console.log(`${route}: tolerating known duplicate — ${known}`);
        expect(duplicated.length, `${route} duplicates beyond the known one`).toBeLessThanOrEqual(1);
      } else {
        expect(
          duplicated,
          `${route} fired identical queries more than once: ${JSON.stringify(duplicated)}`,
        ).toEqual([]);
      }
    });
  }
});
