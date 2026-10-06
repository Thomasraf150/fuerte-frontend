/**
 * Applicant funnel (spec docs/superpowers/specs/2026-10-05-applicant-funnel-design.md), the
 * application page:
 *
 *   1. Declined asks why. Saving the status Declined opens "Decline this application?"; with no
 *      reason it says "Write why the application is declined." and posts nothing; Cancel posts
 *      nothing and puts the select back on the saved status; with a reason, the reason goes with
 *      the post. Other statuses send no reason.
 *   2. The Notes panel: the decline and the borrower's latest decision, newest first, as
 *      "{Action} by {role} · {date}" and the reason (none when there is none); not drawn when
 *      there are no notes; before the form in the page's order on a phone.
 *   3. The header's outcome pill, once the application is a borrower.
 *
 * NO CREDENTIALS AND NO BACKEND: the fake backend of ../27-application-page/applicationPageHarness.ts
 * plays the server (its setStatus refuses a decline with no reason, as the server does). Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/30-applicant-funnel --reporter=list
 */
import type { Locator, Page } from '@playwright/test';
import type { ApplicationNote, LoanApplicationRecord } from '../../../src/utils/DataTypes';
import {
  DECLINE_REASON,
  answerDeclinePrompt,
  application,
  declinePrompt,
  expect,
  openApplication,
  signedInAs,
  sidewaysScroll,
  statusSelect,
  test,
  toolbar,
  type FakeBackend,
  type RoleCode,
} from '../27-application-page/applicationPageHarness';

test.setTimeout(180_000);

const saveStatusButton = (page: Page): Locator => toolbar(page).getByRole('button', { name: /^(Save status|Saving…|Saved)$/ });
const notesPanel = (page: Page): Locator => page.getByRole('region', { name: 'Notes' });
const posted = (backend: FakeBackend) => backend.calls('setLoanApplicationStatus').map((call) => call.variables);

async function open(page: Page, backend: FakeBackend, record: LoanApplicationRecord = application(), role: RoleCode = 'CALLCTR') {
  backend.record = record;
  await signedInAs(page, backend, role);
  await openApplication(page, String(record.id));
}

test.describe('1. Declined asks why', () => {
  test('no reason: the prompt says so and posts nothing; Cancel posts nothing and the select goes back', async ({ page, backend }) => {
    await open(page, backend);
    await statusSelect(page).selectOption('declined');
    await saveStatusButton(page).click();

    const prompt = declinePrompt(page);
    await expect(prompt).toBeVisible();
    await expect(prompt.getByRole('textbox')).toHaveAttribute('maxlength', '500');
    await expect(prompt.getByRole('textbox')).toHaveAccessibleName('Why?');
    // Spaces are no reason.
    await prompt.getByRole('textbox').fill('   ');
    await prompt.getByRole('button', { name: 'Decline', exact: true }).click();
    await expect(prompt.getByText('Write why the application is declined.')).toBeVisible();
    await expect(prompt).toBeVisible();
    expect(posted(backend), 'a decline with no reason was posted').toEqual([]);

    await prompt.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(prompt).toHaveCount(0);
    await expect(statusSelect(page)).toHaveValue('for_interview');
    await expect(saveStatusButton(page)).toHaveAttribute('aria-disabled', 'true');
    await page.waitForTimeout(500);
    expect(posted(backend), 'Cancel posted the status').toEqual([]);
    await expect(notesPanel(page)).toHaveCount(0);
  });

  test('with a reason: it is posted with Declined, and the Notes panel shows it by role at once', async ({ page, backend }) => {
    await open(page, backend);
    await expect(notesPanel(page), 'no notes, no panel').toHaveCount(0);
    await statusSelect(page).selectOption('declined');
    await saveStatusButton(page).click();
    await answerDeclinePrompt(page);

    await expect(saveStatusButton(page)).toHaveText('Saved');
    expect(posted(backend)).toEqual([{ id: 2, status: 'declined', reason: DECLINE_REASON }]);
    const note = notesPanel(page).getByRole('listitem');
    await expect(note).toHaveCount(1);
    await expect(note).toHaveAttribute('data-note', 'declined');
    await expect(note).toContainText('Declined by Call Center · Oct 5, 2026');
    await expect(note).toContainText(DECLINE_REASON);
  });

  test('other statuses send no reason, and leaving Declined clears its note', async ({ page, backend }) => {
    await open(page, backend);
    await statusSelect(page).selectOption('declined');
    await saveStatusButton(page).click();
    await answerDeclinePrompt(page);
    await expect(notesPanel(page)).toBeVisible();

    await statusSelect(page).selectOption('interviewed');
    await saveStatusButton(page).click();

    await expect(saveStatusButton(page)).toHaveText('Saved');
    await expect(declinePrompt(page)).toHaveCount(0);
    expect(posted(backend).at(-1)).toEqual({ id: 2, status: 'interviewed' });
    await expect(notesPanel(page)).toHaveCount(0);
  });
});

