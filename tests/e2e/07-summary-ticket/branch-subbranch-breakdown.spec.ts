/**
 * Summary Ticket — Branch & Sub-Branch Breakdown (hierarchical view)
 *
 * The Summary Ticket lives on the LANDING page http://localhost:3000/
 * (rendered by DefaultPage for any non-ACCTG role; OWNER sees the full
 * dropdowns + breakdown toggle).
 *
 * Verifies the 2026-05-22 enhancement that adds Main-Branch grouping above
 * the existing sub-branch rows in the Summary Ticket breakdown.
 */

import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OWNER_EMAIL = 'test.owner@fuerte.test';
const OWNER_PASSWORD = 'TestPass2026!';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../../.playwright-mcp/summary-ticket');

function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function shot(page: Page, name: string) {
  ensureScreenshotDir();
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`   📸 ${file}`);
}

/**
 * Dismisses any Next.js dev-mode error overlay (rendered as <nextjs-portal />)
 * and force-reloads the page if the dashboard didn't render. Pre-existing bug
 * in ActiveBranchSwitcher (`useAuthStore is not a function`) sometimes throws
 * on cold compile but recovers on reload.
 */
async function ensureDashboardRendered(page: Page) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    // Dismiss any Next.js error overlay if present
    const overlay = page.locator('nextjs-portal');
    if (await overlay.count() > 0) {
      console.log(`   ⚠️ Next.js error overlay detected (attempt ${attempt}); dismissing + reloading`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
    }

    // If #startDate is visible, we're good
    if (await page.locator('#startDate').count() > 0 && await page.locator('#startDate').isVisible().catch(() => false)) {
      return;
    }

    await page.waitForTimeout(1500);
  }
  throw new Error('Dashboard never rendered after 4 attempts (Next.js error overlay persisted)');
}

async function loginAsOwner(page: Page) {
  // Clear any prior session — Zustand persists auth in localStorage
  await page.context().clearCookies();
  await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });
  await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // pressSequentially fires real keyboard events so react-hook-form registers the change
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.click();
  await emailInput.fill('');
  await emailInput.pressSequentially(OWNER_EMAIL, { delay: 20 });

  const pwdInput = page.locator('input[type="password"]').first();
  await pwdInput.click();
  await pwdInput.fill('');
  await pwdInput.pressSequentially(OWNER_PASSWORD, { delay: 20 });
  await pwdInput.press('Enter');

  await page.waitForURL(url => !url.toString().includes('/auth/signin'), { timeout: 25000 });
  await page.waitForTimeout(1500);
  console.log(`   ✓ Logged in as OWNER: ${OWNER_EMAIL}`);
}

async function pickReactSelectOption(page: Page, selectIndex: number, optionText: string) {
  const select = page.locator('[class*="react-select__control"]').nth(selectIndex);
  await select.click();
  await page.waitForTimeout(400);
  const option = page.locator('[class*="react-select__option"]', { hasText: optionText }).first();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
  await page.waitForTimeout(400);
}

