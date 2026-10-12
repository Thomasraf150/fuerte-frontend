/**
 * The "dated" surfaces cleaned up 2026-10-12: the branded 404, the header avatar (initials, no
 * stock photo), the Dashboard's tab title, and the record-page breadcrumb that used to say a
 * literal "Loading...". NO CREDENTIALS AND NO BACKEND: see ../26-new-application/borrowerFormHarness.ts
 * (fake token, every backend request answered by the stub).
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/35-dated-surfaces --reporter=line
 */
import path from 'path';
import { expect, FakeBackend, openNewBorrower, signedInAs, test } from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

const SHOTS = path.resolve(__dirname, '../../../../.playwright-mcp');
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '360', width: 360, height: 740 },
];

test('an unknown route shows the branded 404, and its Dashboard link leaves it', async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const response = await page.goto('/no-such-page-e2e', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: "We can't find that page" })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('FUERTE Lending')).toBeAttached(); // the lockup's accessible name
    await page.screenshot({ path: path.join(SHOTS, `dated-after-404-${vp.name}.png`) });
  }

  const back = page.getByRole('link', { name: 'Back to the Dashboard' });
  await expect(back).toHaveAttribute('href', '/');
  await back.click();
  await expect(page).not.toHaveURL(/no-such-page-e2e/);
});

test('the header avatar shows the signed-in user\'s initials, not a stock photo', async ({ page, backend }) => {
  await signedInAs(page, backend, [9101]);
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await openNewBorrower(page);
    const avatar = page.getByRole('img', { name: 'Signed in as E2E Admin' });
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveText('EA');
    await expect(page.locator('img[src*="user-01"]')).toHaveCount(0);
    await expect(page.locator('img[src*="user-06"]')).toHaveCount(0);
    await page.locator('header').first().screenshot({ path: path.join(SHOTS, `dated-after-avatar-${vp.name}.png`) });
  }

  // The dead "My Contacts" item is gone from the menu.
  await page.getByRole('img', { name: 'Signed in as E2E Admin' }).click();
  await expect(page.getByRole('link', { name: 'My Profile' })).toBeVisible();
  await expect(page.getByText('My Contacts')).toHaveCount(0);
});

test('"/" is titled "Dashboard · Fuerte Lending" in the page itself', async ({ page }) => {
  // The title now comes from the server page's metadata, so it is in the HTML before any script runs.
  const html = await (await page.request.get('/')).text();
  expect(html).toContain('<title>Dashboard · Fuerte Lending</title>');
});

test('a record page whose data is pending shows a skeleton in the breadcrumb, not "Loading..."', async ({ page, backend }: { page: import('@playwright/test').Page; backend: FakeBackend }) => {
  await signedInAs(page, backend, [9101]);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  backend.extraGraphql.set('getLoan', async () => {
    await pending;
    return { data: { getLoan: [] } };
  });

  await page.goto('/loans-list/1', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const title = page.locator('h2').first();
  await expect(title.getByRole('status')).toBeAttached({ timeout: 90_000 });
  await expect(title).not.toContainText('Loading...');
  await expect(page.getByText('Loading...', { exact: true })).toHaveCount(0);
  release();
});
