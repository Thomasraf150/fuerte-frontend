/**
 * Chart of Accounts: branch lock and the Branch column.
 *
 * The owner's rules: only Owners see every branch. Everyone else sees only the
 * accounts of their own branch (for FB, FC and FD that is the whole group; for
 * FA it is their FA branch) plus the company-wide accounts (blank Branch) their
 * branch uses, by posting to them or through loan settings, with no way to
 * switch that off and no banner. The Branch column shows each account's branch,
 * set from the account's name by the 2026_09_11 restamp and from its only user
 * by the 2026_09_12 migration.
 * It is a page rule, not data access control: getChartOfAccounts and every
 * account picker must keep the whole chart (scoping that query emptied every
 * picker when it was tried: b90d961, reverted in 6996de3).
 *
 * What this proves:
 *   1. each branch's accountant cannot find another branch's account, finds
 *      their own, and has no way to show other branches;
 *   2. an FC accountant sees no FA, FB or FD badge anywhere in the table;
 *   3. the Owner sees everything;
 *   4. the Branch column shows the account's own branch (FC Main), and FC sees
 *      a shared account it uses but not one only other branches use;
 *   5. getChartOfAccounts is still company-wide for a branch accountant;
 *   6. getCoaGroupView rejects an anonymous caller.
 *
 * Auth is seeded into localStorage from locally minted tokens, so no passwords
 * are needed. Mint the fixtures first, and revoke them when done:
 *
 *   docker exec -u www-data -e HOME=/tmp fuerte-app-1 php artisan tinker \
 *     --execute="require '/var/www/html/dev/_scratch/mint_coa_group_view_logins.php';"
 *   docker exec -u www-data -e HOME=/tmp fuerte-app-1 php artisan tinker \
 *     --execute="require '/var/www/html/dev/_scratch/revoke_coa_group_view_logins.php';"
 *
 * The account names below are real accounts in the chart as of 2026-09-11. If
 * one is renamed, update it here.
 */
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCRATCH = path.resolve(__dirname, '../../../../fuerte-backend/dev/_scratch');
const GRAPHQL = process.env.NEXT_PUBLIC_API_GRAPHQL ?? 'http://localhost:8080/fuerte-api';
/** Dev GraphQL carries a multi-second floor on every request. */
const SLOW = 90_000;
const GROUP_VIEW_QUERY = '{ getCoaGroupView { group_code hidden_account_ids } }';

type BranchCase = {
  key: string;
  code: string;
  /** Another branch's account: must not be findable. */
  hidden: string;
  /** The user's own branch's account: must be findable. */
  own: string;
};

const CASES: BranchCase[] = [
  // Marikina FA's accountant: another FA branch (La Union) is hidden too.
  { key: 'fa', code: 'FA', hidden: 'Commission Fees Payable - La Union', own: 'Commission Fees Payable - Main' },
  { key: 'fb', code: 'FB', hidden: 'Cash on Hand - FC Main', own: 'Cash on Hand - FB Main' },
  { key: 'fc', code: 'FC', hidden: 'Accounts Payable - FB', own: 'Cash on Hand - FC Main' },
  { key: 'fd', code: 'FD', hidden: 'NR-PRIVATE FC MAIN', own: 'Cash on Hand - FD Main' },
];

function fixture(key: string): string {
  const p = path.join(SCRATCH, `auth_coa_${key}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing auth fixture: ${p}\nMint it first (see the comment at the top of this file).`);
  }
  return fs.readFileSync(p, 'utf8');
}

function tokenOf(key: string): string {
  return JSON.parse(fixture(key)).state.authToken;
}

async function loginAs(page: Page, key: string): Promise<void> {
  const auth = fixture(key);
  await page.addInitScript((a) => {
    localStorage.setItem('authStore', a as string);
  }, auth);
}

/** Opens the COA page and waits until both the chart and the branch lock have loaded. */
async function openChart(page: Page): Promise<void> {
  const lockLoaded = page.waitForResponse(
    (r) => (r.request().postData() ?? '').includes('getCoaGroupView'),
    { timeout: SLOW },
  );
  await page.goto('/accounting/coa');
  await lockLoaded;
  await expect(row(page, 'Assets').first()).toBeVisible({ timeout: SLOW });
}

async function gql(request: APIRequestContext, query: string, token?: string) {
  const res = await request.post(GRAPHQL, {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    data: { query },
    timeout: SLOW,
  });
  return res.json();
}

async function search(page: Page, term: string): Promise<void> {
  await page.getByPlaceholder('Search by Account Name or Number...').fill(term);
}

function row(page: Page, name: string) {
  return page.locator('tbody tr', { hasText: name });
}

