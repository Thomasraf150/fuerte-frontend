/**
 * Regression suite for the Group tier (FA / FB / FC / FD).
 *
 * The pickers are now Group -> Branch -> Sub Branch. `branches` still holds the
 * operational branches (MB, Subic, Marikina FA, ...) exactly as before — the new
 * branch_groups table only sits ABOVE them. Nothing about loans, sub-branches or
 * report grouping moved, which is the point: the owner's requirement was
 * "ma separate sa Summary Ticket para ma check per branch", and that separation
 * comes from branch_subs.branch_id, which this change never touches.
 *
 * So this suite proves two things:
 *   1. the Group tier narrows the Branch picker, and
 *   2. the per-branch report separation is still intact.
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * These screens only render branch pickers for an OWNER, and no owner password
 * is committed anywhere, so auth comes from a locally minted token. The fixture
 * is gitignored (it holds a live bearer token). Generate it before the first run:
 *
 *   docker exec fuerte-app-1 php artisan tinker --execute="$u=App\Models\User::
 *   where('email','fuerterafael@gmail.com')->firstOrFail(); $u->load('branchSub.
 *   branch','role'); $t=$u->createToken('e2e')->plainTextToken; $u->
 *   assignedBranchSubIds=app(App\Services\BranchAccessService::class)->
 *   getSwitcherBranchSubIds($u); file_put_contents('/var/www/html/dev/_scratch/
 *   auth_payload.json', json_encode(['state'=>['user'=>$u->toArray(),
 *   'authToken'=>$t],'version'=>0]));"
 *
 * Seeding the store beats driving the login form: /api/login is rate limited to
 * 5 per minute per account, which a suite this size would trip.
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

/** Screens that must simply render for an owner without blowing up. */
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

/** Visible text of the currently open react-select menu. */
async function menuOptions(page: Page): Promise<string[]> {
  return page.locator('[id^="react-select-"][id*="option"]').allTextContents();
}

/**
 * Placeholder / "no filter" entries. Screens disagree on wording and casing
 * ("All Main Branches" vs "All branches", "All Groups" vs "All groups"), so
 * every comparison strips them rather than hard-coding one screen's vocabulary.
 */
function isSentinel(label: string): boolean {
  return /^(select a (branch|sub ?branch|group)|all (main )?branches|all sub-?branches|all groups)$/i.test(
    label.trim(),
  );
}

/**
 * Open a react-select and read its options, retrying until populated. The dev
 * server compiles routes on demand and every GraphQL call carries a multi-second
 * floor, so a fixed sleep is unreliable — poll instead. Synthetic DOM events do
 * NOT drive react-select; every interaction here goes through a real click.
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

/** Open the nth react-select, type a label, commit the highlighted match. */
async function chooseOption(page: Page, index: number, label: string) {
  const control = page.locator('.react-select__control').nth(index);
  await control.click();
  await page.waitForTimeout(400);
  await page.keyboard.type(label, { delay: 40 });
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
}

async function waitForSelect(page: Page, index: number, timeoutMs = 60000) {
  await expect(page.locator('.react-select__control').nth(index)).toBeVisible({
    timeout: timeoutMs,
  });
}

/**
 * Poll a select until its options satisfy `predicate`.
 *
 * Counting is not enough here: after a group is picked the branch list is
 * refetched, and until that lands the menu still holds the FULL list from the
 * mount fetch. A count-based wait returns immediately on that stale list and the
 * assertion then fails against data that was about to be replaced.
 */
