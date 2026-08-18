/**
 * Loans List filter wiring — regression suite.
 *
 * Guards against the 2026-07-02 incident (MB 1 report): the "Filter by Loan
 * Release Date & Branch" controls were a complete no-op because usePagination
 * forwarded only (first, page, search, statusFilter) to the fetch function and
 * silently dropped releaseMonth/releaseYear/branchSubId. A May filter showed
 * June releases.
 *
 * Strategy: every assertion is made at the NETWORK level (the loans table does
 * not render a release-date column). For each filter interaction we capture the
 * actual GraphQL request variables AND the response rows, then assert:
 *   1. the variable reached the wire,
 *   2. every returned row honors the filter,
 *   3. the result matches an independent direct-API query with the same filter.
 */
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { restLogin, gqlAs } from '../../helpers/e2e-helpers';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

const IDS_QUERY = `
  query($first: Int, $page: Int, $statusFilter: String, $releaseMonth: Int, $releaseYear: Int, $branchSubId: Int) {
    getLoans(first: $first, page: $page, statusFilter: $statusFilter,
             releaseMonth: $releaseMonth, releaseYear: $releaseYear, branchSubId: $branchSubId) {
      data { id released_date custom_status }
      paginatorInfo { total }
    }
  }`;

/**
 * One login for the whole file. /api/login allows 5 per minute per account, and
 * this suite needs auth in every test plus every direct-API cross-check.
 */
let sharedAuth: { token: string; user: any } | null = null;
async function getSharedAuth(request: APIRequestContext) {
  if (!sharedAuth) {
    sharedAuth = await restLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
  }
  return sharedAuth;
}

/**
 * Register a response listener for the next getLoans call whose request
 * variables satisfy `match`, run `act`, then return {vars, rows, total}.
 * The listener is registered BEFORE the action so the response can't be missed.
 */
async function actAndCaptureGetLoans(
  page: Page,
  act: () => Promise<unknown>,
  match: (vars: Record<string, any>) => boolean,
) {
  const respPromise = page.waitForResponse(
    (r) => {
      if (!r.url().includes('fuerte-api')) return false;
      const pd = r.request().postData() ?? '';
      if (!pd.includes('getLoans')) return false;
      try {
        return match(JSON.parse(pd).variables ?? {});
      } catch {
        return false;
      }
    },
    { timeout: 90000 },
  );
  await act();
  const resp = await respPromise;
  const vars = JSON.parse(resp.request().postData()!).variables ?? {};
  const raw = await resp.text();
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`getLoans response was not JSON (status ${resp.status()}): ${raw.slice(0, 200)}`);
  }
  expect(json.errors, `getLoans returned GraphQL errors: ${JSON.stringify(json.errors?.[0])}`).toBeUndefined();
  expect(json.data?.getLoans, `getLoans response had no data (status ${resp.status()}): ${raw.slice(0, 200)}`).toBeTruthy();
  const g = json.data.getLoans;
  return { vars, rows: g.data as any[], total: g.paginatorInfo.total as number };
}

