/**
 * Applicant funnel (spec docs/superpowers/specs/2026-10-05-applicant-funnel-design.md, part 1),
 * the borrower page's Loans tab: a borrower whose latest decision is Rejected cannot be given a
 * loan. The server refuses it; the tab says so where a new loan or a renewal would start
 * ("Rejected on {date}: {reason}. Approve this borrower to give a loan.") and its Add Loans and
 * Renew buttons are off. An approved borrower, or one with no decision, sees neither.
 *
 * NO CREDENTIALS AND NO BACKEND: see ../26-new-application/borrowerFormHarness.ts. Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/30-applicant-funnel --reporter=list
 */
import type { Page } from '@playwright/test';
import type { BorrowerDecision } from '../../../src/utils/DataTypes';
import { expect, sidewaysScroll, signedInAs, test, type FakeBackend } from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

const BORROWER_ID = 8811;
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** getBorrower's answer: a fictional borrower on the user's own sub-branch, with the decision given. */
const borrower = (decision: BorrowerDecision | null) => ({
  id: String(BORROWER_ID),
  payer_standing: 'NONE',
  decision,
  user_id: 90001,
  chief_id: 9201,
  amount_applied: '15000',
  purpose: 'Store capital',
  firstname: 'ROSARIO',
  middlename: 'LIM',
  lastname: 'BAUTISTA',
  terms_of_payment: '12 months',
  residence_address: '7 SAMPLE ST., BRGY. SAMPLE, SAMPLE CITY',
  is_rent: false,
  other_source_of_inc: '',
  est_monthly_fam_inc: '20000',
  employment_position: 'Teacher I',
  gender: 'Female',
  photo: null,
  is_deleted: 0,
  chief: { id: '9201', name: 'E2E Chief One' },
  borrower_details: {
    id: '1', dob: '1988-03-02', place_of_birth: 'Sample City', age: 38,
    email: 'e2e.rosario@example.test', contact_no: '09170000031', civil_status: 'Single',
  },
  borrower_spouse_details: {
    work_address: '', occupation: '', fullname: '', company: '', dept_branch: '',
    length_of_service: '', salary: '', company_contact_person: '', contact_no: '',
  },
  borrower_work_background: {
    id: '1', company_borrower_id: 9301, employment_number: 'E2E-0031', area_id: 9401, sub_area_id: 9501,
    station: 'Sample School', term_in_service: '5 years', employment_status: 'Permanent', division: 'Sample Division',
    monthly_gross: '26000', monthly_net: '20000', office_address: '12 Sample Avenue',
    area: { id: '9401', name: 'E2E Area With Sub-areas', branch_sub_id: 9101, branch_sub: { id: '9101', branch_id: 91, name: 'E2E Sub-branch A' } },
  },
  borrower_company_info: { id: '1', employer: 'E2E Employer', salary: '26000', contract_duration: 'Permanent' },
  borrower_reference: [
    { id: '1', occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000041' },
    { id: '2', occupation: 'Co-worker', name: 'E2E Reference Two', contact_no: '09170000042' },
  ],
  user: { id: 90001, name: 'E2E Admin', branchSub: { id: '9101', name: 'E2E Sub-branch A', branch_id: 91 } },
  branch_sub: { name: 'E2E Sub-branch A', branch: { name: 'E2E Branch FB' } },
});

const REJECTED: BorrowerDecision = { status: 'rejected', reason: 'E2E: may utang sa ibang lending.', decided_at: '2026-10-05 14:30:00' };

async function openLoansTab(page: Page, backend: FakeBackend, decision: BorrowerDecision | null): Promise<void> {
  backend.extraGraphql.set('getBorrower', () => ({ data: { getBorrower: borrower(decision) } }));
  backend.extraGraphql.set('getLoans', () => ({ data: { getLoans: { data: [] } } }));
  backend.extraGraphql.set('getBranchSub', () => ({ data: { getBranchSub: [] } }));
  // The loan form's product picker loads with the tab.
  backend.extraGraphql.set('getLoanProducts', () => ({ data: { getLoanProducts: { data: [] } } }));
  for (const pattern of ['http://localhost:8080/storage/**', 'http://localhost:3000/storage/**']) {
    await page.route(pattern, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG }));
  }
  await signedInAs(page, backend, [9101]);
  await page.goto(`/borrowers/${BORROWER_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.locator('input[name="firstname"]')).toHaveValue('ROSARIO', { timeout: 120_000 });
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0);
  await page.getByRole('button', { name: 'Loans', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add Loans' })).toBeVisible({ timeout: 60_000 });
}

test('a rejected borrower: the note says when, why and what lifts it, and Add Loans and Renew are off', async ({ page, backend }) => {
  await openLoansTab(page, backend, REJECTED);

  const note = page.getByTestId('rejected-loan-note');
  await expect(note).toHaveText('Rejected on Oct 5, 2026: E2E: may utang sa ibang lending. Approve this borrower to give a loan.');
  await expect(note).toHaveAttribute('role', 'note');
  const add = page.getByRole('button', { name: 'Add Loans' });
  await expect(add).toBeDisabled();
  await expect(add).toHaveAccessibleDescription(/Approve this borrower to give a loan/);
  await expect(page.getByRole('button', { name: 'Renew Selected Loan' })).toBeDisabled();
  // The note comes before the buttons, where a new loan would start.
  const noteBox = (await note.boundingBox())!;
  expect((await add.boundingBox())!.y).toBeGreaterThan(noteBox.y);
});

test('a rejected borrower with no reason: the note leaves the colon out', async ({ page, backend }) => {
  await openLoansTab(page, backend, { ...REJECTED, reason: null });
  await expect(page.getByTestId('rejected-loan-note')).toHaveText('Rejected on Oct 5, 2026. Approve this borrower to give a loan.');
});

test('an approved borrower can be given a loan: no note, Add Loans on', async ({ page, backend }) => {
  await openLoansTab(page, backend, { status: 'approved', reason: null, decided_at: '2026-10-05 14:30:00' });
  await expect(page.getByTestId('rejected-loan-note')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add Loans' })).toBeEnabled();
});

test('a borrower with no decision yet can be given a loan: approving first is not required', async ({ page, backend }) => {
  await openLoansTab(page, backend, null);
  await expect(page.getByTestId('rejected-loan-note')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add Loans' })).toBeEnabled();
});

test('360px: the note wraps and nothing scrolls sideways', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await openLoansTab(page, backend, { ...REJECTED, reason: 'E2E-isang-napakahabang-dahilan-na-walang-puwang-'.repeat(3) });
  await expect(page.getByTestId('rejected-loan-note')).toBeVisible();
  expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
});

test('a Reject or Approve in the header reaches the Loans tab at once, without reloading the borrower', async ({ page, backend }) => {
  backend.extraGraphql.set('setBorrowerDecision', (variables) => ({
    data: {
      setBorrowerDecision: {
        status: variables.status,
        reason: (variables.reason as string | null) ?? null,
        decided_at: '2026-10-06 09:15:00',
      },
    },
  }));
  await openLoansTab(page, backend, null);
  const reads = backend.calls('getBorrower').length;
  const header = page.locator('main header');
  const note = page.getByTestId('rejected-loan-note');
  const add = page.getByRole('button', { name: 'Add Loans' });
  await expect(note).toHaveCount(0);

  await header.getByRole('button', { name: 'Reject' }).click();
  const reject = page.getByRole('dialog', { name: 'Reject this borrower?' });
  await reject.getByRole('textbox', { name: 'Why?' }).fill('E2E: peke ang payslip');
  await reject.getByRole('button', { name: 'Reject', exact: true }).click();

  await expect(note).toHaveText('Rejected on Oct 6, 2026: E2E: peke ang payslip. Approve this borrower to give a loan.');
  await expect(add).toBeDisabled();

  await header.getByRole('button', { name: 'Approve' }).click();
  const approve = page.getByRole('dialog', { name: 'Approve this borrower?' });
  await approve.getByRole('button', { name: 'Approve', exact: true }).click();

  await expect(note).toHaveCount(0);
  await expect(add).toBeEnabled();
  expect(backend.calls('getBorrower'), 'the borrower was read again').toHaveLength(reads);
});