async function readOptionsUntil(
  page: Page,
  index: number,
  predicate: (opts: string[]) => boolean,
  timeoutMs = 90000,
): Promise<string[]> {
  const deadline = Date.now() + timeoutMs;
  let last: string[] = [];
  while (Date.now() < deadline) {
    const control = page.locator('.react-select__control').nth(index);
    if (await control.count()) {
      await control.click().catch(() => {});
      await page.waitForTimeout(500);
      last = (await menuOptions(page)).filter((o) => !isSentinel(o));
      if (last.length && predicate(last)) return last;
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
  return last;
}

test.describe('Every screen still renders', () => {
  for (const screen of SCREENS) {
    test('renders: ' + screen.name, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
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

test.describe('The Group tier narrows the Branch picker', () => {
  test('Group dropdown is exactly FA, FB, FC, FD', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    const groups = (await readOptions(page, 0, 4)).filter((o) => !/All Groups/i.test(o));
    expect(groups).toEqual(['FA', 'FB', 'FC', 'FD']);
  });

  test('Group FA narrows Branch to its own branches, excluding FB/FC/FD', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 4);

    await chooseOption(page, 0, 'FA');
    // Wait for the list to actually reflect FA — i.e. the other franchises gone.
    const branches = await readOptionsUntil(page, 1, (o) => !o.includes('FB'));

    // FA's operational branches are still real branch rows.
    expect(branches).toContain('MB');
    expect(branches).toContain('Subic');
    expect(branches).toContain('Marikina FA');
    expect(branches).toContain('Telabastagan');

    // The other franchises must NOT leak into FA's branch list.
    expect(branches).not.toContain('FB');
    expect(branches).not.toContain('FC');
    expect(branches).not.toContain('FD');

    const sorted = [...branches].sort((a, b) => a.localeCompare(b));
    expect(branches, 'branches are not alphabetical').toEqual(sorted);
  });

  test('Group FB narrows Branch to FB alone', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 4);

    await chooseOption(page, 0, 'FB');
    const branches = await readOptionsUntil(page, 1, (o) => o.length === 1);
    expect(branches).toEqual(['FB']);
  });

  test('Branch MB cascades to MB 1, MB 2 and FA Balibago', async ({ page }) => {
    // The global per-test budget is 60s (playwright.config.ts). This test needs
    // more: it makes three DEPENDENT GraphQL round-trips — group, then branch,
    // then sub-branch, each waiting on the one before — and then generates a
    // Summary Ticket built from four stored procedures. It measures ~54s alone,
    // i.e. 6s of headroom, so it tipped over whenever the machine was busy and
    // reported a failure against working code. Raised here rather than globally,
    // so a genuinely slow test elsewhere still gets caught.
    test.setTimeout(180000);

    // The owner's own example: "May sub branches kasi talaga example MB for 1, 2 & FA Bali".
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 4);

    await chooseOption(page, 0, 'FA');
    await readOptionsUntil(page, 1, (o) => !o.includes('FB'));
    await chooseOption(page, 1, 'MB');

    const subs = await readOptionsUntil(page, 2, (o) => o.includes('MB 1'));
    expect(subs).toContain('MB 1');
    expect(subs).toContain('MB 2');
    expect(subs).toContain('FA Balibago');
  });

  test('Group dropdown filters as you type', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 4);
    await page.locator('.react-select__control').first().click();
    await page.keyboard.type('fc', { delay: 40 });
    await page.waitForTimeout(800);
    expect(await menuOptions(page)).toEqual(['FC']);
  });
});

test.describe('Reports still separate per branch', () => {
  test('Summary Ticket renders a real report for FA / MB / MB 1', async ({ page }) => {
    // The global per-test budget is 60s (playwright.config.ts). This test needs
    // more: it makes three DEPENDENT GraphQL round-trips — group, then branch,
    // then sub-branch, each waiting on the one before — and then generates a
    // Summary Ticket built from four stored procedures. It measures ~54s alone,
    // i.e. 6s of headroom, so it tipped over whenever the machine was busy and
    // reported a failure against working code. Raised here rather than globally,
    // so a genuinely slow test elsewhere still gets caught.
    test.setTimeout(180000);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 4);

    await page.locator('input[placeholder="Start Date"]').fill('07/01/2025');
    await page.locator('input[placeholder="End Date"]').fill('07/31/2025');
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(500);

    await chooseOption(page, 0, 'FA');
    await readOptionsUntil(page, 1, (o) => !o.includes('FB'));
    await chooseOption(page, 1, 'MB');
    await readOptionsUntil(page, 2, (o) => o.includes('MB 1'));
    await chooseOption(page, 2, 'MB 1');

    await expect
      .poll(
        async () => /Number of Borrowers/i.test(await page.locator('body').innerText()),
        { timeout: 90000, intervals: [2000] },
      )
      .toBe(true);

    expect(await page.locator('body').innerText()).toMatch(/₱/);
    await assertNoCrash(page, 'Summary Ticket report');
  });

  test('Branch Setup lists the operational branches, not just the groups', async ({ page }) => {
    await page.goto('/branch-setup', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(async () => (await page.locator('body').innerText()).includes('Subic'), {
        timeout: 60000,
        intervals: [1000],
      })
      .toBe(true);
    const body = await page.locator('body').innerText();
    for (const b of ['MB', 'Subic', 'Marikina FA', 'FB']) {
      expect(body, 'Branch Setup missing ' + b).toContain(b);
    }
    await assertNoCrash(page, 'Branch Setup');
  });
});

