/**
 * Renders the most-recent Check Voucher PDF in Chromium's built-in PDF
 * viewer and saves a full-page screenshot so the implementation can be
 * eyeballed for visual correctness.
 */

import { test } from '@playwright/test';
import { restLogin, gqlAs } from '../helpers/e2e-helpers';

const ADMIN = { email: 'test.admin@fuerte.test', password: 'TestPass2026!' };

test('screenshot CV PDF with signature footer', async ({ request, browser }) => {
  test.setTimeout(60_000);

  const admin = await restLogin(request, ADMIN.email, ADMIN.password);
  const cvResp = await gqlAs(
    request,
    admin.token,
    `query { getCheckVoucher(first: 1, page: 1, orderBy: [{column: "id", order: DESC}]) { data { journal_ref } } }`,
  );
  const ref = cvResp?.data?.getCheckVoucher?.data?.[0]?.journal_ref;

  const printResp = await gqlAs(
    request,
    admin.token,
    `mutation($input: AcctgEntryInput!) { printAcctgEntries(input: $input) }`,
    { input: { journal_ref: ref } },
  );
  const pdfUrl = `http://localhost:8080${printResp?.data?.printAcctgEntries}`;
  console.log('  ↳ PDF URL:', pdfUrl);

  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1500 } });
  const page = await ctx.newPage();
  await page.goto(pdfUrl, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'test-results/cv-pdf-screenshot.png', fullPage: true });
  // Scroll down to capture page 2 of the voucher (duplicate copy)
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/cv-pdf-page2.png', fullPage: false });
  await ctx.close();
  console.log('  ✓ Saved screenshot to test-results/cv-pdf-screenshot.png');
});
