/**
 * Regression suite for the Owner-only branch scope.
 *
 * The rule the owner asked for: "All roles except owner really there should be
 * a scope — if the account is Marikina FA then accounting should only show
 * Marikina FA accounting." Previously Admin (1) and Accounting (4) bypassed
 * branch scoping outright, so a Marikina FA accountant was offered all four
 * groups and every branch in the pickers.
 *
 * What this proves, per role, through the real UI:
 *   1. the Group picker offers only groups the account can actually reach;
 *   2. the Branch picker offers only that account's own branches;
 *   3. the financial statements still OPEN for Accounting/Admin (they are
 *      scoped, not denied) — the failure mode this change could easily have
 *      introduced.
 *
 * Auth is seeded into localStorage from locally minted tokens rather than
 * driven through /api/login, which is rate limited to 5 per minute per account
 * — a per-role suite would trip it immediately. Regenerate the fixtures with:
 *
 *   docker exec fuerte-app-1 php artisan tinker \
 *     --execute="require '/var/www/html/dev/_scratch/mint_scope_tokens.php';"
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCRATCH = path.resolve(__dirname, '../../../../fuerte-backend/dev/_scratch');

type Role = {
  key: string;
  label: string;
  /** Groups this account may see, or null for "every group". */
  groups: string[] | null;
  /** Branches this account may see, or null for "every branch". */
  branches: string[] | null;
  /** Whether the consolidated statements must still open for them. */
  opensStatements: boolean;
};

const ROLES: Role[] = [
  {
    key: 'owner',
    label: 'OWNER (fuerterafael)',
    groups: null,
    branches: null,
    opensStatements: true,
  },
  {
    key: 'acctg_fa',
    label: 'ACCOUNTING, Marikina FA',
    groups: ['FA'],
    branches: ['Marikina FA'],
    opensStatements: true,
  },
  {
    key: 'acctg_mb',
    label: 'ACCOUNTING, MB',
    groups: ['FA'],
    branches: ['MB'],
    opensStatements: true,
  },
  {
    key: 'branch_admin',
    label: 'BRANCH ADMIN, Marikina FA',
    groups: ['FA'],
    branches: ['Marikina FA'],
    opensStatements: false,
  },
];

