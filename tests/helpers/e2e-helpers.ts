/**
 * Shared helpers for Playwright E2E tests.
 *
 * Includes:
 *   - Marker-based test data cleanup via docker exec (see e2e_test_ops.php)
 *   - GraphQL API helper that handles auth
 *   - React-select interaction utilities
 *   - "Row + action" helper for react-data-table-component lists
 *
 * Design principle: every test that creates data must register a cleanup
 * marker via `withMarker()`. The afterEach hook then walks the marker's
 * related tables and soft-deletes whatever the test left behind.
 */

import { Page, APIRequestContext, expect } from '@playwright/test';
import { execFileSync } from 'child_process';

const REST_BASE = process.env.TEST_REST_URL ?? 'http://localhost:8080';
const GRAPHQL_URL = process.env.TEST_GRAPHQL_URL ?? 'http://localhost:8080/fuerte-api';
const FRONTEND = process.env.TEST_FRONTEND_URL ?? 'http://localhost:3000';
const CONTAINER = process.env.TEST_BACKEND_CONTAINER ?? 'fuerte-app-1';
const E2E_OPS_SCRIPT = 'tests/e2e_test_ops.php';

// ============================================================================
// MARKERS — unique tags written into test data so cleanup can find it later
// ============================================================================

/** Build a unique marker string (E2E_ + 9-char alphanumeric) for a test. */
export function makeMarker(prefix = 'E2E'): string {
  // Lowercase-only, 9 chars. Short enough to fit in display fields, unique
  // enough for any practical concurrent-test scenario.
  const suffix = Math.random().toString(36).slice(2, 11);
  return `${prefix}_${suffix}`;
}

// ============================================================================
// DOCKER PHP HELPER
// ============================================================================

function dockerPhp(args: string[]): string {
  // PHP can emit deprecation warnings or stack traces to stdout in some
  // environments; the wrapper strips anything before the first JSON-looking
  // character if our caller asked for JSON. For non-JSON output we just
  // trim. Errors land in stderr which execFileSync inherits to the test
  // log, so debugging stays possible.
  const result = execFileSync('docker', ['exec', CONTAINER, 'php', E2E_OPS_SCRIPT, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result.trim();
}

/** Strip any PHP warnings/notices that landed in stdout BEFORE the JSON. */
function extractJson(s: string): string {
  const i = Math.min(
    ...['[', '{']
      .map((c) => s.indexOf(c))
      .filter((idx) => idx >= 0)
      .concat([s.length]),
  );
  return i === s.length ? s : s.slice(i);
}

/**
 * Soft-delete every borrower whose lastname starts with this marker, plus
 * their loans, loan_payments, and the GL acctg_entries those wrote. Returns
 * the number of borrowers cleaned. Safe to call multiple times.
 */
export function cleanupBorrowersByMarker(marker: string): number {
  return parseInt(dockerPhp(['cleanup-borrowers', marker]), 10) || 0;
}

/** Soft-delete every Check Voucher whose journal_desc starts with this marker. */
export function cleanupVouchersByMarker(marker: string): number {
  return parseInt(dockerPhp(['cleanup-vouchers', marker]), 10) || 0;
}

/** Soft-delete every journal entry whose journal_desc starts with this marker. */
export function cleanupJournalsByMarker(marker: string): number {
  return parseInt(dockerPhp(['cleanup-journals', marker]), 10) || 0;
}

/** Generic cleanup by journal_desc prefix (matches all journal types). */
export function cleanupAcctgByDescMarker(marker: string): number {
  return parseInt(dockerPhp(['cleanup-acctg-by-desc', marker]), 10) || 0;
}

/** Read GL totals (debit + credit) for a journal/reference number. */
export function readGlBalance(ref: string): { total_debit: string; total_credit: string; rows: number } {
  const raw = dockerPhp(['gl-balance', ref]);
  try {
    return JSON.parse(extractJson(raw));
  } catch (e) {
    throw new Error(`readGlBalance(${ref}): could not parse "${raw.slice(0, 500)}"`);
  }
}

/** Count active loan_payments across all schedules of a loan. */
export function countLoanPayments(loanId: number | string): number {
  return parseInt(dockerPhp(['loan-payment-count', String(loanId)]), 10) || 0;
}

/**
 * System-wide GL invariant: across every active acctg_details row, total
 * debits must equal total credits. Catches data corruption, orphan rows,
 * manual SQL edits, or a buggy mutation that posts unbalanced details.
 */
export function readGlGlobalTotals(): { total_debit: string; total_credit: string; rows: number } {
  const raw = dockerPhp(['gl-global-totals']);
  try {
    return JSON.parse(extractJson(raw));
  } catch {
    throw new Error(`readGlGlobalTotals: could not parse "${raw.slice(0, 500)}"`);
  }
}

/** Find any active loan in a given status (used by loading-state tests to discover a navigable target). */
export function findLoanByStatus(status: number): { id: number; loan_ref: string; status: number; is_pn_signed: number } | null {
  const out = dockerPhp(['find-loan-by-status', String(status)]);
  if (!out || out === 'null') return null;
  try {
    return JSON.parse(extractJson(out));
  } catch {
    throw new Error(`findLoanByStatus(${status}): could not parse "${out.slice(0, 500)}"`);
  }
}

/** Get the first (lowest-id) active schedule for a loan — used to post the first payment. */
export function loanFirstSchedule(loanId: number | string): { id: number; due_date: string; amount: string } | null {
  const out = dockerPhp(['loan-first-schedule', String(loanId)]);
  if (!out || out === 'null') return null;
  try {
    return JSON.parse(extractJson(out));
  } catch {
    throw new Error(`loanFirstSchedule(${loanId}): could not parse "${out.slice(0, 500)}"`);
  }
}

// ============================================================================
// AUTH + GRAPHQL HELPERS
// ============================================================================

export async function restLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ token: string; user: any }> {
  const res = await request.post(`${REST_BASE}/api/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { email, password },
  });
  expect(res.ok(), `login failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.json();
}

export async function gqlAs(
  request: APIRequestContext,
  token: string,
  query: string,
  variables: any = {},
): Promise<any> {
  const res = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: { query, variables },
  });
  return res.json();
}