test.describe('Loans List — filter wiring (server-side)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, request }) => {
    // Each test fires many sequential server-paginated getLoans calls. On a cold
    // dev backend (OPcache re-validating files over the Docker Desktop Windows
    // bind-mount) a single call can take ~10s, so the default 60s per-test
    // budget is not enough for the 7-capture status-chip test. This is purely an
    // environment allowance — the queries themselves are milliseconds when warm.
    test.setTimeout(240000);

    // Authenticate by seeding the store, NOT by driving the login form.
    // /api/login is rate limited to 5/min PER ACCOUNT
    // (RouteServiceProvider::boot, 'login' limiter). This suite used to log in
    // once per test plus once per direct-API check — about 7 for one account —
    // which stayed under the limit only because the tests were slow enough to
    // spread across minutes. Run beside another suite it tripped the throttle
    // and every test failed with "login did not redirect". One login, cached.
    const auth = await getSharedAuth(request);
    await page.addInitScript((state) => {
      localStorage.setItem('authStore', state as string);
    }, JSON.stringify({ state: { user: auth.user, authToken: auth.token }, version: 0 }));

    await page.goto('/loans-list', { waitUntil: 'domcontentloaded' });
    // Initial unfiltered load must complete before we start flipping filters.
    await page.waitForSelector('select[aria-label="Filter by release month"]', { timeout: 90000 });
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('release month+year filter reaches the API and every row honors it', async ({ page, request }) => {
    // Month first (fires releaseMonth-only fetch), then year.
    await actAndCaptureGetLoans(
      page,
      () => page.locator('select[aria-label="Filter by release month"]').selectOption('5'),
      (v) => v.releaseMonth === 5,
    );

    const { vars, rows, total } = await actAndCaptureGetLoans(
      page,
      () => page.locator('select[aria-label="Filter by release year"]').selectOption('2026'),
      (v) => v.releaseMonth === 5 && v.releaseYear === 2026,
    );

    // Filter change must reset to page 1 (page N of a smaller set = empty table).
    expect(vars.page).toBe(1);

    // THE regression: no June (or any non-May-2026) rows under a May 2026 filter.
    for (const row of rows) {
      expect(String(row.released_date ?? ''), `loan #${row.id} leaked through May-2026 filter`).toMatch(/^2026-05/);
    }

    // Independent direct-API cross-check with identical filters.
    const { token } = await getSharedAuth(request);
    const api = await gqlAs(request, token, IDS_QUERY, { first: 100, page: 1, releaseMonth: 5, releaseYear: 2026 });
    expect(api.errors).toBeUndefined();
    expect(total).toBe(api.data.getLoans.paginatorInfo.total);
    const apiIds = new Set(api.data.getLoans.data.map((r: any) => String(r.id)));
    for (const row of rows) {
      expect(apiIds.has(String(row.id)), `UI row ${row.id} missing from direct API result`).toBeTruthy();
    }
  });

  test('every status chip returns only rows whose badge matches the chip', async ({ page }) => {
    const CHIPS: Array<{ label: string; value: string; allowed: string[] }> = [
      { label: 'Posted', value: 'posted', allowed: ['Posted', 'Posted (Closed)'] },
      { label: 'Closed', value: 'closed', allowed: ['Closed'] },
      { label: 'For Approval', value: 'for_approval', allowed: ['For Approval'] },
      { label: 'Approved', value: 'approved', allowed: ['Approved'] },
      { label: 'For Releasing', value: 'for_releasing', allowed: ['For Releasing'] },
      { label: 'Released', value: 'released', allowed: ['Released'] },
    ];

    for (const chip of CHIPS) {
      const { rows } = await actAndCaptureGetLoans(
        page,
        () => page.getByRole('button', { name: `Filter by ${chip.label}`, exact: true }).click(),
        (v) => v.statusFilter === chip.value,
      );
      for (const row of rows) {
        expect(
          chip.allowed,
          `chip "${chip.label}": loan #${row.id} has status "${row.custom_status}"`,
        ).toContain(row.custom_status);
      }
    }

    // "All" clears the status variable entirely.
    const { vars } = await actAndCaptureGetLoans(
      page,
      () => page.getByRole('button', { name: 'Filter by All', exact: true }).click(),
      (v) => v.statusFilter === undefined,
    );
    expect(vars.statusFilter).toBeUndefined();
  });

  test('branch filter parameterizes the query and matches direct API', async ({ page, request }) => {
    // The branch picker is a searchable react-select (~60 flat sub-branches made
    // the native select unusable), so there are no <option value="id"> nodes to
    // read the expected id from.
    // Build a label -> id map from a DIRECT API call, independent of anything the
    // page does. Reading the expected id back out of the request under test would
    // make the assertion circular and blind to "user picked X, UI sent Y".
    const { token } = await getSharedAuth(request);
    const branchList = await gqlAs(request, token, `query { getAllBranch { id name } }`, {});
    expect(branchList.errors, 'getAllBranch failed').toBeUndefined();
    const branchIdByLabel = new Map<string, number>(
      (branchList.data.getAllBranch ?? []).map((b: any) => [String(b.name).trim(), Number(b.id)]),
    );
    expect(branchIdByLabel.size, 'getAllBranch returned no branches').toBeGreaterThan(0);

    const branchInput = page.locator('input[aria-label="Filter by branch"]');
    await expect(branchInput).toBeEnabled({ timeout: 90000 });

    // Open the menu and pick the first real branch (skip the "All Branches" entry).
    // Click the control, not the input — react-select's empty input is ~2px wide.
    const branchControl = page
      .locator('[class*="react-select__control"]')
      .filter({ has: page.locator('input[aria-label="Filter by branch"]') })
      .first();
    await branchControl.click();
    await page.waitForSelector('[class*="react-select__option"]', { timeout: 30000 });
    const branchOption = page
      .locator('[class*="react-select__option"]')
      .filter({ hasNotText: 'All Branches' })
      .first();
    await expect(branchOption, 'branch dropdown has no options — getAllBranch failed?').toBeVisible();

    const pickedLabel = (await branchOption.textContent())?.trim() ?? '';
    const expectedId = branchIdByLabel.get(pickedLabel);
    expect(expectedId, `no id captured for branch "${pickedLabel}" from getAllBranch`).toBeDefined();

    const { vars, rows, total } = await actAndCaptureGetLoans(
      page,
      () => branchOption.click(),
      (v) => typeof v.branchSubId === 'number',
    );
    expect(vars.page).toBe(1);
    // The real assertion: the UI sent the branch the user actually clicked.
    expect(Number(vars.branchSubId), `picked "${pickedLabel}" but the query sent a different branch`).toBe(expectedId);
    const branchValue = Number(vars.branchSubId);

    const api = await gqlAs(request, token, IDS_QUERY, { first: 100, page: 1, branchSubId: branchValue });
    expect(api.errors).toBeUndefined();
    expect(total).toBe(api.data.getLoans.paginatorInfo.total);
    const apiIds = new Set(api.data.getLoans.data.map((r: any) => String(r.id)));
    for (const row of rows) {
      expect(apiIds.has(String(row.id)), `UI row ${row.id} not in direct-API branch result`).toBeTruthy();
    }
  });

  test('combined filters stack, and Clear Filters resets everything', async ({ page }) => {
    // May 2026 + Released chip together.
    await actAndCaptureGetLoans(
      page,
      () => page.locator('select[aria-label="Filter by release month"]').selectOption('5'),
      (v) => v.releaseMonth === 5,
    );
    await actAndCaptureGetLoans(
      page,
      () => page.locator('select[aria-label="Filter by release year"]').selectOption('2026'),
      (v) => v.releaseMonth === 5 && v.releaseYear === 2026,
    );
    const combined = await actAndCaptureGetLoans(
      page,
      () => page.getByRole('button', { name: 'Filter by Released', exact: true }).click(),
      (v) => v.releaseMonth === 5 && v.releaseYear === 2026 && v.statusFilter === 'released',
    );
    for (const row of combined.rows) {
      expect(String(row.released_date ?? '')).toMatch(/^2026-05/);
      expect(row.custom_status).toBe('Released');
    }

    // Clear Filters drops every filter variable in one shot.
    const cleared = await actAndCaptureGetLoans(
      page,
      () => page.getByRole('button', { name: 'Clear Filters' }).click(),
      (v) => v.releaseMonth === undefined && v.releaseYear === undefined && v.branchSubId === undefined && v.statusFilter === undefined,
    );
    expect(cleared.vars.releaseMonth).toBeUndefined();

    // UI reflects the reset.
    await expect(page.locator('select[aria-label="Filter by release month"]')).toHaveValue('');
    await expect(page.locator('select[aria-label="Filter by release year"]')).toHaveValue('');
  });
});