function fixture(key: string): string {
  const p = path.join(SCRATCH, `auth_${key}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(
      `Missing auth fixture: ${p}\n` +
        'Mint it first (see the comment at the top of this file) — the fixtures ' +
        'are gitignored because they hold live bearer tokens.',
    );
  }
  return fs.readFileSync(p, 'utf8');
}

function isSentinel(label: string): boolean {
  return /^(select a (branch|sub ?branch|group)|all (main )?branches|all sub-?branches|all groups)$/i.test(
    label.trim(),
  );
}

async function menuOptions(page: Page): Promise<string[]> {
  return page.locator('[id^="react-select-"][id*="option"]').allTextContents();
}

/**
 * Open the nth react-select and read its real options, polling because the dev
 * server compiles on demand and every GraphQL call carries a multi-second floor.
 * Synthetic DOM events do not drive react-select, so this clicks for real.
 */
async function readOptions(page: Page, index: number, timeoutMs = 60000): Promise<string[]> {
  const deadline = Date.now() + timeoutMs;
  let last: string[] = [];
  while (Date.now() < deadline) {
    const control = page.locator('.react-select__control').nth(index);
    if (await control.count()) {
      await control.click().catch(() => {});
      await page.waitForTimeout(500);
      last = (await menuOptions(page)).filter((o) => !isSentinel(o));
      if (last.length) return last;
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
  return last;
}

for (const role of ROLES) {
  test.describe(role.label, () => {
    test.beforeEach(async ({ page }) => {
      const auth = fixture(role.key);
      await page.addInitScript((a) => {
        localStorage.setItem('authStore', a as string);
      }, auth);
    });

    // The Group picker appears on several screens and each fetches the list
    // independently, so scoping has to be proven on more than one of them —
    // the owner reported the leak on Renewable Borrowers.
    for (const screen of [
      { path: '/renewable-borrowers', name: 'Renewable Borrowers' },
      { path: '/notes-receivable', name: 'Notes Receivable' },
    ]) {
      test(`Group picker offers only reachable groups — ${screen.name}`, async ({ page }) => {
        await page.goto(screen.path);
        await expect(page.locator('.react-select__control').first()).toBeVisible({
          timeout: 60000,
        });

        const groups = await readOptions(page, 0);
        expect(groups.length, 'group picker never populated').toBeGreaterThan(0);

        if (role.groups === null) {
          expect(groups.sort()).toEqual(['FA', 'FB', 'FC', 'FD']);
        } else {
          expect(groups.sort()).toEqual([...role.groups].sort());
        }
      });
    }

    // The landing screen at '/' is deliberately NOT picker-based for anyone but
    // the Owner: DefaultPage renders the Group/Branch/Sub-Branch dropdowns only
    // when isOwner, and locks everyone else to a static branch label. Asserting
    // a picker here for a scoped role tests a contract the app never had — an
    // earlier draft of this file did exactly that and reported three failures
    // against correct behaviour. What matters for scoping is the same either
    // way: no other branch may appear.
    test('landing screen exposes no other branch', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(35000);

      const selects = await page.locator('.react-select__control').count();
      const body = (await page.locator('body').innerText().catch(() => '')) || '';
      expect(body.length, 'landing screen rendered empty').toBeGreaterThan(50);

      if (role.groups === null) {
        // Owner: the pickers are present and offer every group.
        expect(selects, 'Owner lost the branch pickers').toBeGreaterThan(0);
        const groups = await readOptions(page, 0);
        expect(groups.sort()).toEqual(['FA', 'FB', 'FC', 'FD']);
        return;
      }

      // Scoped role: no picker, and nothing from a branch they cannot reach.
      expect(selects, 'a scoped role was offered branch pickers on the landing screen').toBe(0);
      // Tokenised rather than regex-matched: a word-boundary regex built from a
      // string literal was silently compiling to U+0008 (backspace) here, which
      // made this assertion unfalsifiable. Splitting on non-alphanumerics cannot
      // be defanged the same way.
      const bodyTokens = body.split(/[^A-Za-z0-9]+/);

      for (const foreign of ['FB', 'FC', 'FD']) {
        if (role.branches && role.branches.includes(foreign)) continue;
        expect(
          bodyTokens.includes(foreign),
          `${foreign} appears on the landing screen for ${role.label}`,
        ).toBe(false);
      }
    });

    test('Branch picker offers only reachable branches', async ({ page }) => {
      await page.goto('/renewable-borrowers');
      await expect(page.locator('.react-select__control').nth(1)).toBeVisible({
        timeout: 60000,
      });

      const branches = await readOptions(page, 1);
      expect(branches.length, 'branch picker never populated').toBeGreaterThan(0);

      if (role.branches === null) {
        // The owner sees the whole book; assert breadth rather than an exact
        // list so adding a branch does not break this test.
        expect(branches.length).toBeGreaterThan(4);
        expect(branches).toContain('Marikina FA');
        expect(branches).toContain('FB');
      } else {
        expect(branches.sort()).toEqual([...role.branches].sort());
        // The specific leak the owner reported: other groups' branches showing
        // up for an account confined to one.
        for (const foreign of ['FB', 'FC', 'FD']) {
          if (!role.branches.includes(foreign)) {
            expect(branches, `${foreign} leaked into the branch picker`).not.toContain(foreign);
          }
        }
      }
    });

    test('Balance Sheet is scoped, not denied', async ({ page }) => {
      await page.goto('/accounting/balance-sheet');
      await page.waitForTimeout(8000);

      const body = (await page.locator('body').innerText().catch(() => '')) || '';
      const denied = /Unauthorized|insufficient access/i.test(body);

      if (role.opensStatements) {
        expect(denied, `${role.label} was locked out of the Balance Sheet`).toBe(false);
        expect(body.length, 'Balance Sheet rendered empty').toBeGreaterThan(50);
      }
      // Roles without statement access are unchanged by this work, so their
      // behaviour is deliberately not asserted here.
    });
  });
}
