import { test, expect } from '@playwright/test';

const SHOT =
  'C:/Users/Rafael/AppData/Local/Temp/claude/c--Projects-fuerte/3d82487e-bb1e-4646-acb3-8344c5b81ce5/scratchpad';

test('JV detail page now shows the red Cancel Entry button', async ({ page, request }) => {
  test.setTimeout(120000);

  const resp = await request.post('http://localhost:8080/api/login', {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    data: { email: 'fuerterafael@gmail.com', password: 'ILoveLending100!' },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.token).toBeTruthy();

  await page.addInitScript((payload) => {
    localStorage.setItem(
      'authStore',
      JSON.stringify({ state: { user: payload.user, authToken: payload.token }, version: 0 }),
    );
  }, { user: body.user, token: body.token });

  await page.goto('http://localhost:3000/accounting/general-voucher/53867?type=jv', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(3500);

  const cancelEntry = page.getByRole('button', { name: 'Cancel Entry' });
  const backBtn = page.getByRole('button', { name: 'Back' });

  await page.screenshot({ path: `${SHOT}/jv-cancel-button.png`, fullPage: true });

  await expect(cancelEntry, 'red Cancel Entry button should now exist on a JV').toBeVisible();
  await expect(backBtn, 'close button should now read Back').toBeVisible();
});