const NOTES: ApplicationNote[] = [
  { kind: 'declined', role_label: 'Call Center', at: '2026-10-01 09:00:00', reason: 'E2E: hindi sumasagot sa tawag' },
  { kind: 'borrower_rejected', role_label: 'Marketing', at: '2026-10-04 16:30:00', reason: 'E2E: kulang ang income' },
  { kind: 'borrower_approved', role_label: 'Processing', at: '2026-10-02 10:00:00', reason: null },
];

/** A borrower made from the application, rejected by Marketing: the outcome the server would send. */
const rejectedBorrower = (notes: ApplicationNote[] = NOTES): LoanApplicationRecord =>
  application({
    status: 'borrower_created',
    borrower_id: 8801,
    can_edit: false,
    outcome: 'rejected',
    outcome_label: 'Rejected by Marketing',
    borrower_decision: { status: 'rejected', reason: 'E2E: kulang ang income', decided_at: '2026-10-04 16:30:00' },
    notes,
  });

test.describe('2. Notes panel and the header outcome', () => {
  test('the three kinds, newest first, each by role and date, the reason only when there is one', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, backend, rejectedBorrower(), 'ADM');

    const items = notesPanel(page).getByRole('listitem');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toHaveAttribute('data-note', 'borrower_rejected');
    await expect(items.nth(0)).toContainText('Borrower rejected by Marketing · Oct 4, 2026');
    await expect(items.nth(0)).toContainText('E2E: kulang ang income');
    await expect(items.nth(1)).toHaveAttribute('data-note', 'borrower_approved');
    await expect(items.nth(1)).toHaveText('Borrower approved by Processing · Oct 2, 2026');
    await expect(items.nth(2)).toHaveAttribute('data-note', 'declined');
    await expect(items.nth(2)).toContainText('Declined by Call Center · Oct 1, 2026');
    await expect(items.nth(2)).toContainText('E2E: hindi sumasagot sa tawag');
    // Roles only: no person's name anywhere in the panel.
    await expect(notesPanel(page)).not.toContainText('E2E Admin');
  });

  test('a borrower shows where it ended up in the header, beside the status', async ({ page, backend }) => {
    await open(page, backend, rejectedBorrower(), 'ADM');
    const outcome = page.getByTestId('application-outcome');
    await expect(outcome.locator('[data-outcome="rejected"]')).toHaveText('Rejected by Marketing');
    await expect(outcome).toContainText('Outcome:');
  });

  test('an application that is not a borrower has no outcome pill in its header: its status says it', async ({ page, backend }) => {
    await open(page, backend, application({ status: 'interviewed', outcome: 'interviewed', outcome_label: 'Interviewed' }), 'ADM');
    await expect(page.getByTestId('application-outcome')).toHaveCount(0);
  });

  test('360px: the notes come before the form in the page order, and nothing scrolls sideways', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const declined = application({
      status: 'declined', outcome: 'declined', outcome_label: 'Declined',
      decline_reason: 'E2E: isang napakahabang dahilan na walang puwang'.repeat(4),
      notes: [{ kind: 'declined', role_label: 'Call Center', at: '2026-10-05 15:20:00', reason: 'E2E-isang-napakahabang-salita-na-walang-puwang-'.repeat(4) }],
    });
    await open(page, backend, declined, 'ADM');
    await expect(notesPanel(page)).toBeVisible();

    const notesFirst = await page.evaluate(() => {
      const notes = Array.from(document.querySelectorAll('section')).find((s) => s.querySelector('h3')?.textContent === 'Notes');
      const form = document.querySelector('main form');
      return Boolean(notes && form && notes.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(notesFirst, 'the notes come after the form on a phone').toBe(true);
    expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
  });
});