/**
 * Screens that carry a Group -> Branch cascade. Each was edited independently
 * (three different authors), so each is driven for real rather than assumed to
 * match the reference implementation.
 */
const GROUP_SCREENS: Array<{ path: string; name: string }> = [
  { path: '/', name: 'Summary Ticket' },
  { path: '/accounting/income-statement', name: 'Income Statement' },
  { path: '/accounting/balance-sheet', name: 'Balance Sheet' },
  { path: '/accounting/general-voucher', name: 'General Voucher' },
  { path: '/notes-receivable', name: 'Notes Receivable' },
  { path: '/problem-accounts', name: 'Problem Accounts' },
  { path: '/renewable-borrowers', name: 'Renewable Borrowers' },
];

/**
 * Locate the Group select by CONTENT, not by index.
 *
 * Balance Sheet renders its filters without labels, and the number of
 * react-selects ahead of Group differs per screen, so an index would silently
 * test the wrong control — the exact failure mode already found in
 * bs-dropdown.spec.ts.
 */
async function findGroupSelect(page: Page, timeoutMs = 90000): Promise<number> {
  // Group is deliberately rendered first on every screen, so poll index 0 and
  // assert it. Sweeping every control instead was too slow against a dev server
  // (each probe costs a click plus a settle) and blew the test budget. If Group
  // ever stops being first, this fails loudly — which is a finding, not noise.
  const control = page.locator('.react-select__control').first();
  const deadline = Date.now() + timeoutMs;
  let seen: string[] = [];
  while (Date.now() < deadline) {
    await control.click().catch(() => {});
    await page.waitForTimeout(600);
    seen = await menuOptions(page);
    if (seen.some((o) => /^all groups$/i.test(o.trim())) && seen.some((o) => o.trim() === 'FA')) {
      await page.keyboard.press('Escape').catch(() => {});
      return 0;
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1500);
  }
  throw new Error(
    'First react-select is not the Group picker. Saw: ' + JSON.stringify(seen.slice(0, 8)),
  );
}

test.describe('Group cascade works on every screen that has one', () => {
  for (const screen of GROUP_SCREENS) {
    test(`${screen.name}: Group lists FA-FD and narrows Branch`, async ({ page }) => {
      test.setTimeout(240000);
      await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
      await waitForSelect(page, 0);

      const gi = await findGroupSelect(page);
      expect(gi, `${screen.name}: no Group select found`).toBeGreaterThanOrEqual(0);

      // 1. the four groups are offered
      const groups = (await readOptionsUntil(page, gi, (o) => o.length >= 4)).filter(
        (o) => !isSentinel(o),
      );
      expect(groups, `${screen.name}: wrong group list`).toEqual(['FA', 'FB', 'FC', 'FD']);

      // 2. picking FA narrows the NEXT select to FA's branches only
      await chooseOption(page, gi, 'FA');
      const branches = await readOptionsUntil(page, gi + 1, (o) => !o.includes('FB'));
      expect(branches, `${screen.name}: Branch list empty after picking FA`).not.toEqual([]);
      expect(branches, `${screen.name}: FB leaked into FA`).not.toContain('FB');
      expect(branches, `${screen.name}: FC leaked into FA`).not.toContain('FC');
      expect(branches, `${screen.name}: FD leaked into FA`).not.toContain('FD');
      expect(branches, `${screen.name}: MB missing from FA`).toContain('MB');
    });
  }
});

