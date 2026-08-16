import { test, expect } from '@playwright/test';
import { restLogin } from '../../helpers/e2e-helpers';

const ADMIN = { email: 'admin@gmail.com', password: '123456' };

/** The import dialog must stay fully on-screen at every width we support. */
const WIDTHS = [
  { w: 360, h: 740, label: 'budget-android' },
  { w: 768, h: 900, label: 'tablet' },
  { w: 953, h: 1026, label: 'narrow-desktop' }, // the width from the bug report
  { w: 1440, h: 900, label: 'desktop' },
];

for (const { w, h, label } of WIDTHS) {
  test(`import dialog fits at ${w}px (${label})`, async ({ page, request }) => {
    test.setTimeout(120_000);
    const { token, user } = await restLogin(request, ADMIN.email, ADMIN.password);
    await page.addInitScript(
      (d) => {
        localStorage.setItem('authStore', JSON.stringify({ state: { user: d.user, authToken: d.token }, version: 0 }));
      },
      { user, token },
    );

    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:3000/imports', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByRole('button', { name: 'Import Spreadsheet' }).click();

    const dialog = page.getByRole('dialog', { name: 'Import Spreadsheet from a file' });
    await expect(dialog).toBeVisible();

    // The panel is the dialog's only child; assert IT is inside the viewport.
    const box = await dialog.locator('> div').first().boundingBox();
    expect(box, 'dialog panel should have a box').toBeTruthy();
    expect.soft(box!.x, `left edge off-screen at ${w}px`).toBeGreaterThanOrEqual(0);
    expect.soft(box!.x + box!.width, `right edge off-screen at ${w}px`).toBeLessThanOrEqual(w + 1);

    // The title and both actions must be reachable, not clipped away.
    await expect(dialog.getByRole('heading', { name: 'Import Spreadsheet' })).toBeInViewport();
    await expect(dialog.getByRole('button', { name: /Upload & check/ })).toBeInViewport();

    await page.screenshot({ path: `test-results/dialog-responsive/${w}-${label}.png` });
  });
}
