/**
 * Captures mid-breakdown screenshots so we can visually confirm that Main-Branch
 * and Sub-Branch headers include the inline borrower count (e.g.
 * "MARIKINA FA (147 borrowers)" and "FA Branch (FA-001) · 32 borrowers").
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OWNER_EMAIL = 'test.owner@fuerte.test';
const OWNER_PASSWORD = 'TestPass2026!';
const SHOT_DIR = path.resolve(__dirname, '../../../.playwright-mcp/summary-ticket');

test('Capture mid-breakdown headers with borrower counts', async ({ page }) => {
  test.setTimeout(150 * 1000);

  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

  // Login
  await page.context().clearCookies();
  await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.waitForTimeout(800);
  const email = page.locator('input[type="email"]').first();
  await email.click(); await email.fill(''); await email.pressSequentially(OWNER_EMAIL, { delay: 20 });
  const pwd = page.locator('input[type="password"]').first();
  await pwd.click(); await pwd.fill(''); await pwd.pressSequentially(OWNER_PASSWORD, { delay: 20 });
  await pwd.press('Enter');
  await page.waitForURL(u => !u.toString().includes('/auth/signin'), { timeout: 20000 });

  // Land on /, dismiss any dev overlay
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await page.locator('nextjs-portal').count() > 0) {
    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
  }

  // Set dates + branch
  const today = new Date();
  const mmddyyyy = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  const setDate = async (sel: string, val: string) => {
    const i = page.locator(sel);
    await i.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
    await page.keyboard.type(val, { delay: 25 }); await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  };
  await setDate('#startDate', '01/01/2024');
  await setDate('#endDate', mmddyyyy);

  // Branch = All Main Branches
  await page.locator('[class*="react-select__control"]').nth(0).click();
  await page.waitForTimeout(400);
  await page.locator('[class*="react-select__option"]', { hasText: 'All Main Branches' }).first().click();
  await page.waitForSelector('text=Summary Ticket as of', { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Toggle breakdown + wait for SP
  await page.locator('#showBreakdown').check();
  await page.waitForFunction(
    () => !document.body.textContent?.includes('Loading Summary Ticket data'),
    null,
    { timeout: 90000 }
  );
  await page.waitForTimeout(1200);

  // Scroll to the breakdown header and capture
  const breakdownH2 = page.locator('h2', { hasText: 'SUMMARY BY BRANCH & SUB-BRANCH' });
  await breakdownH2.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -50));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, 'borrowers-section-top.png'), fullPage: false });
  console.log('   📸 borrowers-section-top.png');

  // Scroll a bit further down to get a mid-table view showing main + sub headers
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, 'borrowers-section-mid1.png'), fullPage: false });
  console.log('   📸 borrowers-section-mid1.png');

  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, 'borrowers-section-mid2.png'), fullPage: false });
  console.log('   📸 borrowers-section-mid2.png');

  // Print to get a fresh PDF with the updated Blade view
  await page.evaluate(() => {
    (window as any).open = () => ({
      document: { write() {}, close() {} }, close() {}, location: { href: '' }, closed: false,
    });
  });
  const pdfPromise = new Promise<string>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('PDF mutation timeout')), 60000);
    page.on('response', async resp => {
      if (resp.url().endsWith('/fuerte-api') && resp.request().method() === 'POST') {
        try {
          const body = await resp.json();
          if (body?.data?.printSummaryDetails) { clearTimeout(t); resolve(body.data.printSummaryDetails); }
        } catch {}
      }
    });
  });
  await page.locator('button:has-text("Print")').first().click();
  const pdfUrl = await pdfPromise;
  console.log(`   ✓ Fresh PDF generated: ${pdfUrl}`);
});
