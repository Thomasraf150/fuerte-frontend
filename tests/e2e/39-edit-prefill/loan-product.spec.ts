/**
 * Loan Product: opening a saved product shows its Loan Code, whatever its age; the Loan Code
 * list offers every code; and a description typed while the codes load is kept when they come.
 * The form fetches the loan codes itself when it opens. See ./harness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/loan-product.spec.ts --reporter=line --workers=1
 */
import type { Page } from '@playwright/test';
import { APP, Gate, ORDERS, expect, paginated, served, test, type FakeBackend } from './harness';

test.setTimeout(120_000);

const LOAN_CODES = [
  { id: '11', code: 'DEPED', description: 'DepEd teachers' },
  { id: '12', code: 'PNP', description: 'Police' },
  { id: '13', code: 'PRIV', description: 'Private' },
].map((c) => ({ ...c, user_id: 1, is_deleted: 0, loan_client_id: 1, loan_type_id: 1, loan_client: { name: 'X' }, loan_type: { name: 'Y' } }));

const PRODUCT = {
  id: '7', loan_code_id: 12, user_id: 1, description: 'E2E PNP 12 months', terms: 12, interest_rate: '3.00', udi: '30.00',
  processing: '2.00', agent_fee: '1.00', insurance: '0.00', insurance_fee: '0.00', commission: '0.00', collection: '1.00',
  notarial: '0.00', base_deduction: '1', addon_terms: 0, addon_udi_rate: '0.00', is_active: 1, loan_code: { id: '12', code: 'PNP' },
};

/** The page's other fields; getLoanCodes is the caller's. */
function stubPage(backend: FakeBackend): void {
  backend.answers.set('getLoanProductById', () => PRODUCT);
  backend.answers.set('getLoanProducts', () => paginated([]));
  backend.answers.set('getLoanClient', () => paginated([]));
  backend.answers.set('getLoanTypes', () => []);
}

/** The Loan Code field: a searchable react-select named "Loan Code". */
const loanCodeField = (page: Page) =>
  page.locator('.react-select__control').filter({ has: page.getByRole('combobox', { name: 'Loan Code' }) });

