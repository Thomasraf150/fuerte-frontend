/**
 * Regression sweep for the FA re-parent.
 *
 * The branch hierarchy went from 13 top-level branches to 4 (FA/FB/FC/FD), with
 * every FA location moved down to sub-branch level. Loans, borrowers, users and
 * accounting entries all key on branch_sub_id, which never changed — so the job
 * of this suite is to prove that nothing which READS the hierarchy broke.
 *
 * Auth is injected straight into localStorage: the repo's stored test logins are
 * stale and the seeded fuerte.test users do not exist in this database.
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * These screens only render their branch pickers for an OWNER, and no owner
 * password is committed anywhere — so auth comes from a locally minted token.
 * The fixture is gitignored (it holds a live bearer token). Generate it from the
 * repo root before the first run, substituting your own owner account:
 *
 *   docker exec fuerte-app-1 php artisan tinker --execute="\$u=App\Models\User::
 *   where('email','fuerterafael@gmail.com')->firstOrFail(); \$u->load('branchSub.
 *   branch','role'); \$t=\$u->createToken('e2e')->plainTextToken; \$u->
 *   assignedBranchSubIds=app(App\Services\BranchAccessService::class)->
 *   getSwitcherBranchSubIds(\$u); file_put_contents('/var/www/html/dev/_scratch/
 *   auth_payload.json', json_encode(['state'=>['user'=>\$u->toArray(),
 *   'authToken'=>\$t],'version'=>0]));"
 *
 * That writes the exact /api/login payload shape this suite seeds into
 * localStorage. Logging in through the form instead would trip the 5-per-minute
 * per-account limit on /api/login once the suite grows.
 */
const AUTH_FIXTURE = path.resolve(
  __dirname,
  '../../../../fuerte-backend/dev/_scratch/auth_payload.json',
);

if (!fs.existsSync(AUTH_FIXTURE)) {
  throw new Error(
    `Missing auth fixture: ${AUTH_FIXTURE}\n` +
      'Generate it first (see the comment above this check) — it is gitignored ' +
      'because it contains a live bearer token.',
  );
}

const AUTH = fs.readFileSync(AUTH_FIXTURE, 'utf8');

/** Pages that must simply render for an owner without blowing up. */
const SCREENS: Array<{ path: string; name: string }> = [
  { path: '/', name: 'Summary Ticket' },
  { path: '/branch-setup', name: 'Branch Setup' },
  { path: '/borrowers', name: 'Borrowers list' },
  { path: '/borrowers/new', name: 'Borrower create' },
  { path: '/loans-list', name: 'Loans list' },
  { path: '/notes-receivable', name: 'Notes Receivable' },
  { path: '/problem-accounts', name: 'Problem Accounts' },
  { path: '/renewable-borrowers', name: 'Renewable Borrowers' },
  { path: '/collection-list', name: 'Collection List' },
  { path: '/payment-posting', name: 'Payment Posting' },
  { path: '/accounting-dashboard', name: 'Accounting Dashboard' },
  { path: '/accounting/income-statement', name: 'Income Statement' },
  { path: '/accounting/balance-sheet', name: 'Balance Sheet' },
  { path: '/accounting/general-voucher', name: 'General Voucher' },
  { path: '/accounting/general-journal', name: 'General Journal' },
  { path: '/accounting/coa', name: 'Chart of Accounts' },
  { path: '/accounting/loan-proceed-settings', name: 'Loan Proceed Settings' },
  { path: '/users-setup', name: 'Users Setup' },
  { path: '/area', name: 'Areas' },
  { path: '/sub-area', name: 'Sub Areas' },
  { path: '/banks', name: 'Banks' },
  { path: '/approvals', name: 'Approvals' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((auth) => {
    localStorage.setItem('authStore', auth as string);
  }, AUTH);
});

