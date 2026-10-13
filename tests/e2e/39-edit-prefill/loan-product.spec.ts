/**
 * Loan Product: opening a saved product shows its Loan Code. The form fetches the loan codes
 * itself when it opens. See ./harness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/loan-product.spec.ts --reporter=line --workers=1
 */
import { APP, Gate, ORDERS, expect, paginated, test } from './harness';

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

for (const order of ORDERS) {
  test(`Loan Product opens with its saved Loan Code (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    backend.answers.set('getLoanProductById', () => PRODUCT);
    backend.answers.set('getLoanProducts', () => paginated([]));
    backend.answers.set('getLoanCodes', async () => { await gate.opened; return paginated(LOAN_CODES); });
    backend.answers.set('getLoanClient', () => paginated([]));
    backend.answers.set('getLoanTypes', () => []);
    await page.goto(`${APP}/loan-products/7`, { timeout: 120_000 });

    const select = page.locator('#loan_code_id');
    if (order.late) {
      await expect(select.locator('option', { hasText: 'Loading loan codes...' })).toHaveCount(1);
      gate.open();
    }
    await expect(select.locator('option', { hasText: 'PNP - Police' })).toHaveCount(1);
    await expect(select).toHaveValue('12');
    await expect(page.locator('#base_deduction')).toHaveValue('1');
  });
}
