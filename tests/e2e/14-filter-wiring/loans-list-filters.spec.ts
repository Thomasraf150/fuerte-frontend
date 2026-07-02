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
import { test, expect, Page } from '@playwright/test';
import { uiLogin, restLogin, gqlAs } from '../../helpers/e2e-helpers';

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
    { timeout: 30000 },
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

  test.beforeEach(async ({ page }) => {
    // Each test fires many sequential server-paginated getLoans calls. On a cold
    // dev backend (OPcache re-validating files over the Docker Desktop Windows
    // bind-mount) a single call can take ~10s, so the default 60s per-test
    // budget is not enough for the 7-capture status-chip test. This is purely an
    // environment allowance — the queries themselves are milliseconds when warm.
    test.setTimeout(240000);
    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/loans-list', { waitUntil: 'domcontentloaded' });
    // Initial unfiltered load must complete before we start flipping filters.
    await page.waitForSelector('select[aria-label="Filter by release month"]', { timeout: 20000 });
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
    const { token } = await restLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
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
    const branchSelect = page.locator('select[aria-label="Filter by branch"]');
    await expect(branchSelect).toBeEnabled({ timeout: 20000 });

    // Pick the first real branch option (skip the "All Branches" placeholder).
    const firstBranch = branchSelect.locator('option:not([value=""])').first();
    const branchValue = await firstBranch.getAttribute('value');
    expect(branchValue, 'branch dropdown has no options — getAllBranch failed?').toBeTruthy();

    const { vars, rows, total } = await actAndCaptureGetLoans(
      page,
      () => branchSelect.selectOption(branchValue!),
      (v) => v.branchSubId === Number(branchValue),
    );
    expect(vars.page).toBe(1);

    const { token } = await restLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    const api = await gqlAs(request, token, IDS_QUERY, { first: 100, page: 1, branchSubId: Number(branchValue) });
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