for (const order of ORDERS) {
  test(`Loan Product opens with its saved Loan Code (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    stubPage(backend);
    backend.answers.set('getLoanCodes', async () => { await gate.opened; return paginated(LOAN_CODES); });
    await page.goto(`${APP}/loan-products/7`, { timeout: 120_000 });

    const field = loanCodeField(page);
    if (order.late) {
      await expect(field).toContainText('Loading loan codes...');
      gate.open();
    }
    await expect(field.locator('.react-select__single-value')).toHaveText('PNP - Police');
    await expect(page.locator('#base_deduction')).toHaveValue('1');
  });
}

for (const mode of ['Create', 'Edit'] as const) {
  test(`Loan Product ${mode}: a description typed while the loan codes load survives their arrival`, async ({ page, backend }) => {
    const gate = new Gate(false);
    stubPage(backend);
    backend.answers.set('getLoanCodes', async () => { await gate.opened; return paginated(LOAN_CODES); });
    await page.goto(`${APP}/loan-products/${mode === 'Create' ? 'new' : '7'}`, { timeout: 120_000 });
    const description = page.locator('#description');
    await expect(description).toHaveValue(mode === 'Create' ? '' : PRODUCT.description);

    await description.fill('Typed While Loading');
    const arrived = served(page, 'getLoanCodes');
    gate.open();
    await arrived;
    await expect(description).toHaveValue('Typed While Loading');
  });
}

/**
 * The dev database has 582 live loan codes; the dropdown used to hold the newest 20. The stub
 * answers getLoanCodes like the server: newest first, `first` capped at 200 (graphql/loancodes.graphql).
 */
const MANY = Array.from({ length: 450 }, (_, i) => {
  const id = 5000 + i; // the oldest code has the lowest id
  return { ...LOAN_CODES[0], id: String(id), code: `LC${id}`, description: `Code ${id}` };
});
const OLDEST = MANY[0];

function stubManyCodes(backend: FakeBackend): Array<Record<string, unknown>> {
  const asked: Array<Record<string, unknown>> = [];
  backend.answers.set('getLoanCodes', (v) => {
    asked.push(v);
    const first = Math.min(Number(v.first), 200); // the server's own cap
    const page = Number(v.page);
    const newestFirst = [...MANY].sort((a, b) => Number(b.id) - Number(a.id));
    const data = newestFirst.slice((page - 1) * first, page * first);
    const lastPage = Math.max(1, Math.ceil(MANY.length / first));
    return { data, paginatorInfo: { total: MANY.length, currentPage: page, lastPage, hasMorePages: page < lastPage } };
  });
  return asked;
}

async function openOldestProduct(page: Page, backend: FakeBackend): Promise<Array<Record<string, unknown>>> {
  stubPage(backend);
  backend.answers.set('getLoanProductById', () => ({ ...PRODUCT, loan_code_id: Number(OLDEST.id), loan_code: { id: OLDEST.id } }));
  const asked = stubManyCodes(backend);
  await page.goto(`${APP}/loan-products/7`, { timeout: 120_000 });
  return asked;
}

/** Answers the save and hands back the input it was sent. */
function captureSave(backend: FakeBackend): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    backend.answers.set('updateLoanProducts', (v) => {
      resolve(v.input as Record<string, unknown>);
      return { id: PRODUCT.id };
    });
  });
}

test('Loan Product: a product with the oldest loan code opens with it selected', async ({ page, backend }) => {
  const asked = await openOldestProduct(page, backend);
  await expect(loanCodeField(page).locator('.react-select__single-value')).toHaveText(`${OLDEST.code} - ${OLDEST.description}`);
  // Read in pages the server allows, not one oversized request it would refuse.
  expect(asked.every((v) => Number(v.first) <= 200)).toBe(true);
  expect(Array.from(new Set(asked.map((v) => Number(v.page)))).sort()).toEqual([1, 2, 3]);
});

test('Loan Product: the Loan Code list offers every loan code', async ({ page, backend }) => {
  await openOldestProduct(page, backend);
  const field = loanCodeField(page);
  await expect(field.locator('.react-select__single-value')).toHaveText(`${OLDEST.code} - ${OLDEST.description}`);
  await field.click();
  await expect(page.locator('.react-select__option')).toHaveCount(MANY.length);
});

test('Loan Product: saving unchanged keeps the saved loan code', async ({ page, backend }) => {
  await openOldestProduct(page, backend);
  await expect(loanCodeField(page).locator('.react-select__single-value')).toHaveText(`${OLDEST.code} - ${OLDEST.description}`);
  const saved = captureSave(backend);
  await page.getByRole('button', { name: 'Save' }).click();
  expect(Number((await saved).loan_code_id)).toBe(Number(OLDEST.id));
});

test('Loan Product: a code picked by search, from past the first 200, is the one saved', async ({ page, backend }) => {
  await openOldestProduct(page, backend);
  const combobox = page.getByRole('combobox', { name: 'Loan Code' });
  await expect(loanCodeField(page).locator('.react-select__single-value')).toHaveText(`${OLDEST.code} - ${OLDEST.description}`);
  await combobox.fill('LC5123');
  await expect(page.locator('.react-select__option')).toHaveText(['LC5123 - Code 5123']);
  await combobox.press('Enter');
  await expect(loanCodeField(page).locator('.react-select__single-value')).toHaveText('LC5123 - Code 5123');

  const saved = captureSave(backend);
  await page.getByRole('button', { name: 'Save' }).click();
  expect(Number((await saved).loan_code_id)).toBe(5123);
});

test('Loan Product: the Loan Code label focuses the select, and a missing code is announced as its error', async ({ page, backend }) => {
  stubPage(backend);
  backend.answers.set('getLoanCodes', () => paginated(LOAN_CODES));
  await page.goto(`${APP}/loan-products/new`, { timeout: 120_000 });
  const input = page.locator('#loan_code_id');
  await expect(loanCodeField(page)).toContainText('Select a Loan Code');

  await page.locator('label[for="loan_code_id"]').click();
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAttribute('aria-errormessage', 'loan_code_id-error');
  await expect(page.locator('#loan_code_id-error')).toHaveText('Loan Code is required');
});