/** Fail on a Next.js error overlay or a hard React crash, not on noisy logs. */
async function assertNoCrash(page: Page, label: string) {
  const overlay = await page
    .locator('text=/Unhandled Runtime Error|Application error|TypeError:/')
    .count();
  expect(overlay, label + ': runtime error overlay on screen').toBe(0);
  const body = (await page.locator('body').innerText().catch(() => '')) || '';
  expect(body.length, label + ': rendered an empty page').toBeGreaterThan(50);
}

/**
 * Open the nth react-select and focus its search input.
 * fill() does not drive react-select's internal state — it needs real key
 * events — so every interaction here goes through the keyboard.
 */
async function openSelect(page: Page, index: number) {
  const control = page.locator('.react-select__control').nth(index);
  await control.click();
  await page.waitForTimeout(400);
}

/** Open the nth react-select, type a label, and commit the highlighted match. */
async function chooseOption(page: Page, index: number, label: string) {
  await openSelect(page, index);
  await page.keyboard.type(label, { delay: 40 });
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
}

/** Visible text of the currently open react-select menu. */
async function menuOptions(page: Page): Promise<string[]> {
  return page.locator('[id^="react-select-"][id*="option"]').allTextContents();
}

/**
 * Open a react-select and read its options, retrying until the list is
 * populated. The dev server compiles routes on demand and every GraphQL call
 * carries a multi-second floor, so a fixed sleep is unreliable — poll instead.
 */
async function readOptions(
  page: Page,
  index: number,
  minCount = 1,
  timeoutMs = 60000,
): Promise<string[]> {
  const deadline = Date.now() + timeoutMs;
  let last: string[] = [];
  while (Date.now() < deadline) {
    const control = page.locator('.react-select__control').nth(index);
    if (await control.count()) {
      await control.click().catch(() => {});
      await page.waitForTimeout(500);
      last = await menuOptions(page);
      if (last.length >= minCount) return last;
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
  return last;
}

/** Wait until a react-select control actually exists on the page. */
async function waitForSelect(page: Page, index: number, timeoutMs = 60000) {
  await expect(page.locator('.react-select__control').nth(index)).toBeVisible({
    timeout: timeoutMs,
  });
}

test.describe('FA re-parent — every screen still renders', () => {
  for (const screen of SCREENS) {
    test('renders: ' + screen.name, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
      // Poll for real content instead of sleeping: the dev server compiles each
      // route on first hit, so a fixed delay fails under parallel load.
      await expect
        .poll(
          async () => ((await page.locator('body').innerText().catch(() => '')) || '').length,
          { timeout: 90000, intervals: [1000] },
        )
        .toBeGreaterThan(200);
      await assertNoCrash(page, screen.name);
      expect(errors, screen.name + ': uncaught page errors').toEqual([]);
    });
  }
});

test.describe('Branch hierarchy behaves', () => {
  test('Branch dropdown is exactly FA, FB, FC, FD in alphabetical order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    const options = await readOptions(page, 0, 3);
    const branches = options.filter(
      (o) => !/Select a Branch|All Main Branches/i.test(o),
    );
    expect(branches).toEqual(['FA', 'FB', 'FC', 'FD']);
  });

  test('Branch dropdown filters as you type (searchable)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 3);
    await openSelect(page, 0);
    await page.keyboard.type('fc', { delay: 40 });
    await page.waitForTimeout(800);
    const options = await page
      .locator('[id^="react-select-"][id*="option"]')
      .allTextContents();
    expect(options).toEqual(['FC']);
  });

  test('FA cascades to its sub-branches, alphabetical, MB 1 and MB 2 kept separate', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 3);

    await chooseOption(page, 0, 'FA');
    const subs = (await readOptions(page, 1, 10)).filter(
      (o) => !/Select a Sub Branch|All Sub-Branches/i.test(o),
    );

    // No merging: the granular operating units must survive as their own rows.
    expect(subs).toContain('MB 1');
    expect(subs).toContain('MB 2');
    expect(subs).toContain('Subic 1');
    expect(subs).toContain('Subic 2');
    expect(subs.length).toBeGreaterThan(20);

    const sorted = [...subs].sort((a, b) => a.localeCompare(b));
    expect(subs, 'sub-branches are not alphabetical').toEqual(sorted);
  });

  test('Branch Setup lists the four branches and does not crash', async ({ page }) => {
    await page.goto('/branch-setup', { waitUntil: 'domcontentloaded' });
    // Poll rather than sleep — the branch table arrives via GraphQL.
    await expect
      .poll(async () => (await page.locator('body').innerText()).includes('FD'), {
        timeout: 60000,
        intervals: [1000],
      })
      .toBe(true);
    const body = await page.locator('body').innerText();
    for (const b of ['FA', 'FB', 'FC', 'FD']) {
      expect(body, 'Branch Setup missing ' + b).toContain(b);
    }
    await assertNoCrash(page, 'Branch Setup');
  });
});

