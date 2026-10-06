/**
 * An application's page in the states added on 2026-10-05
 * (docs/superpowers/specs/2026-10-05-applications-pings-decisions-design.md, Parts 1, 4 and 5), stubbed.
 *
 *   1. Marketing (the Collection role, COL) sees every branch's applications but changes only its own
 *      branches' (the server's can_edit). On another branch's application the page is view only: a quiet
 *      "View only: <branch> handles this application." over the application summary and the Google Form
 *      answers; no form; the status shown and fixed, with no Save status; no Create as borrower; Print
 *      works; the repeat-applicant check still shows. Nothing only the form or Create as borrower needs is
 *      asked for. With no branch yet, the note says so.
 *   2. Marketing on its own branch's application works it as before: the form, the status, Create as
 *      borrower.
 *   3. A converted application shows the borrower's latest decision under "Borrower created", as the
 *      borrower page does: Rejected is loud (filled red, a white x) with its date and reason, "Rejected
 *      Oct 5, 2026 · Kulang ang income"; Approved is quiet (a neutral outline, a green check), with a
 *      reason only when there is one; before the first decision nothing is said. The day is Manila's,
 *      whatever the browser's zone (here Los Angeles, where 00:30 in Manila is still the day before).
 *
 * At 360px both states are measured with the others in application-page.spec.ts section 13, and the
 * Call Center wording of the repeat-applicant card with the card itself, in its section 16.
 *
 * NO CREDENTIALS AND NO BACKEND: see applicationPageHarness.ts. The people are fictional.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/27-application-page/application-states.spec.ts --reporter=list
 */
import type { Locator, Page } from '@playwright/test';
import type { BorrowerDecision, LoanApplicationRecord } from '../../../src/utils/DataTypes';
import {
  BACKEND,
  type FakeBackend,
  type RoleCode,
  application,
  borrowerMatch,
  expect,
  field,
  googleFormApplication,
  openApplication,
  saveButton,
  signedInAs,
  statusSelect,
  test,
  toolbar,
} from './applicationPageHarness';

test.setTimeout(180_000);

const REPEAT_TITLE = 'This applicant may already be a borrower';

async function open(page: Page, backend: FakeBackend, record: LoanApplicationRecord, role: RoleCode, branches: number[] = [], home: number | null = null): Promise<void> {
  backend.record = record;
  await signedInAs(page, backend, role, branches, home);
  await openApplication(page, '2');
}

const viewOnlyNote = (page: Page): Locator => page.getByText(/^View only: /);
const summary = (page: Page): Locator => page.getByRole('region', { name: 'Application summary' });

// ---------------------------------------------------------------------------
// 1. Marketing, another branch's application
// ---------------------------------------------------------------------------

