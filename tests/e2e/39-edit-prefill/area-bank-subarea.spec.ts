/**
 * Area, Bank and Sub Area: Edit shows the record's saved Branch Sub / Area.
 * Each form fetches its own dropdown options when it opens. See ./harness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/area-bank-subarea.spec.ts --reporter=line --workers=1
 */
import type { Page } from '@playwright/test';
import { APP, Gate, ORDERS, expect, paginated, served, test } from './harness';

test.setTimeout(120_000);

const SUB_BRANCHES = [{ id: '5', name: 'Telebastagan Main' }, { id: '16', name: 'MB 1' }, { id: '50', name: 'FB Telabastagan' }];
const AREAS = [
  { id: '61', branch_sub_id: 5, name: 'E2E Area North', description: 'North', is_deleted: 0, sub_area: [] },
  { id: '62', branch_sub_id: 16, name: 'E2E Area South', description: 'South side', is_deleted: 0, sub_area: [] },
  { id: '63', branch_sub_id: 50, name: 'E2E Area East', description: 'East', is_deleted: 0, sub_area: [] },
];
const BANK = {
  id: '81', user_id: 90005, branch_sub_id: 16, name: 'E2E Bank Juan', address: '1 Sample St',
  phone: '02-000-0000', contact_person: 'Juan', mobile: '09170000000', email: 'bank@example.test',
};
const SUB_AREA = { id: '91', area_id: 62, name: 'E2E Sub Area Uno', is_deleted: 0, area: { id: '62', name: 'E2E Area South' } };

/** Click the row's Edit button and wait for the form to open on it. */
async function editRow(page: Page, path: string, rowText: string): Promise<void> {
  await page.goto(`${APP}${path}`, { timeout: 120_000 });
  await page.getByRole('row').filter({ hasText: rowText }).getByRole('button', { name: 'Edit' }).click();
}

for (const order of ORDERS) {
  test(`Area opens with its saved Branch Sub (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    backend.answers.set('getAreas', () => paginated([AREAS[1]]));
    backend.answers.set('getAllBranch', async () => { await gate.opened; return SUB_BRANCHES; });
    await editRow(page, '/area', 'E2E Area South');

    const select = page.locator('#branch_sub_id');
    if (order.late) {
      await expect(select.locator('option', { hasText: 'Loading branches...' })).toHaveCount(1);
      gate.open();
    }
    await expect(select.locator('option', { hasText: 'MB 1' })).toHaveCount(1);
    await expect(select).toHaveValue('16');
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Area South');
  });

  test(`Bank opens with its saved Branch Sub (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    backend.answers.set('getBanks', () => ({ data: [BANK] }));
    backend.answers.set('getAllBranch', async () => { await gate.opened; return SUB_BRANCHES; });
    await editRow(page, '/banks', 'E2E Bank Juan');

    const select = page.locator('#branch_sub_id');
    if (order.late) {
      await expect(select.locator('option', { hasText: 'Loading branches...' })).toHaveCount(1);
      gate.open();
    }
    await expect(select.locator('option', { hasText: 'MB 1' })).toHaveCount(1);
    await expect(select).toHaveValue('16');
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Bank Juan');
  });

  test(`Sub Area opens with its saved Area (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    backend.answers.set('getSubAreas', () => paginated([SUB_AREA]));
    backend.answers.set('getAreas', async () => { await gate.opened; return paginated(AREAS); });
    await editRow(page, '/sub-area', 'E2E Sub Area Uno');

    const select = page.locator('#area_id');
    if (order.late) {
      await expect(select.locator('option', { hasText: 'Loading areas...' })).toHaveCount(1);
      gate.open();
    }
    await expect(select.locator('option', { hasText: 'E2E Area South' })).toHaveCount(1);
    await expect(select).toHaveValue('62');
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Sub Area Uno');
  });
}

/**
 * A name typed while the form's own dropdown list loads must survive that list's arrival.
 * Create is reached the way it can still hold an old record: Edit a row, Cancel, then Create,
 * because these forms only fill (or clear) themselves when they hold one.
 */
const FORMS = [
  { name: 'Area', path: '/area', row: 'E2E Area South', saved: 'E2E Area South', list: 'getAllBranch' },
  { name: 'Bank', path: '/banks', row: 'E2E Bank Juan', saved: 'E2E Bank Juan', list: 'getAllBranch' },
  { name: 'Sub Area', path: '/sub-area', row: 'E2E Sub Area Uno', saved: 'E2E Sub Area Uno', list: 'getAreas' },
] as const;

for (const form of FORMS) {
  for (const mode of ['Create', 'Edit'] as const) {
    test(`${form.name} ${mode}: a name typed while the list loads survives its arrival`, async ({ page, backend }) => {
      // Re-armed below: each open of the form fetches the list again.
      let gate = new Gate(mode === 'Create');
      backend.answers.set('getAllBranch', async () => { await gate.opened; return SUB_BRANCHES; });
      backend.answers.set('getBanks', () => ({ data: [BANK] }));
      backend.answers.set('getSubAreas', () => paginated([SUB_AREA]));
      backend.answers.set('getAreas', async () => {
        if (form.name === 'Sub Area') await gate.opened;
        return paginated(form.name === 'Sub Area' ? AREAS : [AREAS[1]]);
      });
      await editRow(page, form.path, form.row);
      const name = page.locator('input[name="name"]');
      await expect(name).toHaveValue(form.saved);
      if (mode === 'Create') {
        await page.getByRole('button', { name: 'Cancel' }).click();
        gate = new Gate(false);
        await page.getByRole('button', { name: 'Create', exact: true }).click();
      }

      await name.fill('Typed While Loading');
      const arrived = served(page, form.list);
      gate.open();
      await arrived;
      await expect(name).toHaveValue('Typed While Loading');
    });
  }
}
