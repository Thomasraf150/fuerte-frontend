import { test, expect } from '@playwright/test';
import { restLogin, gqlAs } from '../../helpers/e2e-helpers';

/**
 * Regression for the "close-audit-gaps" branch.
 *
 * After the Fable 5 audit, three reference fields were still readable by
 * anonymous callers because they were resolved by directives with no PHP
 * resolver to gate: getLoanProductById and getLoanCodeById (@find) and role
 * (@all). This branch replaced those directives with self-gating PHP resolvers.
 * The anonymous-denial check below also covers getMyAccessibleBranchSubs and
 * getAccountingDashboard, whose redundant @guard directives this branch removed.
 *
 * These tests prove both halves of the fix:
 *   1. anonymous API calls are DENIED with a proper GraphQL error, and
 *   2. the authenticated screens that consume those fields still render.
 */

const GRAPHQL = 'http://localhost:8080/fuerte-api';
const ADMIN = { email: 'admin@gmail.com', password: '123456' };
const SHOT =
  'C:/Users/Rafael/AppData/Local/Temp/claude/c--Projects-fuerte/9467b63e-78d2-43ff-a181-847450e3ed8b/scratchpad';

// Every field this branch newly gates (the 3 reference fields) plus
// getAccountingDashboard, whose @guard was removed and which must now gate on
// the 'api' guard in PHP.
const GATED = [
  { name: 'getLoanProductById', query: '{ getLoanProductById(id: 1) { id } }' },
  { name: 'getLoanCodeById', query: '{ getLoanCodeById(id: 1) { id } }' },
  { name: 'role', query: '{ role { id name code } }' },
  { name: 'getMyAccessibleBranchSubs', query: '{ getMyAccessibleBranchSubs { id } }' },
  {
    name: 'getAccountingDashboard',
    query: '{ getAccountingDashboard(start_date:"2026-01-01", end_date:"2026-12-31") { __typename } }',
  },
];

test('anonymous callers are denied on every gated reference field', async ({ request }) => {
  // Five sequential calls against the dev backend (~5s each, plus a possible
  // cold schema rebuild on the first) can exceed the default 60s test cap.
  test.setTimeout(150000);
  for (const g of GATED) {
    const res = await request.post(GRAPHQL, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      data: { query: g.query },
    });
    const body = await res.json();
    expect(body.errors?.[0]?.message, `${g.name} must be gated`).toBe('Unauthenticated.');
    // A nullable field returns data:{field:null}; a non-null field (dashboard)
    // makes data:null on error, so data?.[field] is undefined — both are falsy.
    expect(body.data?.[g.name], `${g.name} must not return data to an anonymous caller`).toBeFalsy();
  }
});

test('authenticated screens that consume the gated fields still work', async ({ page, request }) => {
  test.setTimeout(150000);

  // Real token + real ids to navigate to (discovered, not hard-coded).
  const { token, user } = await restLogin(request, ADMIN.email, ADMIN.password);
  const lp = await gqlAs(request, token, '{ getLoanProducts(first:1,page:1){ data { id } } }');
  const lc = await gqlAs(request, token, '{ getLoanCodes(first:1,page:1){ data { id } } }');
  const lpId = lp.data.getLoanProducts.data[0].id;
  const lcId = lc.data.getLoanCodes.data[0].id;

  // Authenticated API must still return data with the nested relations the UI selects.
  const byId = await gqlAs(
    request,
    token,
    `{ getLoanProductById(id: ${lpId}) { id loan_code { id } } role { id name code } }`,
  );
  expect(byId.data.getLoanProductById.id).toBe(String(lpId));
  expect(byId.data.getLoanProductById.loan_code).not.toBeNull();
  expect(Array.isArray(byId.data.role)).toBeTruthy();

  // getAccountingDashboard must LOAD for an authenticated user. This is the
  // assertion that catches the web-vs-api guard regression: after @guard was
  // removed, a bare auth()->user() would deny every Bearer-token request.
  const dash = await gqlAs(
    request,
    token,
    '{ getAccountingDashboard(start_date:"2026-01-01", end_date:"2026-12-31") { __typename } }',
  );
  expect(dash.errors, 'dashboard must not error for an authenticated user').toBeFalsy();
  expect(dash.data.getAccountingDashboard.__typename).toBe('AccountingDashboard');

  // Seed the persisted auth store (same approach as the Fable smoke spec), then
  // drive the two detail screens that call getLoanProductById / getLoanCodeById.
  await page.addInitScript(
    (p) => {
      localStorage.setItem(
        'authStore',
        JSON.stringify({ state: { user: p.user, authToken: p.token }, version: 0 }),
      );
    },
    { user, token },
  );

  for (const { path, id, loadedHeading } of [
    { path: 'loan-products', id: lpId, loadedHeading: 'Update Loan Product' },
    { path: 'loan-codes', id: lcId, loadedHeading: 'Update Loan Code' },
  ]) {
    // domcontentloaded (not networkidle): Fuerte holds a live Pusher/maintenance
    // connection open, so the network never fully idles.
    await page.goto(`http://localhost:3000/${path}/${id}`, { waitUntil: 'domcontentloaded' });
    expect(page.url(), 'should not bounce to signin').not.toContain('/auth/signin');

    // Wait on a POSITIVE signal: the edit-form heading renders ONLY after the
    // by-id fetch resolves — never during the "Loading..." spinner or the error
    // card. This is robust against the dev ~5.4s latency floor and unrelated
    // dropdown spinners (which the old "absence of Loading..." check tripped on).
    await expect(page.getByText(loadedHeading).first()).toBeVisible({ timeout: 60000 });

    // Belt-and-suspenders: it must be the loaded form, not an auth/error card.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText, `${path} detail should not show an auth error`).not.toContain('Unauthenticated');
    expect(bodyText, `${path} detail should not fail to load`).not.toContain('Failed to load');

    await page.screenshot({ path: `${SHOT}/gated-${path}-${id}.png`, fullPage: true });
  }
});
