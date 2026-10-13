/**
 * Branch Setup, Sub Branch: Edit shows the sub-branch's parent Branch. The form's Branch is a
 * react-select (Controller), and the form fetches the branch list itself when it opens.
 * See ./harness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/39-edit-prefill/sub-branch.spec.ts --reporter=line --workers=1
 */
import { APP, Gate, ORDERS, expect, test } from './harness';

test.setTimeout(120_000);

const BRANCHES = [
  { id: '1', name: 'Marikina FA', code: 'FA' },
  { id: '2', name: 'E2E Branch FB', code: 'FB' },
  { id: '3', name: 'E2E Branch FC', code: 'FC' },
].map((b) => ({
  id: b.id, name: b.name, branch_group_id: Number(b.id), user_id: 1, is_deleted: 0,
  user: { name: 'E2E Owner', email: 'e2e.own@example.test' }, branch_group: { id: b.id, name: b.name, code: b.code },
}));

const SUB_BRANCH = {
  id: '16', branch_id: 2, code: 'MB1', name: 'E2E MB 1', address: '1 Sample St', contact_no: '0917', head_name: 'Juan',
  head_contact: '0918', head_email: 'head@example.test', ref_ctr_year: 2026, ref_ctr_day: 1, ref_no_length: 6,
  ref_current_value: 10, user_id: 1, is_deleted: 0, user: { name: 'E2E Owner', email: 'e2e.own@example.test' },
  branch: { name: 'E2E Branch FB' },
};

for (const order of ORDERS) {
  test(`Sub Branch opens with its saved Branch (${order.name})`, async ({ page, backend }) => {
    const gate = new Gate(!order.late);
    // The list's own calls answer at once; the form's, asked once Edit is pressed, wait for the gate.
    let formOpening = false;
    let formCalls = 0;
    backend.answers.set('getBranch', async () => {
      if (formOpening) { formCalls++; await gate.opened; }
      return BRANCHES;
    });
    backend.answers.set('getBranchSub', () => [SUB_BRANCH]);
    await page.goto(`${APP}/branch-setup`, { timeout: 120_000 });
    await page.getByRole('row').filter({ hasText: 'E2E Branch FB' }).getByRole('button', { name: 'View Sub Branch' }).click();
    const edit = page.getByRole('row').filter({ hasText: 'E2E MB 1' }).getByRole('button', { name: 'Edit' });
    await expect(edit).toBeVisible();
    formOpening = true;
    await edit.click();

    const form = page.locator('form:has(input[name="code"])');
    await expect(form.locator('input[name="code"]')).toHaveValue('MB1');
    if (order.late) {
      // The form's own branch list is still held back: no options, so nothing shown yet.
      await expect.poll(() => formCalls).toBeGreaterThan(0);
      await expect(form.locator('.react-select__single-value')).toHaveCount(0);
      gate.open();
    }
    await expect(form.locator('.react-select__single-value')).toHaveText('E2E Branch FB');
  });
}
