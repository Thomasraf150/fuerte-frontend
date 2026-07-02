/**
 * E2E Test Suite: JSON-but-not-GraphQL error bodies are reported honestly
 *
 * REGRESSION TEST for the recurring "Clear Lighthouse cache" false alarm.
 *
 * Root cause (verified via nginx/php-fpm logs + code trace, 2026-07-02):
 *   - During a deploy/restart window Laravel returns a JSON error body:
 *       503 maintenance  -> {"message":"Service Unavailable","exception":...}
 *       500 server error -> {"message":"Server Error"}
 *       429 throttle     -> {"message":"Too Many Attempts."}
 *   - These are valid application/json, so the old parseGraphQLResponse()
 *     (which only rejected NON-json) let them through with no data/errors keys.
 *   - useGeneralVoucher / useGeneralJournal then threw
 *       "getCheckVoucher returned no data — backend schema may be out of sync.
 *        Clear Lighthouse cache."
 *     — a false lead: the schema was fine (validate-schema exits 0), the backend
 *     had merely hiccupped. Operators then hand-cleared the Lighthouse cache
 *     (an anti-pattern per .claude/skills/prod-deploy) and the real problem —
 *     a transient 503/500 — was never addressed.
 *
 * Fix:
 *   - utils/graphqlFetch.ts#parseGraphQLResponse now rejects a JSON body that
 *     carries neither `data` nor `errors` with a status-specific, honest message
 *     (statusMessage()). This one choke-point covers every graphqlFetch /
 *     fetchWithRecache caller.
 *   - useGeneralVoucher.tsx / useGeneralJournal.tsx no longer say
 *     "Clear Lighthouse cache".
 *
 * These tests ensure the false "clear cache / schema out of sync" copy never
 * returns for a transient backend JSON error.
 */

import { test, expect, Route } from '@playwright/test';
import { loginToApp, navigateToPage } from '../../helpers/test-utils';

const FALSE_LEAD_FRAGMENTS = [
  'Clear Lighthouse cache',
  'schema may be out of sync',
  'schema out of sync',
];

/** Fulfill every POST /fuerte-api with a Laravel-style JSON error body. */
async function interceptWithJsonError(
  page: import('@playwright/test').Page,
  status: number,
  message: string,
) {
  await page.route('**/fuerte-api', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      // Exact shape Laravel returns with APP_DEBUG on: a `message`/`exception`
      // envelope, NO `data`, NO `errors`.
      body: JSON.stringify({
        message,
        exception: 'Symfony\\Component\\HttpKernel\\Exception\\HttpException',
      }),
    });
  });
}

test.describe('JSON error body is reported as infra, not "schema out of sync"', () => {
  // --------------------------------------------------------------------------
  // TEST 1 — 503 maintenance JSON on the General Voucher list must show the
  // honest "temporarily unavailable" banner, NEVER "Clear Lighthouse cache".
  // --------------------------------------------------------------------------
  test('503 maintenance JSON on General Voucher shows honest message, not cache advice', async ({
    page,
  }) => {
    await loginToApp(page);

    // Confirm the page loads with REAL data first — proves the schema is fine
    // and isolates the failure to the injected 503, not a genuine null field.
    // "New CV" is unique to this page (matches the existing back-button test's
    // reliance on a page-unique button rather than the shared page title).
    await navigateToPage(page, '/accounting/general-voucher');
    await expect(page.locator('button:has-text("New CV")').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    // Now inject the 503 and force a refetch by reloading the page.
    await interceptWithJsonError(page, 503, 'Service Unavailable');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Error loading general vouchers')).toBeVisible({ timeout: 10000 });

    const bodyText = await page.locator('body').innerText();

    for (const fragment of FALSE_LEAD_FRAGMENTS) {
      expect(
        bodyText,
        `503 must NOT surface the false lead: "${fragment}"`,
      ).not.toContain(fragment);
    }

    // And it SHOULD surface the honest maintenance/unavailable copy.
    expect(
      bodyText.toLowerCase(),
      '503 should tell the user the system is temporarily unavailable',
    ).toContain('temporarily unavailable');

    await page.screenshot({
      path: 'test-results/gv-503-honest-banner.png',
      fullPage: true,
    });
  });

  // --------------------------------------------------------------------------
  // TEST 2 — 500 server error JSON also avoids the cache/schema false lead.
  // --------------------------------------------------------------------------
  test('500 server error JSON shows a backend-error message, not cache advice', async ({
    page,
  }) => {
    await loginToApp(page);
    await navigateToPage(page, '/accounting/general-voucher');
    await expect(page.locator('button:has-text("New CV")').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    await interceptWithJsonError(page, 500, 'Server Error');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Error loading general vouchers')).toBeVisible({ timeout: 10000 });

    const bodyText = await page.locator('body').innerText();
    for (const fragment of FALSE_LEAD_FRAGMENTS) {
      expect(
        bodyText,
        `500 must NOT surface the false lead: "${fragment}"`,
      ).not.toContain(fragment);
    }
    expect(
      bodyText.toLowerCase(),
      '500 should be reported as an internal/server error',
    ).toContain('internal error');
  });
});