for (const c of CASES) {
  test(`${c.code} accountant sees only their own branch's accounts`, async ({ page, request }) => {
    test.setTimeout(240_000);
    await loginAs(page, c.key);
    await openChart(page);

    await expect(page.getByRole('button', { name: /all groups/i }), 'a non-Owner can switch groups').toHaveCount(0);
    await expect(page.getByText(/accounts only/i), 'the scope banner is back').toHaveCount(0);

    const api = await gql(request, GROUP_VIEW_QUERY, tokenOf(c.key));
    expect(api.data.getCoaGroupView.group_code).toBe(c.code);
    expect(api.data.getCoaGroupView.hidden_account_ids.length, 'nothing is hidden for this user').toBeGreaterThan(0);

    await search(page, c.own);
    await expect(row(page, c.own).first(), `${c.own} must be visible for ${c.code}`).toBeVisible({ timeout: SLOW });

    await search(page, c.hidden);
    await expect(page.getByText("No matches in your branch's accounts."), `${c.hidden} should be hidden`).toBeVisible({
      timeout: SLOW,
    });
    await expect(row(page, c.hidden)).toHaveCount(0);
  });
}

test('an FC accountant sees no FA, FB or FD account anywhere', async ({ page }) => {
  test.setTimeout(240_000);
  await loginAs(page, 'fc');
  await openChart(page);

  // "Payable" matches accounts across every group; the search expands the tree.
  await search(page, 'Payable');
  await expect(row(page, 'Payable').first()).toBeVisible({ timeout: SLOW });
  const branchCells = await page.locator('tbody tr td:nth-child(3)').allInnerTexts();
  expect(branchCells.length, 'no rows rendered').toBeGreaterThan(0);
  // Allowed: the user's own group (FC ...) and shared accounts FC uses (ALL ...).
  const foreign = branchCells.map((t) => t.trim()).filter((t) => !/^(FC|ALL)\b/.test(t));
  expect(foreign, 'rows from another branch are visible').toEqual([]);
});

test('Owner has no group and sees every account', async ({ page, request }) => {
  test.setTimeout(180_000);
  await loginAs(page, 'owner');
  await openChart(page);

  const api = await gql(request, GROUP_VIEW_QUERY, tokenOf('owner'));
  expect(api.data.getCoaGroupView.group_code).toBeNull();
  expect(api.data.getCoaGroupView.hidden_account_ids).toEqual([]);

  await search(page, 'Cash on Hand - FB Main');
  await expect(row(page, 'Cash on Hand - FB Main').first()).toBeVisible({ timeout: SLOW });
});

test('the Branch column shows the account\'s own branch', async ({ page }) => {
  test.setTimeout(180_000);
  await loginAs(page, 'fc');
  await openChart(page);

  await search(page, 'Cash on Hand - FC Main');
  const r = row(page, 'Cash on Hand - FC Main').first();
  await expect(r).toBeVisible({ timeout: SLOW });
  // Columns: Account Name, Account #, Group / Branch, ...
  await expect(page.getByRole('columnheader', { name: 'Group / Branch' })).toBeVisible();
  await expect(r.locator('td').nth(2), 'Group / Branch should say FC Main').toHaveText(/FC\s*FC Main/);

  // A shared account FC posts to names all groups and branches, not a blank cell.
  await search(page, 'Bank Service Charges');
  const shared = row(page, 'Bank Service Charges').first();
  await expect(shared).toBeVisible({ timeout: SLOW });
  await expect(shared.locator('td').nth(2), 'company-wide account is not labelled').toHaveText(/ALL\s*All groups & branches/);

  // A shared account only other branches use is not shown to FC.
  await search(page, 'Accounts Payable - Others');
  await expect(page.getByText("No matches in your branch's accounts.")).toBeVisible({ timeout: SLOW });
  await expect(row(page, 'Accounts Payable - Others')).toHaveCount(0);
});

test('FA accounts name their exact branch', async ({ page }) => {
  test.setTimeout(180_000);
  await loginAs(page, 'fa');
  await openChart(page);

  // Manila is a sub-branch of the Marikina FA branch.
  await search(page, 'INTEREST INCOME MANILA - Private');
  const r = row(page, 'INTEREST INCOME MANILA - Private').first();
  await expect(r).toBeVisible({ timeout: SLOW });
  await expect(r.locator('td').nth(2), 'should name group, branch and sub-branch').toHaveText(/FA\s*Marikina FA › Manila/);
});

test('getChartOfAccounts stays company-wide for a branch accountant', async ({ request }) => {
  test.setTimeout(180_000);
  const q = '{ getChartOfAccounts(input: { startDate: "", endDate: "" }) '
    + '{ number subAccounts { number subAccounts { number subAccounts { number } } } } }';
  const count = (nodes: any[]): number => nodes.reduce((n, a) => n + 1 + count(a.subAccounts ?? []), 0);

  const fc = count((await gql(request, q, tokenOf('fc'))).data.getChartOfAccounts);
  const owner = count((await gql(request, q, tokenOf('owner'))).data.getChartOfAccounts);

  expect(fc, 'the FC accountant received a cut-down chart').toBeGreaterThan(1000);
  expect(fc, 'account pickers would no longer see the whole chart').toBe(owner);
});

test('getCoaGroupView rejects an anonymous caller', async ({ request }) => {
  const res = await gql(request, GROUP_VIEW_QUERY);
  expect(res.data?.getCoaGroupView ?? null).toBeNull();
  expect(res.errors?.[0]?.message).toBe('Unauthenticated.');
});
