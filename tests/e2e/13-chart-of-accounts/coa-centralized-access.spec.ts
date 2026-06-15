/**
 * E2E Regression: Chart of Accounts is a CENTRALIZED company resource.
 *
 * ── Why this file exists ───────────────────────────────────────────────────
 * In June 2026 a branch-isolation security pass branch-scoped the
 * `getChartOfAccounts` query (and `printChartOfAccounts`). But every PARENT
 * account in Fuerte lives under HQ (branch_sub 1) or a NULL branch — the chart
 * of accounts is a single company-wide reference, not per-branch data. Scoping
 * it by the caller's branch therefore returned an EMPTY list to every
 * NON-Marikina user, which silently broke the account dropdowns on the
 * "Review & Re-post Accounting Entry" form (and the Post form) for every
 * Processing / Accounting user in FB, FC, FD, La Union, etc. It reached prod
 * because the original test pass only exercised Marikina users — whose
 * accessible branch set happens to INCLUDE branch_sub 1, so the broken scoped
 * query still returned accounts for them.
 *
 * ── The invariant under test ───────────────────────────────────────────────
 * An authenticated user receives the SAME non-empty centralized parent-account
 * set regardless of which branch they belong to. Authentication is still
 * required (the fix is "auth-gated", not "open").
 *
 * ── Fixtures (DeletionApprovalTestUsersSeeder — password TestPass2026!) ─────
 *   - test.processing.b@fuerte.test  role 3, home FB / branch_sub 57  (NON-Marikina)
 *   - test.processing.a@fuerte.test  role 3, home Marikina / branch_sub 1
 *
 * test.processing.b is the BUG-FAITHFUL fixture: its accessible branch set is
 * [57] (excludes Marikina/1), so the OLD branch-scoped query returned 0
 * accounts for it. If COA is ever re-scoped by branch, Test 1 goes red.
 *
 * To (re)seed locally:
 *   docker exec fuerte-app-1 php artisan db:seed --class=DeletionApprovalTestUsersSeeder
 */

import { test, expect } from '@playwright/test';
import { restLogin, gqlAs } from '../../helpers/e2e-helpers';

// The Dockerized dev backend is slow per request (~10-15s cold, incl. the
// one-time Lighthouse schema build). Give each test ample headroom so a
// correct-but-slow response never reads as a regression.
const SLOW_BACKEND_TIMEOUT_MS = 180_000;

const PASSWORD = 'TestPass2026!';
const NON_MARIKINA_PROCESSING = 'test.processing.b@fuerte.test'; // home FB (57), excludes Marikina
const MARIKINA_PROCESSING = 'test.processing.a@fuerte.test'; // home Marikina (1)

// Minimal projection — we only need to prove non-empty parent accounts come back.
const COA_QUERY = `
  query GetChartOfAccounts($input: InputCoa) {
    getChartOfAccounts(input: $input) {
      id
      account_name
      number
      parent_account_id
      branch_sub_id
    }
  }
`;

function parentAccounts(json: any): any[] {
  expect(json.errors, `GraphQL returned errors: ${JSON.stringify(json.errors)}`).toBeFalsy();
  const list = json?.data?.getChartOfAccounts;
  expect(Array.isArray(list), 'getChartOfAccounts must return an array').toBeTruthy();
  return list;
}

test.describe('Chart of Accounts — centralized, branch-agnostic access', () => {
  // ── Test 1: the core regression guard ────────────────────────────────────
  // A non-Marikina Processing user MUST receive the centralized chart of
  // accounts. Under the bug this returned [] and the re-post dropdowns were
  // empty. This is the single most important assertion in the file.
  test('non-Marikina Processing user receives the centralized chart of accounts', async ({ request }) => {
    test.setTimeout(SLOW_BACKEND_TIMEOUT_MS);
    const { token, user } = await restLogin(request, NON_MARIKINA_PROCESSING, PASSWORD);
    expect(user?.branch_sub_id, 'fixture must be the non-Marikina (FB/57) user').not.toBe(1);

    const accounts = parentAccounts(await gqlAs(request, token, COA_QUERY, { input: {} }));

    expect(
      accounts.length,
      'non-Marikina user must receive the company-wide parent accounts (regression: this was 0)',
    ).toBeGreaterThan(0);
  });

  // ── Test 2: the centralized invariant ────────────────────────────────────
  // The parent-account set must be IDENTICAL for a Marikina user and a
  // non-Marikina user. If they ever differ, the COA has been branch-scoped
  // again — exactly the regression we are guarding against.
  test('parent-account set is identical for Marikina and non-Marikina users', async ({ request }) => {
    test.setTimeout(SLOW_BACKEND_TIMEOUT_MS);
    const marikina = await restLogin(request, MARIKINA_PROCESSING, PASSWORD);
    const fb = await restLogin(request, NON_MARIKINA_PROCESSING, PASSWORD);

    const setOf = (list: any[]) => [...new Set(list.map((a) => String(a.number)))].sort();

    const marikinaSet = setOf(parentAccounts(await gqlAs(request, marikina.token, COA_QUERY, { input: {} })));
    const fbSet = setOf(parentAccounts(await gqlAs(request, fb.token, COA_QUERY, { input: {} })));

    expect(marikinaSet.length, 'Marikina user must see parent accounts').toBeGreaterThan(0);
    expect(
      fbSet,
      'a non-Marikina branch must see the SAME centralized accounts as Marikina',
    ).toEqual(marikinaSet);
  });

  // ── Test 3: auth half of the fix is preserved ────────────────────────────
  // Un-scoping must NOT mean un-gating. An unauthenticated caller must still
  // be rejected (the endpoint has no HTTP-layer auth — the resolver enforces it).
  test('getChartOfAccounts still requires authentication', async ({ request }) => {
    test.setTimeout(SLOW_BACKEND_TIMEOUT_MS);
    const json = await gqlAs(request, 'not-a-real-token', COA_QUERY, { input: {} });
    const blocked =
      Boolean(json.errors?.length) || json?.data?.getChartOfAccounts == null;
    expect(blocked, 'unauthenticated getChartOfAccounts must be rejected').toBeTruthy();
  });
});