async function pickDateByTyping(page: Page, inputSelector: string, mmddyyyy: string) {
  const input = page.locator(inputSelector);
  await input.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type(mmddyyyy, { delay: 25 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
}

function parsePeso(text: string | null): number {
  if (!text) return 0;
  const cleaned = text.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

test.describe('Summary Ticket - Branch & Sub-Branch Breakdown (landing page)', () => {

  test('OWNER sees hierarchical Main Branch -> Sub-Branch breakdown when toggle is on', async ({ page }) => {
    test.setTimeout(150 * 1000);

    console.log('\n🔐 Step 1: Login as OWNER');
    await loginAsOwner(page);
    await shot(page, '01-after-login');

    console.log('\n🧭 Step 2: Ensure we are on the landing page (/) where DefaultPage renders');
    if (!page.url().match(/localhost:3000\/?($|\?)/)) {
      await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
    await ensureDashboardRendered(page);
    await shot(page, '02-landing-page');

    console.log('\n📅 Step 3: Pick a wide date range (Jan 1 2024 -> today)');
    const today = new Date();
    const todayMMDDYYYY = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    await pickDateByTyping(page, '#startDate', '01/01/2024');
    await pickDateByTyping(page, '#endDate', todayMMDDYYYY);
    await shot(page, '03-dates-picked');

    console.log('\n🏢 Step 4: Select "All Main Branches" (Branch dropdown is 1st react-select)');
    await pickReactSelectOption(page, 0, 'All Main Branches');
    await page.waitForTimeout(800);
    await shot(page, '04-all-main-branches');

    console.log('\n⏳ Step 5: Wait for Summary Ticket main table');
    await page.waitForSelector('text=Summary Ticket as of', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot(page, '05-summary-loaded');

    console.log('\n☑️ Step 6: Verify new checkbox label exists');
    const checkboxLabel = page.locator('label[for="showBreakdown"]');
    await expect(checkboxLabel).toBeVisible();
    const labelText = (await checkboxLabel.textContent())?.trim();
    console.log(`   Label text: "${labelText}"`);
    expect(labelText).toBe('Show breakdown by branch & sub-branch');

    console.log('\n☑️ Step 7: Tick the breakdown checkbox + wait for SP to finish');
    await page.locator('#showBreakdown').check();
    // Wait for the loading indicator to disappear (SP over wide date range is slow)
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading Summary Ticket data'),
      null,
      { timeout: 90000 }
    );
    await page.waitForTimeout(1500); // settle render
    await shot(page, '07-breakdown-toggled');

    console.log('\n🔍 Step 8: Verify Summary-by-branch hierarchical structure');
    await expect(page.locator('h2', { hasText: 'SUMMARY BY BRANCH & SUB-BRANCH' })).toBeVisible({ timeout: 30000 });

    const summaryTable = page.locator('table', { has: page.locator('th', { hasText: 'BRANCH / SUB-BRANCH / TITLE' }) }).first();
    await expect(summaryTable).toBeVisible();

    const subBranchSubtotalCount = await summaryTable.locator('tr', { hasText: 'Sub-Branch Subtotal' }).count();
    console.log(`   Summary: Sub-Branch Subtotal rows = ${subBranchSubtotalCount}`);
    expect(subBranchSubtotalCount).toBeGreaterThan(0);

    const allSubtotalTexts = await summaryTable.locator('tr').filter({ hasText: 'Subtotal' }).allTextContents();
    const mainSubtotalTexts = allSubtotalTexts.filter(t => !/sub-branch subtotal/i.test(t));
    console.log(`   Summary: Main-Branch Subtotal rows = ${mainSubtotalTexts.length}`);
    expect(mainSubtotalTexts.length).toBeGreaterThan(0);

    const grandTotalRow = summaryTable.locator('tr', { hasText: 'GRAND TOTAL' });
    await expect(grandTotalRow).toBeVisible();

    console.log('\n🧮 Step 9: Summary Grand Total == sum of Main-Branch subtotals');
    const grandCells = await grandTotalRow.locator('td').allTextContents();
    const grandDebit = parsePeso(grandCells[2]);
    const grandCredit = parsePeso(grandCells[3]);
    let sumDebit = 0, sumCredit = 0;
    for (const t of mainSubtotalTexts) {
      const matches = t.match(/₱\s*[\d,.]+/g);
      if (matches && matches.length >= 2) {
        sumDebit  += parsePeso(matches[matches.length - 2]);
        sumCredit += parsePeso(matches[matches.length - 1]);
      }
    }
    console.log(`   Grand: debit=${grandDebit} credit=${grandCredit}`);
    console.log(`   Sum:   debit=${sumDebit} credit=${sumCredit}`);
    expect(Math.abs(grandDebit - sumDebit)).toBeLessThan(1);
    expect(Math.abs(grandCredit - sumCredit)).toBeLessThan(1);

    console.log('\n🔍 Step 10: Verify NET MOVEMENTS hierarchy');
    await page.locator('h2', { hasText: 'NET MOVEMENTS BY BRANCH & SUB-BRANCH' }).scrollIntoViewIfNeeded();
    await shot(page, '10-net-movements');

    const netTable = page.locator('table', { has: page.locator('th', { hasText: 'BRANCH / SUB-BRANCH / DESCRIPTION' }) }).first();
    await expect(netTable).toBeVisible();
    const netSubBranchCount = await netTable.locator('tr', { hasText: 'Sub-Branch Subtotal' }).count();
    console.log(`   Net Movements: Sub-Branch Subtotal rows = ${netSubBranchCount}`);
    expect(netSubBranchCount).toBeGreaterThan(0);

    const netGrandRow = netTable.locator('tr', { hasText: 'GRAND TOTAL' });
    await expect(netGrandRow).toBeVisible();

    console.log('\n🧮 Step 11: Net Movements Grand Total == sum of Main-Branch subtotals');
    const netSubtotalTexts = await netTable.locator('tr').filter({ hasText: 'Subtotal' }).allTextContents();
    const netMainSubtotals = netSubtotalTexts.filter(t => !/sub-branch subtotal/i.test(t));
    let netSum = 0;
    for (const t of netMainSubtotals) {
      const matches = t.match(/₱\s*[\d,.]+/g);
      if (matches && matches.length >= 1) {
        netSum += parsePeso(matches[matches.length - 1]);
      }
    }
    const netGrandCells = await netGrandRow.locator('td').allTextContents();
    const netGrand = parsePeso(netGrandCells[netGrandCells.length - 1]);
    console.log(`   Net Grand: ${netGrand}, Sum: ${netSum}`);
    expect(Math.abs(netGrand - netSum)).toBeLessThan(1);

    console.log('\n📸 Step 12: Final composite screenshots');
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, '12-final-top');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot(page, '12-final-bottom');

    console.log('\n✅ Hierarchical breakdown test PASSED');
  });

  test('Print button triggers PDF generation and returns a URL', async ({ page }) => {
    test.setTimeout(150 * 1000);

    await loginAsOwner(page);
    if (!page.url().match(/localhost:3000\/?($|\?)/)) {
      await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
    await ensureDashboardRendered(page);

    await pickDateByTyping(page, '#startDate', '01/01/2024');
    const today = new Date();
    const todayMMDDYYYY = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    await pickDateByTyping(page, '#endDate', todayMMDDYYYY);

    await pickReactSelectOption(page, 0, 'All Main Branches');
    await page.waitForSelector('text=Summary Ticket as of', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.locator('#showBreakdown').check();
    await page.waitForTimeout(3000);

    console.log('\n🖨️ Intercepting printSummaryDetails mutation response');
    const pdfPromise = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('PDF mutation did not complete within 60s')), 60000);
      page.on('response', async (resp) => {
        if (resp.url().endsWith('/fuerte-api') && resp.request().method() === 'POST') {
          try {
            const body = await resp.json();
            if (body?.data?.printSummaryDetails && typeof body.data.printSummaryDetails === 'string') {
              clearTimeout(timer);
              resolve(body.data.printSummaryDetails);
            }
          } catch {
            // non-JSON response
          }
        }
      });
    });

    // Stub window.open so we don't spawn an orphan tab; must be done synchronously
    // before the Print click so the handler picks up our stub.
    await page.evaluate(() => {
      (window as any).open = () => ({
        document: { write() {}, close() {} },
        close() {},
        location: { href: '' },
        closed: false,
      });
    });

    await page.locator('button:has-text("Print")').first().click();
    const pdfUrl = await pdfPromise;
    console.log(`   ✓ PDF URL returned: ${pdfUrl}`);
    expect(pdfUrl).toMatch(/\/storage\/pdf\/Summary_Ticket_.+\.pdf$/);

    console.log('\n✅ PDF generation test PASSED');
  });
});