test.describe('Group behaviour rules', () => {
  test('changing Group clears an already-selected Branch', async ({ page }) => {
    // Otherwise a branch from the previous group stays selected against a list
    // that no longer contains it, silently filtering to something invisible.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 4);

    await chooseOption(page, 0, 'FA');
    await readOptionsUntil(page, 1, (o) => !o.includes('FB'));
    await chooseOption(page, 1, 'MB');

    // Branch now reads MB. Switching group must wipe it.
    await expect
      .poll(async () => (await page.locator('.react-select__single-value').allTextContents())[1], {
        timeout: 30000,
      })
      .toBe('MB');

    await chooseOption(page, 0, 'FB');
    await expect
      .poll(async () => (await page.locator('.react-select__single-value').allTextContents())[1], {
        timeout: 30000,
      })
      .not.toBe('MB');
  });

  test('"All Main Branches" is offered only while no group is selected', async ({ page }) => {
    // It spans every group, so under a single group it would report numbers
    // from branches the label excludes.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSelect(page, 0);
    await readOptions(page, 0, 4);

    const before = await readOptions(page, 1, 5);
    expect(before.join(' | ')).toContain('All Main Branches');

    await chooseOption(page, 0, 'FA');
    await readOptionsUntil(page, 1, (o) => !o.includes('FB'));
    const after = await readOptions(page, 1, 5);
    expect(after.join(' | '), 'All Main Branches still offered under a group').not.toContain(
      'All Main Branches',
    );
  });

  test('Branch Setup shows the Group each branch belongs to', async ({ page }) => {
    await page.goto('/branch-setup', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(async () => (await page.locator('body').innerText()).includes('Subic'), {
        timeout: 60000,
        intervals: [1000],
      })
      .toBe(true);
    const body = await page.locator('body').innerText();
    expect(body, 'no Group column on Branch Setup').toMatch(/GROUP/i);
    // FA is a group code, never a branch name — its presence proves the column renders.
    expect(body).toMatch(/\bFA\b/);
  });

  /**
   * The Group column existed before there was any way to FILL it. The tier
   * shipped read-only: getBranch returned the group, the list rendered it,
   * every picker filtered on it — but BranchesInput/BranchesUpdateInput had no
   * branch_group_id, so the create/edit form could not send one and every new
   * branch landed with a blank Group. Rendering the column is therefore not
   * enough to test; the form has to be able to write it.
   */
  test('Branch Setup can assign a Group to a branch', async ({ page }) => {
    await page.goto('/branch-setup', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(async () => (await page.locator('body').innerText()).includes('Subic'), {
        timeout: 60000,
        intervals: [1000],
      })
      .toBe(true);

    // Open the branch form. Create is used rather than the row's edit pencil
    // because both render the SAME FormAddBranch, and the pencil is a bare
    // react-feather <svg> inside a tooltip inside a react-data-table cell — a
    // selector that breaks on any markup change, which is exactly how the first
    // version of this test failed against a working form.
    await page.getByRole('button', { name: /create/i }).first().click();
    await page.waitForTimeout(4000);

    // The Group select must offer the real groups, not an empty list.
    await expect(
      page.locator('.react-select__control').first(),
      'Group select missing from the branch form',
    ).toBeVisible({ timeout: 30000 });

    const options = await readOptionsUntil(page, 0, (opts) =>
      opts.some((o) => /^F[ABCD]$/.test(o.trim())),
    );
    expect(
      options.filter((o) => /^F[ABCD]$/.test(o.trim())).sort(),
      'Group select did not offer FA/FB/FC/FD',
    ).toEqual(['FA', 'FB', 'FC', 'FD']);
  });
});
