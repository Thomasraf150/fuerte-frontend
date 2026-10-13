/**
 * Vendors: opening a saved Employee shows its Department, and a saved Supplier its Category.
 * See ./harness.ts for the bug class and the stub backend.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/vendors.spec.ts --reporter=line --workers=1
 */
import type { Page } from '@playwright/test';
import { APP, Gate, ORDERS, expect, test, type FakeBackend } from './harness';

test.setTimeout(120_000);

const TYPES = [{ id: '1', name: 'Supplier', code: 'SUP' }, { id: '4', name: 'Employee', code: 'EMP' }];
const DEPARTMENTS = [{ id: '31', name: 'Accounting' }, { id: '32', name: 'Collections' }, { id: '33', name: 'Operations' }];
const CATEGORIES = [{ id: '41', name: 'Office Supplies' }, { id: '42', name: 'Utilities' }, { id: '43', name: 'Rent' }];

/** A vendor row as getVendors answers it; the saved dropdown value is never the first option. */
const vendor = (type: (typeof TYPES)[number], fields: Record<string, unknown>) => ({
  id: '701', vendor_type_id: type.id, customer_category_id: null, supplier_category_id: null, department_id: null,
  name: 'E2E Vendor Juan', employee_no: 'E-0701', contact_no: '', employee_position: 'Clerk', tin: '000-111-222',
  address: 'Sample City', tax_excempty_date: '', remarks: '', bill_address: '', office_no: '', credit_limit: '',
  is_allow_excess_limit: false, department: null, vendor_type: type, customer_category: null, supplier_category: null,
  ...fields,
});

function stub(backend: FakeBackend, gate: Gate, row: ReturnType<typeof vendor>) {
  backend.answers.set('getVendorType', () => TYPES);
  backend.answers.set('getVendors', () => [row]);
  backend.answers.set('getDepartment', async () => { await gate.opened; return DEPARTMENTS; });
  backend.answers.set('getSupplierCategory', async () => { await gate.opened; return CATEGORIES; });
  backend.answers.set('getCustomerCategory', () => []);
}

async function openVendor(page: Page, typeName: string): Promise<void> {
  await page.goto(`${APP}/accounting/vendors`, { timeout: 120_000 });
  await page.locator('.react-select__control').first().click();
  await page.locator('.react-select__option', { hasText: typeName }).click();
  await page.getByRole('row').filter({ hasText: 'E2E Vendor Juan' }).getByText('E2E Vendor Juan').click();
}

for (const order of ORDERS) {
  test(`Employee opens with its saved Department (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    stub(backend, gate, vendor(TYPES[1], { department_id: 32, department: { id: '32', name: 'Collections' } }));
    await openVendor(page, 'Employee');

    const select = page.locator('#department_id');
    if (order.late) {
      await expect(select.locator('option', { hasText: 'Loading departments...' })).toHaveCount(1);
      gate.open();
    }
    await expect(select.locator('option', { hasText: 'Collections' })).toHaveCount(1);
    await expect(select).toHaveValue('32');
    await expect(page.locator('#employee_no')).toHaveValue('E-0701');
  });

  test(`Supplier opens with its saved Category (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    stub(backend, gate, vendor(TYPES[0], { supplier_category_id: 42, supplier_category: { id: '42', name: 'Utilities' } }));
    await openVendor(page, 'Supplier');

    const select = page.locator('#supplier_category_id');
    if (order.late) {
      await expect(select.locator('option', { hasText: 'Loading categories...' })).toHaveCount(1);
      gate.open();
    }
    await expect(select.locator('option', { hasText: 'Utilities' })).toHaveCount(1);
    await expect(select).toHaveValue('42');
    await expect(page.locator('#tin')).toHaveValue('000-111-222');
  });
}
