import { test, expect, Page } from '@playwright/test';

/**
 * Sign-in page. /api/login is stubbed with page.route: no real backend, no real credentials.
 * Screenshots go to .playwright-mcp/signin-after-*.png.
 */
const SHOTS = 'C:/Projects/fuerte/.playwright-mcp';
const WRONG = 'Invalid credentials! Please check your email and password.';

async function open(page: Page, dark = false) {
  await page.addInitScript((isDark) => {
    try { localStorage.setItem('color-theme', JSON.stringify(isDark ? 'dark' : 'light')); } catch { /* ignore */ }
  }, dark);
  await page.route('**/api/login', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthenticated"}' }),
  );
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible({ timeout: 90_000 });
  // Typing before React hydrates is lost.
  await page.waitForFunction(() => {
    const input = document.querySelector('input[type="email"]');
    return !!input && Object.keys(input).some((key) => key.startsWith('__reactProps'));
  }, undefined, { timeout: 60_000 });
  // Signed out, nothing mounts useColorMode, so the page does not read color-theme: set the class by hand.
  if (dark) await page.evaluate(() => document.body.classList.add('dark'));
}

test('labels, show/hide, inline error, no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const email = page.getByLabel('Email');
  const password = page.getByLabel('Password', { exact: true });
  await expect(email).toHaveAttribute('type', 'email');
  await expect(password).toHaveAttribute('type', 'password');

  const toggle = page.getByRole('button', { name: 'Show' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Hide' }).click();
  await expect(password).toHaveAttribute('type', 'password');

  await page.screenshot({ path: `${SHOTS}/signin-after-360-light-default.png` });

  await email.fill('e2e.signin@example.test');
  await password.fill('Not-a-real-password-1');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page.getByTestId('login-live')).toContainText(WRONG);
  await expect(email).toHaveValue('e2e.signin@example.test');
  await expect(password).toHaveValue('');
  await expect(password).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `${SHOTS}/signin-after-360-light-error.png` });
});

for (const dark of [false, true]) {
  test(`screenshots 1440 and 360 ${dark ? 'dark' : 'light'}`, async ({ page }) => {
    const theme = dark ? 'dark' : 'light';
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, dark);
    await page.screenshot({ path: `${SHOTS}/signin-after-1440-${theme}-default.png` });
    await page.getByLabel('Email').fill('e2e.signin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('x');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByTestId('login-live')).toContainText(WRONG);
    await page.screenshot({ path: `${SHOTS}/signin-after-1440-${theme}-error.png` });
    if (dark) {
      await page.setViewportSize({ width: 360, height: 760 });
      await page.screenshot({ path: `${SHOTS}/signin-after-360-dark-error.png` });
    }
  });
}
