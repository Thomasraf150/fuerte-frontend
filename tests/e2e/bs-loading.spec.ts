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
test('owner balance sheet shows a loading indicator while fetching', async ({ page }) => {
  test.setTimeout(90000);
  let fired = false;
  page.on('request', (r) => { if (r.url().includes('/fuerte-api') && (r.postData()||'').includes('getBalanceSheet')) { fired = true; console.log('[REQ getBalanceSheet]'); } });
  await uiLoginAs(page, OWNER.email, OWNER.password);
  await page.route('**/fuerte-api', async (route) => {
    const body = route.request().postData() || '';
    if (body.includes('getBalanceSheet')) await new Promise((r) => setTimeout(r, 3000));
    await route.continue();
  });
  await page.goto(`${FRONTEND}/accounting/balance-sheet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  // Set the date range (react-datepicker text inputs).
  const start = page.getByPlaceholder('Start Date');
  await start.fill('04/01/2026'); await page.keyboard.press('Enter');
  const end = page.getByPlaceholder('End Date');
  await end.fill('04/30/2026'); await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  // Pick "All Main Branches" → triggers fetch.
  await page.locator('input[id^="react-select"]').first().click();
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  await page.keyboard.type('All Main'); await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1300); // mid-fetch (delayed 3s)
  const during = await page.locator('body').innerText();
  console.log('fetch fired:', fired, '| mid-fetch spinner:', during.includes('Loading balance sheet'));
  expect(fired, 'getBalanceSheet should fire').toBeTruthy();
  expect(during, 'spinner shows mid-fetch').toContain('Loading balance sheet');
  await page.waitForTimeout(3500);
  const after = await page.locator('body').innerText();
  console.log('after: spinner gone:', !after.includes('Loading balance sheet'));
});
