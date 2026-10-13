/**
 * Vendors: opening a saved Employee shows its Department, a saved Supplier and a saved Customer
 * their Category; and a name typed while those lists load is still there when they arrive.
 * See ./harness.ts for the bug class and the stub backend.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/vendors.spec.ts --reporter=line --workers=1
 */
import type { Page } from '@playwright/test';
import { APP, Gate, ORDERS, expect, served, test, type FakeBackend } from './harness';

test.setTimeout(120_000);

const TYPES = [
  { id: '1', name: 'Supplier', code: 'SUP' },
  { id: '4', name: 'Employee', code: 'EMP' },
  { id: '2', name: 'Customer', code: 'CUS' },
];
const [SUPPLIER, EMPLOYEE, CUSTOMER] = TYPES;
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

/** Every dropdown list is held by the gate; the vendor types and the list itself are not. */
function stub(backend: FakeBackend, gate: Gate, row: ReturnType<typeof vendor>) {
  backend.answers.set('getVendorType', () => TYPES);
  backend.answers.set('getVendors', () => [row]);
  backend.answers.set('getDepartment', async () => { await gate.opened; return DEPARTMENTS; });
  backend.answers.set('getSupplierCategory', async () => { await gate.opened; return CATEGORIES; });
  backend.answers.set('getCustomerCategory', async () => { await gate.opened; return CATEGORIES; });
}

async function pickType(page: Page, typeName: string): Promise<void> {
  await page.goto(`${APP}/accounting/vendors`, { timeout: 120_000 });
  await page.locator('.react-select__control').first().click();
  await page.locator('.react-select__option', { hasText: typeName }).click();
}

async function openVendor(page: Page, typeName: string): Promise<void> {
  await pickType(page, typeName);
  await page.getByRole('row').filter({ hasText: 'E2E Vendor Juan' }).getByText('E2E Vendor Juan').click();
}

for (const order of ORDERS) {
  test(`Employee opens with its saved Department (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    stub(backend, gate, vendor(EMPLOYEE, { department_id: 32, department: { id: '32', name: 'Collections' } }));
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
    stub(backend, gate, vendor(SUPPLIER, { supplier_category_id: 42, supplier_category: { id: '42', name: 'Utilities' } }));
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

  test(`Customer opens with its saved Category (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    stub(backend, gate, vendor(CUSTOMER, { customer_category_id: 42, customer_category: { id: '42', name: 'Utilities' } }));
    await openVendor(page, 'Customer');

    // The Customer form shows no "Loading..." option, so "late" is: the form is filled, then the list comes.
    await expect(page.locator('#tin')).toHaveValue('000-111-222');
    gate.open();
    const select = page.locator('#customer_category_id');
    await expect(select.locator('option', { hasText: 'Utilities' })).toHaveCount(1);
    await expect(select).toHaveValue('42');
  });
}

/** Each vendor form with a list-backed dropdown, the list it waits for, and its saved choice. */
const FORMS = [
  { type: EMPLOYEE, list: 'getDepartment', row: { department_id: 32 } },
  { type: SUPPLIER, list: 'getSupplierCategory', row: { supplier_category_id: 42 } },
  { type: CUSTOMER, list: 'getCustomerCategory', row: { customer_category_id: 42 } },
] as const;

for (const form of FORMS) {
  for (const mode of ['Create', 'Edit'] as const) {
    test(`${form.type.name} ${mode}: a name typed while the list loads survives its arrival`, async ({ page, backend }) => {
      const gate = new Gate(false);
      stub(backend, gate, vendor(form.type, form.row));
      if (mode === 'Create') {
        await pickType(page, form.type.name);
        await page.getByRole('button', { name: 'Create' }).click();
      } else {
        await openVendor(page, form.type.name);
        await expect(page.locator('#name')).toHaveValue('E2E Vendor Juan');
      }

      await page.locator('#name').fill('Typed While Loading');
      const arrived = served(page, form.list);
      gate.open();
      await arrived;
      await expect(page.locator('#name')).toHaveValue('Typed While Loading');
    });
  }
}
