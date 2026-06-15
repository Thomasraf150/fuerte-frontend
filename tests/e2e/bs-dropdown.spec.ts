import { test, expect, Page } from '@playwright/test';
const FRONTEND = 'http://localhost:3000';
const OWNER = { email: 'fuerterafael@gmail.com', password: 'Fuerte2026!' };
async function uiLoginAs(page: Page, email: string, password: string) {
  await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.waitForTimeout(800);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('/auth/signin'), { timeout: 20000 });
  await page.waitForTimeout(1500);
}
test('owner: balance sheet branch dropdown lists branches (null-user-id fix)', async ({ page }) => {
  test.setTimeout(90000);
  await uiLoginAs(page, OWNER.email, OWNER.password);
  await page.goto(`${FRONTEND}/accounting/balance-sheet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  // Focus the first react-select and open it via keyboard (robust vs click).
  await page.locator('input[id^="react-select"]').first().click();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(1200);
  const options = await page.getByRole('option').allInnerTexts();
  console.log('branch options (' + options.length + '):', options.slice(0, 8).join(' | '));
  expect(options.length).toBeGreaterThan(2); // "All Main Branches" + real branches
});
