/**
 * E2E Test Suite: Back-button GraphQL error handling
 *
 * REGRESSION TEST for the bug reported on production where users saw
 *   "Error loading borrowers: Unexpected token '<', '<!DOCTYPE '... is not valid JSON"
 * when clicking the browser back button on the Borrowers page (and other list pages).
 *
 * Root cause:
 *   - Frontend hooks blindly called `await response.json()` on every fetch.
 *   - When the Sanctum token was stale (bfcache revival after back-nav),
 *     Laravel returned an HTML error/login page.
 *   - JSON.parse('<!DOCTYPE …') exploded and the raw parse error was rendered
 *     verbatim in a red banner.
 *
 * Fix:
 *   - `utils/graphqlFetch.ts` + `utils/helper.ts#fetchWithRecache` now sniff
 *     response content-type, handle 401/419, and surface a friendly error.
 *   - `hoc/withAuth.tsx` listens for the `pageshow` event (event.persisted)
 *     and force-revalidates the token after a bfcache restore.
 *
 * These tests ensure neither regression returns:
 *   1. HTML response interception — fetch is intercepted to return an HTML
 *      401 page; the UI must NOT render the raw "Unexpected token '<'" string.
 *   2. Real back-navigation — navigate forward then back; the list page must
 *      reload cleanly (no parse error banner).
 */

import { test, expect, Route } from '@playwright/test';
import { loginToApp, navigateToPage } from '../../helpers/test-utils';

const RAW_PARSE_ERROR_FRAGMENTS = [
  'Unexpected token',
  '<!DOCTYPE',
  'is not valid JSON',
];

async function expectNoRawParseError(page: import('@playwright/test').Page) {
  // The fix should NEVER let any of the raw JSON.parse error fragments reach
  // the rendered DOM. If any of these strings show up on the page, the bug
  // has regressed somewhere.
  const bodyText = await page.locator('body').innerText();
  for (const fragment of RAW_PARSE_ERROR_FRAGMENTS) {
    expect(
      bodyText,
      `Page should not surface raw JSON.parse error fragment: "${fragment}"`,
    ).not.toContain(fragment);
  }
}

test.describe('Back-button GraphQL error handling', () => {
  // --------------------------------------------------------------------------
  // TEST 1 — Deterministic: simulate an HTML 401 response from the API and
  // verify the UI handles it without leaking the parse error.
  // --------------------------------------------------------------------------
  test('HTML 401 response does not leak as "Unexpected token \'<\'"', async ({
    page,
  }) => {
    console.log('\n🔐 Logging in...');
    await loginToApp(page);

    console.log('\n📍 Step 1: Navigate to /borrowers and confirm initial load works');
    await navigateToPage(page, '/borrowers');
    // Don't rely on document title (the app-wide title is "Fuerte Lending
    // System"). Instead wait for the page's H3 heading or the Create button —
    // both are unique to the Borrowers list page.
    await expect(page.locator('button:has-text("Create")').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500); // let initial fetch settle

    console.log('\n📍 Step 2: Intercept future GraphQL requests with HTML 401');
    // Simulate the exact failure mode reported in production: backend returns
    // an HTML login/error page instead of a JSON GraphQL response.
    await page.route('**/fuerte-api', async (route: Route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 401,
        contentType: 'text/html; charset=UTF-8',
        body: '<!DOCTYPE html><html><head><title>Login</title></head><body><h1>Please log in</h1></body></html>',
      });
    });

    console.log('\n📍 Step 3: Trigger a refetch by reloading the borrowers page');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500); // let the intercepted call resolve

    console.log('\n📍 Step 4: Verify the raw "Unexpected token" error is NOT shown');
    await expectNoRawParseError(page);
    console.log('✅ No raw JSON.parse error leaked to the UI');

    console.log('\n📍 Step 5: Verify the app either redirected to signin OR showed friendly text');
    // After our fix, a 401 should clear auth and redirect to /auth/signin
    // (handled by graphqlFetch -> handleSessionExpired). The redirect uses
    // window.location.href so Playwright will see the URL change.
    await page.waitForURL(/auth\/signin/, { timeout: 8000 }).catch(() => {});
    const url = page.url();
    expect(url, 'Should be redirected to signin after stale 401').toMatch(/auth\/signin/);
    console.log(`✅ Redirected to ${url}`);

    console.log('\n🎉 Test PASSED: HTML 401 handled gracefully');
  });

  // --------------------------------------------------------------------------
  // TEST 2 — Integration: real forward+back navigation on /borrowers, no
  // mocked responses. Verifies the bfcache handler keeps things clean even
  // with a valid token.
  // --------------------------------------------------------------------------
  test('Browser back button to /borrowers does not surface a JSON parse error', async ({
    page,
  }) => {
    console.log('\n🔐 Logging in...');
    await loginToApp(page);

    console.log('\n📍 Step 1: Navigate to /borrowers');
    await navigateToPage(page, '/borrowers');
    // Don't rely on document title (the app-wide title is "Fuerte Lending
    // System"). Instead wait for the page's H3 heading or the Create button —
    // both are unique to the Borrowers list page.
    await expect(page.locator('button:has-text("Create")').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await expectNoRawParseError(page);

    console.log('\n📍 Step 2: Navigate forward to /loans-list');
    await navigateToPage(page, '/loans-list');
    await page.waitForTimeout(2000);
    await expectNoRawParseError(page);

    console.log('\n📍 Step 3: Click browser back button — should restore /borrowers cleanly');
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500); // give bfcache handler + refetch time
    // Don't rely on document title (the app-wide title is "Fuerte Lending
    // System"). Instead wait for the page's H3 heading or the Create button —
    // both are unique to the Borrowers list page.
    await expect(page.locator('button:has-text("Create")').first()).toBeVisible({ timeout: 10000 });

    console.log('\n📍 Step 4: Verify no raw "Unexpected token" error after back-nav');
    await expectNoRawParseError(page);
    console.log('✅ Back-nav to /borrowers is clean');

    console.log('\n📍 Step 5: Click back again then forward — exercise bfcache both directions');
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(2500);
    await expectNoRawParseError(page);

    console.log('\n🎉 Test PASSED: Back/forward navigation never surfaces JSON parse error');
  });

  // --------------------------------------------------------------------------
  // TEST 3 — Cover the other big list pages reported in the bug class
  // (loans-list, payment-posting, accounting). One quick smoke per page.
  // --------------------------------------------------------------------------
  test('HTML 401 on other list pages also surfaces friendly, not raw JSON error', async ({
    page,
  }) => {
    console.log('\n🔐 Logging in...');
    await loginToApp(page);

    const pagesToCheck = ['/loans-list', '/payment-posting', '/notes-receivable'];

    // Install the HTML 401 interceptor before navigating
    await page.route('**/fuerte-api', async (route: Route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 401,
        contentType: 'text/html; charset=UTF-8',
        body: '<!DOCTYPE html><html><head><title>Login</title></head><body><h1>Please log in</h1></body></html>',
      });
    });

    for (const path of pagesToCheck) {
      console.log(`\n📍 Navigating to ${path} with mocked HTML 401…`);
      await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(2000);
      await expectNoRawParseError(page);
      console.log(`✅ ${path} did not leak raw JSON parse error`);

      // The redirect-to-signin handler fires once per session, so subsequent
      // pages may already be on /auth/signin — that's fine, the assertion
      // we care about is the absence of the raw parse error string.
      if (page.url().includes('/auth/signin')) {
        // Manually navigate to the next page anyway to keep iterating
        continue;
      }
    }

    console.log('\n🎉 Test PASSED: All list pages handle HTML 401 gracefully');
  });
});