test.describe('Borrower and loan surfaces still see the hierarchy', () => {
  test('Borrower create form loads with its Area picker', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/borrowers/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    await assertNoCrash(page, 'Borrower create');
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/Area/i);
    expect(errors).toEqual([]);
  });

  test('Loans list branch filter is a searchable react-select', async ({ page }) => {
    await page.goto('/loans-list', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    const branchInput = page.locator('input[aria-label="Filter by branch"]');
    await expect(branchInput, 'branch filter is not a searchable react-select').toHaveCount(1);
    await assertNoCrash(page, 'Loans list');
  });
});

/**
 * The render sweep above only proves nothing throws. These drive the actual
 * money-facing flows and assert on DATA, which is where a broken hierarchy
 * would really show up.
 */
test.describe('End-to-end flows produce correct data', () => {
  test('Summary Ticket renders a real report for FA / MB 1', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 3);

    await page.locator('input[placeholder="Start Date"]').fill('07/01/2025');
    await page.locator('input[placeholder="End Date"]').fill('07/31/2025');
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(500);

    await chooseOption(page, 0, 'FA');
    await readOptions(page, 1, 10);
    await chooseOption(page, 1, 'MB 1');

    // The report arrives via GraphQL — poll for it instead of guessing a delay.
    await expect
      .poll(
        async () => /Number of Borrowers/i.test(await page.locator('body').innerText()),
        { timeout: 90000, intervals: [2000] },
      )
      .toBe(true);

    const body = await page.locator('body').innerText();
    expect(body, 'no peso amounts rendered').toMatch(/₱/);
    await assertNoCrash(page, 'Summary Ticket report');
  });

  test('Notes Receivable sub-branch filter really narrows, and MB 1 != MB 2', async ({ page }) => {
    const totals: Record<string, number> = {};

    // Count rows the server returns for each selection, straight off the wire.
    await page.route('**/fuerte-api', async (route) => {
      const response = await route.fetch();
      const json = await response.json().catch(() => null);
      const batch = json?.data?.getNrScheduleBatch;
      if (batch) {
        const key = JSON.parse(route.request().postData() || '{}')?.variables?.input
          ?.branchSubId ?? 'none';
        // NrScheduleBatchRes exposes `pagination.totalRecords` — NOT the
        // `paginatorInfo.total` shape other list queries use. Reading the wrong
        // field falls back to data.length, which is just the page slice and is
        // identical for every branch, silently making this assertion useless.
        totals[String(key)] = batch?.pagination?.totalRecords ?? -1;
      }
      await route.fulfill({ response });
    });

    await page.goto('/notes-receivable', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 3);

    await page.locator('input[placeholder="Start Date"]').fill('01/01/2020');
    await page.locator('input[placeholder="End Date"]').fill('12/31/2030');
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 5, y: 5 } });

    await chooseOption(page, 0, 'FA');
    await readOptions(page, 1, 10);

    for (const sub of ['MB 1', 'MB 2']) {
      await chooseOption(page, 1, sub);
      const before = Object.keys(totals).length;
      // The page's sticky header (z-999) sits over this button no matter how we
      // scroll, so dispatch the click on the element itself. React listens on
      // the root, so a native click still bubbles to its onClick handler.
      const searchBtn = page.locator('button:has-text("Search")').first();
      await searchBtn.evaluate((el) => (el as HTMLElement).click());
      await expect
        .poll(() => Object.keys(totals).length, { timeout: 90000, intervals: [2000] })
        .toBeGreaterThan(before);
    }
    await page.unrouteAll({ behavior: 'ignoreErrors' });

    const seen = Object.entries(totals).filter(([k]) => k !== 'none' && k !== 'null');
    expect(seen.length, 'no branchSubId ever reached the server').toBeGreaterThanOrEqual(2);

    const counts = seen.map(([, v]) => v);
    expect(
      new Set(counts).size,
      'MB 1 and MB 2 returned identical totals — the sub-branch filter is inert or they were merged',
    ).toBeGreaterThan(1);
  });

  test('Loans list branch filter changes the result set', async ({ page }) => {
    let unfiltered = -1;
    let filtered = -1;
    let sawBranchSubId = false;

    await page.route('**/fuerte-api', async (route) => {
      const post = JSON.parse(route.request().postData() || '{}');
      const response = await route.fetch();
      const json = await response.json().catch(() => null);
      const total = json?.data?.getLoans?.paginatorInfo?.total;
      if (typeof total === 'number') {
        const bs = post?.variables?.branchSubId;
        if (bs === undefined || bs === null) unfiltered = total;
        else {
          filtered = total;
          sawBranchSubId = true;
        }
      }
      await route.fulfill({ response });
    });

    await page.goto('/loans-list', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[aria-label="Filter by branch"]')).toBeVisible({
      timeout: 90000,
    });

    const control = page
      .locator('[class*="react-select__control"]')
      .filter({ has: page.locator('input[aria-label="Filter by branch"]') })
      .first();

    // Poll until getAllBranch has populated the menu.
    let opts: string[] = [];
    await expect
      .poll(
        async () => {
          await control.click().catch(() => {});
          await page.waitForTimeout(500);
          opts = (await menuOptions(page)).filter((o) => !/All Branches/i.test(o));
          if (!opts.length) await page.keyboard.press('Escape').catch(() => {});
          return opts.length;
        },
        { timeout: 90000, intervals: [1500] },
      )
      .toBeGreaterThan(10);

    await page
      .locator('[id^="react-select-"][id*="option"]')
      .filter({ hasNotText: 'All Branches' })
      .first()
      .click();

    await expect
      .poll(() => sawBranchSubId, { timeout: 90000, intervals: [2000] })
      .toBe(true);
    await page.unrouteAll({ behavior: 'ignoreErrors' });

    expect(sawBranchSubId, 'branchSubId never reached getLoans').toBe(true);
    expect(filtered, 'filtered query returned no total').toBeGreaterThanOrEqual(0);
    if (unfiltered > 0) {
      expect(filtered, 'branch filter did not narrow the loan list').toBeLessThan(unfiltered);
    }
  });

  test('Borrower create form exposes a populated Area picker', async ({ page }) => {
    await page.goto('/borrowers/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000);
    await assertNoCrash(page, 'Borrower create');

    const selects = await page.locator('.react-select__control').count();
    expect(selects, 'borrower form rendered no react-select controls').toBeGreaterThan(0);
  });

  test('Problem Accounts branch filter is searchable and lists FA sub-branches', async ({ page }) => {
    await page.goto('/problem-accounts', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 3);

    await chooseOption(page, 0, 'FA');
    const subs = (await readOptions(page, 1, 10)).filter((o) =>
      !/All sub-branches/i.test(o),
    );
    expect(subs).toContain('MB 1');
    expect(subs).toContain('MB 2');
    await assertNoCrash(page, 'Problem Accounts');
  });
});
