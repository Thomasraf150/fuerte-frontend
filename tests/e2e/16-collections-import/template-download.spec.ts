import { test, expect } from '@playwright/test';
import { restLogin } from '../../helpers/e2e-helpers';

const ADMIN = { email: 'admin@gmail.com', password: '123456' };

test('template download from the import dialog', async ({ page, request }) => {
  test.setTimeout(180_000);
  const { token, user } = await restLogin(request, ADMIN.email, ADMIN.password);
  await page.addInitScript(
    (d) => {
      localStorage.setItem('authStore', JSON.stringify({ state: { user: d.user, authToken: d.token }, version: 0 }));
    },
    { user, token },
  );

  // Surface everything that could explain "doesn't work".
  page.on('console', (m) => console.log('CONSOLE:', m.type(), m.text().slice(0, 200)));
  page.on('response', (r) => {
    if (r.url().includes('/imports/')) console.log('NET:', r.status(), r.url());
  });
  page.on('requestfailed', (r) => console.log('REQFAIL:', r.url(), r.failure()?.errorText));

  await page.goto('http://localhost:3000/imports', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('button', { name: 'Import Spreadsheet' }).click();

  const dl = page.waitForEvent('download', { timeout: 30_000 }).catch(() => null);
  await page.getByRole('button', { name: 'Download the template' }).click();

  const download = await dl;
  if (download) {
    console.log('DOWNLOAD OK:', download.suggestedFilename());
  } else {
    const err = await page.locator('.text-danger').textContent().catch(() => null);
    console.log('NO DOWNLOAD. Dialog error text:', err);
  }
  expect(download, 'a download should have started').toBeTruthy();
});