test.describe('1. Marketing on another branch\'s application: view only', () => {
  /** Sub-branch B's application, which the server says Marketing (on Sub-branch A) may not change. */
  const elsewhere = (overrides: Partial<LoanApplicationRecord> = {}): LoanApplicationRecord =>
    googleFormApplication({ can_edit: false, branch_sub_id: 9102, branch_sub: { id: '9102', name: 'E2E Sub-branch B' }, ...overrides });

  test('a quiet note over the summary and the answers: no form, the status fixed, no Create as borrower, and Print works', async ({ page, backend }) => {
    await open(page, backend, elsewhere(), 'COL', [9101], 9101);

    const note = viewOnlyNote(page);
    await expect(note).toHaveText('View only: E2E Sub-branch B handles this application.');
    // Quiet: a note, never an alert.
    await expect(note.locator('xpath=ancestor-or-self::*[@role="alert" or @role="status"]')).toHaveCount(0);
    await expect(summary(page).locator('dt')).toHaveText(['Name', 'Mobile', 'Branch', 'Amount', 'Purpose']);
    await expect(summary(page).locator('dd')).toHaveText(['E2E Applicant Two', '09170000002', 'E2E Sub-branch B', '₱15,000.00', 'Store capital']);
    await expect(page.getByRole('complementary', { name: 'Google Form intake' })).toContainText('Amount is above the usual limit');
    // The note comes before the summary, as "Borrower created" does on a converted application.
    const noteBox = (await note.boundingBox())!;
    expect(noteBox.y).toBeLessThan((await summary(page).boundingBox())!.y);

    // No form, nothing to save.
    await expect(field(page, 'firstname')).toHaveCount(0);
    await expect(saveButton(page)).toHaveCount(0);
    // The status is shown and fixed: no Save status.
    await expect(statusSelect(page)).toBeDisabled();
    await expect(statusSelect(page)).toHaveValue('for_interview');
    await expect(toolbar(page).getByRole('button', { name: /^Save/ })).toHaveCount(0);
    // No Create as borrower, and no reason for one.
    await expect(toolbar(page).getByText('Create as borrower')).toHaveCount(0);
    await expect(toolbar(page).getByText(/first\.?$/)).toHaveCount(0);

    // Print works.
    const [popup] = await Promise.all([page.waitForEvent('popup'), toolbar(page).getByRole('button', { name: 'Print Application' }).click()]);
    await expect(popup).toHaveURL(`${BACKEND}/storage/pdf/application-2.pdf`, { timeout: 30_000 });
    expect(backend.calls('printLoanApplication')[0].variables).toEqual({ application_id: 2 });

    // Nothing only the form (its picklists) or Create as borrower (the user's branches) uses is asked for.
    expect(backend.calls('getApplicationBranches')).toHaveLength(0);
    expect(backend.calls('getChief')).toHaveLength(0);
    expect(backend.calls('getMyAccessibleBranchSubs')).toHaveLength(0);
  });

  test('the repeat-applicant check still shows: Marketing may see it on any application it can open', async ({ page, backend }) => {
    backend.match = borrowerMatch({ existsElsewhere: true, branches: ['E2E Sub-branch C'], isProblem: true, worstCutoffsMissed: 2 });
    await open(page, backend, elsewhere(), 'COL', [9101], 9101);

    const card = page.getByRole('region', { name: REPEAT_TITLE, exact: true });
    await expect(card).toBeVisible();
    // Branch staff's own words: Marketing is branch staff, who can check the record.
    await expect(card).toContainText('Check their record before you continue.');
    await expect(card).toContainText('Worst: 2 cut-offs missed');
    await expect(viewOnlyNote(page)).toBeVisible();
  });

  test('with no branch yet the note says so', async ({ page, backend }) => {
    await open(page, backend, elsewhere({ branch_sub_id: null, branch_sub: null }), 'COL', [9101], 9101);

    await expect(viewOnlyNote(page)).toHaveText('View only: this application has no branch yet.');
    await expect(field(page, 'firstname')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Marketing, its own branch's application
// ---------------------------------------------------------------------------

test('2. Marketing on its own branch\'s application works it: the form, the status and Create as borrower', async ({ page, backend }) => {
  await open(page, backend, application({ status: 'interviewed' }), 'COL', [9101], 9101);

  await expect(field(page, 'firstname')).toHaveValue('E2E');
  await expect(viewOnlyNote(page)).toHaveCount(0);
  await expect(statusSelect(page)).toBeEnabled();
  await expect(toolbar(page).getByRole('link', { name: 'Create as borrower' })).toHaveAttribute('href', '/borrowers/new?application=2');
});

// ---------------------------------------------------------------------------
// 3. A converted application: the borrower's decision
// ---------------------------------------------------------------------------

test.describe('3. A converted application shows the borrower\'s latest decision', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });

  const converted = (decision: BorrowerDecision | null): LoanApplicationRecord =>
    googleFormApplication({ status: 'borrower_created', borrower_id: 77, can_edit: false, borrower_decision: decision });
  const card = (page: Page): Locator => page.getByRole('region', { name: 'Borrower created', exact: true });
  const styleOf = (locator: Locator) =>
    locator.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color, border: style.borderTopColor, borderWidth: style.borderTopWidth };
    });

  test('Rejected is loud, with its date and the reason', async ({ page, backend }) => {
    // 00:30 in Manila is still Oct 4 in Los Angeles: the day shown is Manila's.
    await open(page, backend, converted({ status: 'rejected', reason: 'Kulang ang income', decided_at: '2026-10-05 00:30:00' }), 'CALLCTR');

    await expect(card(page)).toContainText('Rejected Oct 5, 2026 · Kulang ang income');
    const pill = card(page).locator('[data-decision="rejected"]');
    await expect(pill).toHaveText('Rejected');
    // Filled red with white words and a white x: the word says it too, never the colour alone.
    expect(await styleOf(pill)).toMatchObject({ background: 'rgb(181, 55, 47)', color: 'rgb(255, 255, 255)' });
    await expect(pill.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    // It sits under "Borrower created" and its sentence.
    const sentence = card(page).getByText('This application is now a borrower and can no longer be edited.');
    expect((await pill.boundingBox())!.y).toBeGreaterThan((await sentence.boundingBox())!.y);
  });

  test('Approved is quiet: an outline and a green check, and its reason only when there is one', async ({ page, backend }) => {
    await open(page, backend, converted({ status: 'approved', reason: null, decided_at: '2026-10-05 14:45:00' }), 'OWN');

    await expect(card(page)).toContainText('Approved Oct 5, 2026');
    await expect(card(page)).not.toContainText('·');
    const pill = card(page).locator('[data-decision="approved"]');
    await expect(pill).toHaveText('Approved');
    // A neutral outline (stroke) on white, ink words, and a green check.
    expect(await styleOf(pill)).toMatchObject({ background: 'rgb(255, 255, 255)', color: 'rgb(40, 38, 26)', border: 'rgb(228, 222, 208)', borderWidth: '1px' });
    expect(await styleOf(pill.locator('svg'))).toMatchObject({ color: 'rgb(43, 115, 68)' });
    // The Owner still has the link to the borrower beside it.
    await expect(card(page).getByRole('link', { name: 'Open the borrower' })).toHaveAttribute('href', '/borrowers/77');

    backend.record = converted({ status: 'approved', reason: 'Kumpleto ang requirements', decided_at: '2026-10-03 09:00:00' });
    await page.reload();
    await expect(card(page)).toContainText('Approved Oct 3, 2026 · Kumpleto ang requirements', { timeout: 90_000 });
  });

  test('before the first decision nothing is said about one', async ({ page, backend }) => {
    await open(page, backend, converted(null), 'CALLCTR');

    await expect(card(page)).toContainText('This application is now a borrower and can no longer be edited.');
    await expect(page.locator('[data-decision]')).toHaveCount(0);
    await expect(card(page)).not.toContainText(/Approved|Rejected/);
  });
});
