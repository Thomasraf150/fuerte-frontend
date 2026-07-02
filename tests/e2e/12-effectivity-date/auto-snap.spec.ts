/**
 * Effectivity Date Auto-Snap E2E Tests
 *
 * Validates that each payment mode auto-generates schedule dates
 * correctly when a reference date and pattern are selected:
 *   1. Twice a Month — preset cutoff patterns (10/25, 15/30, 5/20) + custom
 *   2. Once a Month — day-of-month selector
 *   3. Day of the Week — weekday selector (Mon-Sat)
 *   4. Twice a Month (Other Week) — day-of-month + 1 week offset
 *
 * Strategy: locate an existing loan in status=0 (For Approval) — these are
 * the loans where the schedule has not been set yet. The test only reads
 * the preview table dates, it never approves the loan, so the loan stays
 * usable for subsequent runs.
 */

import { test, expect, Page } from '@playwright/test';
import { uiLogin, findLoanByStatus } from '../../helpers/e2e-helpers';

// Credentials are env-overridable so this suite can run either against the
// seeded test admin (DeletionApprovalTestUsersSeeder) or a real dev login,
// e.g.  E2E_ADMIN_EMAIL=owner@example.com E2E_ADMIN_PASSWORD=... npx playwright test
const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'test.admin@fuerte.test',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'TestPass2026!',
};
const FRONTEND = 'http://localhost:3000';

function parseDateMM(dateStr: string): Date {
  const [m, d, y] = dateStr.split('/').map(Number);
  return new Date(y, m - 1, d);
}

async function getPreviewDates(page: Page): Promise<string[]> {
  const all = await page
    .locator('dl .grid.grid-cols-3 dt:first-child')
    .allTextContents();
  // Filter to MM/dd/yyyy format only (skip the "Date" column header text)
  return all.filter((t) => /^\d{2}\/\d{2}\/\d{4}$/.test(t.trim())).map((t) => t.trim());
}

async function setupLoanPage(page: Page, loanId: number): Promise<void> {
  await uiLogin(page, ADMIN.email, ADMIN.password);
  await page.goto(`${FRONTEND}/loans-list/${loanId}`, { waitUntil: 'domcontentloaded' });

  // Wait for the loan detail page to finish loading (the Set Effectivity tab button must render)
  await page.locator('button:has-text("Set Effectivity")').first().waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('button:has-text("Set Effectivity")').first().click();
  await page.waitForTimeout(1500);

  // Wait for the Payment Method heading to appear (the form is now rendered)
  await page.locator('h3:has-text("Payment Method")').waitFor({ state: 'visible', timeout: 15000 });
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

test.describe('Effectivity Date — Auto-snap schedule generation', () => {
  test.setTimeout(180_000);

  let loanId: number;

  test.beforeAll(() => {
    const loan = findLoanByStatus(0);
    if (!loan) {
      throw new Error('No loan in status=0 (For Approval) found in dev DB. Create one first.');
    }
    loanId = loan.id;
    console.log(`   Using loan id=${loanId} for effectivity date tests`);
  });

  test('Twice a Month — 10/25 pattern generates dates on 10th and 25th', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="twice_a_month"]').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '10/25', exact: true }).click();
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length, `expected dates but got: ${JSON.stringify(dates)}`).toBeGreaterThan(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      expect([10, 25], `date ${txt} should be on 10th or 25th`).toContain(d.getDate());
    }
  });

  test('Twice a Month — 15/30 pattern generates dates on 15th and 30th (with Feb clamp)', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="twice_a_month"]').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '15/30', exact: true }).click();
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length).toBeGreaterThan(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      const day = d.getDate();
      // 30 may clamp to 28/29 in February
      expect([15, 30, 28, 29], `date ${txt} should be 15/30 or Feb clamp`).toContain(day);
    }
  });

  test('Twice a Month — 5/20 pattern generates dates on 5th and 20th', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="twice_a_month"]').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '5/20', exact: true }).click();
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length).toBeGreaterThan(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      expect([5, 20]).toContain(d.getDate());
    }
  });

  test('Twice a Month — Custom pattern (8/23) generates dates on 8th and 23rd', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="twice_a_month"]').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="custom-day1"]').fill('8');
    await page.locator('[data-testid="custom-day2"]').fill('23');
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length).toBeGreaterThan(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      expect([8, 23]).toContain(d.getDate());
    }
  });

  test('Once a Month — day 15 generates dates on the 15th', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="once_a_month"]').click();
    await page.waitForTimeout(500);

    // Click the "15" day-of-month pill (exact match avoids matching dates like "15/30")
    await page.locator('button').filter({ hasText: /^15$/ }).first().click();
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length).toBeGreaterThan(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      expect(d.getDate()).toBe(15);
    }
  });

  test('Day of the Week — Tuesday generates only Tuesdays', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="day_of_the_week"]').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Tue', exact: true }).click();
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length).toBeGreaterThan(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      expect(d.getDay(), `date ${txt} should be a Tuesday`).toBe(2);
    }
  });

  test('Thrice a Month — 1/11/21 preset generates dates only on 1st, 11th, 21st', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="thrice_a_month"]').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '1/11/21', exact: true }).click();
    await page.waitForTimeout(1000);

    // Capture the rendered screen for visual confirmation
    await page.locator('[data-testid="set-effectivity-section"]').screenshot({
      path: 'test-results/thrice-a-month-1-11-21.png',
    });

    const dates = await getPreviewDates(page);
    expect(dates.length, `expected dates but got: ${JSON.stringify(dates)}`).toBeGreaterThan(0);
    // 3 installments per month
    expect(dates.length % 3, 'thrice-a-month should produce a multiple of 3 dates').toBe(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      expect([1, 11, 21], `date ${txt} should be on the 1st/11th/21st`).toContain(d.getDate());
    }

    // Strictly ascending → maturity = last date is correct
    for (let i = 1; i < dates.length; i++) {
      expect(
        parseDateMM(dates[i]).getTime(),
        `dates must be ascending: ${dates[i - 1]} -> ${dates[i]}`,
      ).toBeGreaterThan(parseDateMM(dates[i - 1]).getTime());
    }
  });

  test('Thrice a Month — Custom triple (5/15/25) generates dates on 5th, 15th, 25th', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="thrice_a_month"]').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="custom-day1"]').fill('5');
    await page.locator('[data-testid="custom-day2"]').fill('15');
    await page.locator('[data-testid="custom-day3"]').fill('25');
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.length % 3).toBe(0);

    for (const txt of dates) {
      const d = parseDateMM(txt);
      expect([5, 15, 25]).toContain(d.getDate());
    }
  });

  test('Twice a Month (Other Week) — day 10 generates 10th and 17th alternating', async ({ page }) => {
    await setupLoanPage(page, loanId);

    await page.locator('label[for="twice_a_month_oth_week"]').click();
    await page.waitForTimeout(500);

    await page.locator('button').filter({ hasText: /^10$/ }).first().click();
    await page.waitForTimeout(1000);

    const dates = await getPreviewDates(page);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.length % 2, 'should generate pairs').toBe(0);

    for (let i = 0; i < dates.length; i += 2) {
      expect(parseDateMM(dates[i]).getDate(), `pair[${i}] first should be 10th`).toBe(10);
      expect(parseDateMM(dates[i + 1]).getDate(), `pair[${i}] second should be 17th`).toBe(17);
    }
  });
});
