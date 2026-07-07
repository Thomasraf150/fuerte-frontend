import { test, expect } from '@playwright/test';

/**
 * Fable-audit smoke: after the security lockdown (every resolver now requires
 * auth), confirm a LOGGED-IN user's screens still load their data — i.e. the
 * gates deny anonymous callers without breaking the authenticated UI.
 *
 * Auth is injected via the real Sanctum token (fetched from the REST login)
 * straight into the persisted Zustand store, avoiding UI-login timing flake.
 */
const SHOT =
  'C:/Users/Rafael/AppData/Local/Temp/claude/c--Projects-fuerte/3d82487e-bb1e-4646-acb3-8344c5b81ce5/scratchpad';

test('gated screens still load for an authenticated user', async ({ page, request }) => {
  test.setTimeout(150000);

  // 1. Real token from the REST login (unchanged by this branch).
  const resp = await request.post('http://localhost:8080/api/login', {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    data: { email: 'admin@gmail.com', password: '123456' },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.token).toBeTruthy();

  // 2. Seed the persisted authStore before any app code runs.
  await page.addInitScript((payload) => {
    localStorage.setItem(
      'authStore',
      JSON.stringify({ state: { user: payload.user, authToken: payload.token }, version: 0 }),
    );
  }, { user: body.user, token: body.token });

  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  // 3. General Voucher list — backed by getCheckVoucher (was fail-open, now gated).
  await page.goto('http://localhost:3000/accounting/general-voucher', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  expect(page.url(), 'should not be bounced to signin').not.toContain('/auth/signin');
  const gvBody = await page.locator('body').innerText();
  expect(gvBody).not.toContain('Unauthenticated');
  await page.screenshot({ path: `${SHOT}/smoke-general-voucher.png`, fullPage: true });

  // 4. Borrowers list — backed by borrower PII resolvers (now gated).
  await page.goto('http://localhost:3000/borrowers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  expect(page.url(), 'should not be bounced to signin').not.toContain('/auth/signin');
  const bBody = await page.locator('body').innerText();
  expect(bBody).not.toContain('Unauthenticated');
  await page.screenshot({ path: `${SHOT}/smoke-borrowers.png`, fullPage: true });

  // eslint-disable-next-line no-console
  console.log('SMOKE_CONSOLE_ERRORS:', consoleErrors.slice(0, 8).join(' || ') || '(none)');
});
