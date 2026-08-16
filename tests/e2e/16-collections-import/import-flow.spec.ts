import { test, expect } from '@playwright/test';
import { restLogin } from '../../helpers/e2e-helpers';
import * as path from 'path';

/**
 * End-to-end proof of the collections import feature, through the real UI:
 *
 *   sidebar Imports -> Import Spreadsheet -> dialog -> upload the REAL trial file
 *   (typed by the office) -> review page auto-validates -> typed confirm gate
 *   -> commit -> persistent result -> CANCEL (leaves the dev DB clean).
 *
 * The trial file's 3 rows resolve to real loans (MA-0458 / MA-0473 / MA-0489).
 * Reversal at the end soft-cancels everything the test posted.
 */

const ADMIN = { email: 'admin@gmail.com', password: '123456' };
const TRIAL = process.env.IMPORT_TRIAL_FILE
  ?? path.resolve(__dirname, 'fixtures/Fuerte_Daily_Collections_Trial.xlsx');
const SHOTS = 'test-results/import-flow';

test('collections import: upload, validate, confirm, commit, reverse', async ({ page, request }) => {
  test.setTimeout(420_000);

  const { token, user } = await restLogin(request, ADMIN.email, ADMIN.password);
  await page.addInitScript(
    (d) => {
      localStorage.setItem(
        'authStore',
        JSON.stringify({ state: { user: d.user, authToken: d.token }, version: 0 }),
      );
    },
    { user, token },
  );

  // ---- 1. the general Imports screen (sidebar destination) -----------------
  await page.goto('http://localhost:3000/imports', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const importBtn = page.getByRole('button', { name: 'Import Spreadsheet' });
  await expect(importBtn, 'Import Spreadsheet button on the /imports page').toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: `${SHOTS}/1-imports-page.png` });

  // ---- 2. dialog: pick the real trial file ---------------------------------
  await importBtn.click();
  const dialog = page.getByRole('dialog', { name: 'Import Spreadsheet from a file' });
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/2-dialog.png` });

  await dialog.locator('input[type="file"]').setInputFiles(path.resolve(TRIAL));
  await expect(dialog.getByText('Fuerte_Daily_Collections_Trial.xlsx')).toBeVisible();

  await dialog.getByRole('button', { name: /Upload & check/ }).click();

  // ---- 3. review page: auto-validate shows 3 ready, correct total ----------
  await page.waitForURL('**/imports/IMP-*', { timeout: 90_000 });
  await expect(page.getByText('Ready to post')).toBeVisible({ timeout: 90_000 });

  // counts strip: 3 rows, 3 ready, 0 rejected, formatted peso total
  await expect(page.getByText('₱4,250.00')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Rows in file')).toBeVisible();
  await expect(page.getByText('Rejected — will not post')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/3-review.png`, fullPage: true });

  // the partial-payment warning rows surface (MA-0473 is a genuine partial)
  await expect(page.getByText(/Partial payment/).first()).toBeVisible();

  // ---- 4. confirm gate: checkbox beside the summary enables the button -----
  const commitBtn = page.getByRole('button', { name: /Post 3 collections/ });
  await expect(commitBtn, 'commit stays disabled until the box is ticked').toBeDisabled();

  // the summary the clerk confirms sits right beside the checkbox
  await expect(page.getByText('Ready to post')).toBeVisible();
  await page.getByText('These match the paper collection sheet.').click();
  await expect(commitBtn).toBeEnabled();
  await page.screenshot({ path: `${SHOTS}/4-confirm.png` });

  // ---- 5. commit ------------------------------------------------------------
  await commitBtn.click();
  await expect(page.getByText(/Posted 3 collections/), 'persistent result panel').toBeVisible({
    timeout: 180_000,   // includes the batch balance sweep
  });
  await page.screenshot({ path: `${SHOTS}/5-committed.png`, fullPage: true });

  // ---- 6. verify through the API what the UI claims ------------------------
  const batchRef = page.url().split('/imports/')[1];
  const api = await request.get(`http://localhost:8080/api/imports/${batchRef}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await api.json();
  expect(payload.batch.status).toBe('committed');
  expect(payload.batch.committed_count).toBe(3);
  expect(payload.rows.filter((r: any) => r.outcome === 'committed')).toHaveLength(3);

  // ---- 7. reverse, so the dev DB ends clean --------------------------------
  await page.getByRole('button', { name: /Cancel this posting/ }).click();
  // the system-wide SweetAlert confirmation, not a native prompt
  await page.getByRole('button', { name: 'Yes, cancel it' }).click();
  await expect(page.getByText(/This posting was cancelled/), 'cancellation confirmation panel').toBeVisible({
    timeout: 180_000,
  });
  await page.screenshot({ path: `${SHOTS}/6-reversed.png`, fullPage: true });

  const after = await request.get(`http://localhost:8080/api/imports/${batchRef}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect((await after.json()).batch.status).toBe('reversed');
});