// ============================================================================
// UI HELPERS — react-select + react-data-table + login
// ============================================================================

/**
 * Performs a fresh login via the UI. Clears localStorage first so a prior
 * test's session doesn't leak in. Surfaces error-toast text on failure so
 * test output is debuggable instead of a silent timeout.
 */
export async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  if (!page.url().includes('/auth/signin')) {
    await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(800);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.locator('button[type="submit"]').first().click();
  await page
    .waitForSelector('button:has-text("Signing In...")', { timeout: 3000 })
    .catch(() => {});
  await page
    .waitForSelector('button:has-text("Signing In...")', { state: 'detached', timeout: 20000 })
    .catch(() => {});
  try {
    await page.waitForURL((u) => !u.toString().includes('/auth/signin'), { timeout: 20000 });
  } catch {
    const err = await page.locator('.Toastify__toast--error').first().textContent().catch(() => '');
    throw new Error(`login did not redirect for ${email} (url=${page.url()}, errorToast="${err ?? ''}")`);
  }
  await page.waitForTimeout(1500);
}

/**
 * Open a react-select dropdown and pick an option by visible label.
 * Uses the partial-class matching pattern that's stable across Fuerte's
 * react-select theme.
 *
 * @param scope - Locator scope (use the form section that contains the select)
 * @param matcher - Either a substring to match in option text, or a regex
 */
export async function selectReactOption(
  scope: import('@playwright/test').Locator,
  matcher: string | RegExp,
): Promise<string> {
  const control = scope.locator('[class*="react-select"]').first();
  await control.click();
  await scope.page().waitForSelector('[class*="react-select__option"]', { timeout: 10000 });
  const allOptions = scope.page().locator('[class*="react-select__option"]');
  const texts = await allOptions.allTextContents();
  const idx = texts.findIndex((t) =>
    typeof matcher === 'string' ? t.toLowerCase().includes(matcher.toLowerCase()) : matcher.test(t),
  );
  if (idx === -1) {
    throw new Error(
      `selectReactOption: no option matched "${matcher}". Available: ${JSON.stringify(texts)}`,
    );
  }
  await allOptions.nth(idx).click();
  return texts[idx];
}

/**
 * Find a row in a react-data-table-component table whose visible text
 * contains the given string, then click an action icon by its zero-based
 * index within that row (0=Key/password, 1=Edit, 2=Trash in the user-setup
 * convention).
 */
export async function clickRowAction(
  page: Page,
  rowText: string,
  actionIconIndex: number,
): Promise<void> {
  await page.waitForSelector('.rdt_TableRow', { timeout: 15000 });
  const row = page.locator('.rdt_TableRow', { hasText: rowText }).first();
  await expect(row, `row matching "${rowText}" must be visible`).toBeVisible({ timeout: 10000 });
  const icons = row.locator('svg.cursor-pointer');
  const count = await icons.count();
  if (count <= actionIconIndex) {
    throw new Error(`row has ${count} action icons, requested index ${actionIconIndex}`);
  }
  await icons.nth(actionIconIndex).click({ force: true });
}
