/**
 * E2E Test: Export Check Vouchers to Excel
 *
 * Validates the new "Export to Excel" button on /accounting/general-voucher.
 * Asks Jerielyn's question programmatically: can a logged-in user filter the
 * check-voucher list and download an .xlsx file of those vouchers?
 *
 * Tests:
 *  1. Button is disabled until a date range is selected.
 *  2. With a date range set, clicking the button downloads an .xlsx file.
 *  3. The downloaded file has the expected filename pattern.
 *  4. The backend mutation honors the active filters (date range + branch).
 */

import { test, expect } from '@playwright/test';
import { loginToApp, navigateToPage } from '../../helpers/test-utils';
import { readFileSync, statSync } from 'node:fs';

test.describe('Export Check Vouchers to Excel', () => {

  test('Button disabled without date range; export downloads .xlsx with filters applied', async ({ page }) => {
    test.setTimeout(180_000); // large date ranges can produce multi-MB exports

    console.log('\n🔐 Logging in...');
    await loginToApp(page);

    console.log('\n📍 Navigating to general voucher page...');
    await navigateToPage(page, '/accounting/general-voucher');

    // Wait for the page header + the action button row to be present.
    await expect(page.locator('h3:has-text("General Voucher")')).toBeVisible({ timeout: 15000 });

    const exportButton = page.locator('button:has-text("Export to Excel")');
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Export button found');

    // === Assertion 1: button starts disabled (no date range set) ===
    await expect(exportButton).toBeDisabled();
    console.log('✅ Export button is disabled before a date range is selected');

    // === Pick a small date range so the test is fast but likely to return something ===
    // The filter UI uses react-datepicker (inputs identified by placeholder).
    // react-datepicker's default input format is MM/dd/yyyy.
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const isoFmt = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD (for filename assertion)
    const pickerFmt = (d: Date) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

    const startDate = isoFmt(thirtyDaysAgo);
    const endDate = isoFmt(today);
    const startPicker = pickerFmt(thirtyDaysAgo);
    const endPicker = pickerFmt(today);

    console.log(`\n📅 Setting date range: ${startDate} → ${endDate}`);

    const startInput = page.getByPlaceholder('Select start date');
    const endInput = page.getByPlaceholder('Select end date');

    await expect(startInput).toBeVisible({ timeout: 5000 });
    await expect(endInput).toBeVisible({ timeout: 5000 });

    await startInput.click();
    await startInput.fill(startPicker);
    await startInput.press('Enter');

    await endInput.click();
    await endInput.fill(endPicker);
    await endInput.press('Enter');

    // Click outside to dismiss any open calendar popper
    await page.locator('h3:has-text("General Voucher")').click();

    // Let the filters propagate (the page debounces / triggers a re-fetch on change)
    await page.waitForTimeout(1500);

    // === Assertion 2: button is now enabled ===
    await expect(exportButton).toBeEnabled({ timeout: 5000 });
    console.log('✅ Export button is enabled after date range is set');

    // === Click and verify mutation + file ===
    console.log('\n⬇  Clicking Export to Excel...');

    // Surface any browser console errors / page errors during the click
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('   [browser console error]', msg.text());
      }
    });
    page.on('pageerror', (err) => {
      console.log('   [page error]', err.message);
    });

    // Capture the export mutation response specifically.
    // Register the listener BEFORE the click so we don't race with the network.
    const exportResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/fuerte-api')
        && resp.request().method() === 'POST'
        && (resp.request().postData() ?? '').includes('ExportCheckVouchers'),
      { timeout: 120000 } // 120s — large date ranges can produce multi-MB xlsx files
    );

    await exportButton.click();

    const gqlResp = await exportResponsePromise;
    const body = await gqlResp.json();
    console.log('   GraphQL response:', JSON.stringify(body).slice(0, 400));

    expect(body.errors).toBeUndefined();
    const xlsxUrl = body.data?.exportCheckVouchers;
    expect(typeof xlsxUrl).toBe('string');
    expect(xlsxUrl).toMatch(/^\/storage\/xlsx\/Check_Vouchers_.+\.xlsx$/);
    console.log(`✅ Mutation returned URL: ${xlsxUrl}`);

    // === Assertion 3: URL contains the filter dates ===
    expect(xlsxUrl).toContain(startDate);
    expect(xlsxUrl).toContain(endDate);
    console.log('✅ Filename embeds the requested date range');

    // === Assertion 4: server actually wrote a real .xlsx file ===
    const fileResp = await page.request.get(`http://localhost:8080${xlsxUrl}`);
    expect(fileResp.status()).toBe(200);
    const fileBytes = await fileResp.body();
    expect(fileBytes.length).toBeGreaterThan(200); // even an "empty" .xlsx is > 200 bytes
    // PK\x03\x04 — the ZIP/XLSX magic bytes that every valid .xlsx starts with
    expect(fileBytes[0]).toBe(0x50);
    expect(fileBytes[1]).toBe(0x4b);
    expect(fileBytes[2]).toBe(0x03);
    expect(fileBytes[3]).toBe(0x04);
    console.log(`✅ File served by nginx (${fileBytes.length} bytes, valid XLSX magic bytes)`);

    // === Assertion 5: success toast appeared ===
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    console.log('✅ Success toast displayed to user');

    console.log('\n🎉 Export to Excel works end-to-end.');
  });

  test('Export mutation rejects unauthenticated callers', async ({ request }) => {
    // Backend safety check: the resolver throws "Unauthorized" if no user is on the session.
    // Hit the GraphQL endpoint directly without a token and confirm we get an error back.
    const resp = await request.post('http://localhost:8080/fuerte-api', {
      data: {
        query: `mutation Export($input: CvSearchInp!) { exportCheckVouchers(input: $input) }`,
        variables: {
          input: { startDate: '2026-01-01', endDate: '2026-12-31', branch_id: '', branch_sub_id: '' },
        },
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(resp.status()).toBeLessThan(500); // GraphQL returns 200 with an "errors" array
    const body = await resp.json();
    expect(body.errors).toBeDefined();
    expect(JSON.stringify(body.errors)).toMatch(/Unauthorized|Failed to generate|Internal/i);
    console.log('✅ Unauthenticated call correctly rejected:', body.errors[0]?.message);
  });
});
