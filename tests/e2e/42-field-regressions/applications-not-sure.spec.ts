/**
 * The Applications list for EDC (Call Center), 2026-10-14. Unplaced applications stay shared by every
 * EDC account (Rafael's choice), but an applicant who answered the form's "Hindi ko po sure" reads as
 * "Not sure yet" -- the applicant does not know the branch yet -- instead of the cut-off Taglish answer,
 * still muted and slanted so it never reads as an assignment, with the form's words in its tooltip. A
 * place the applicant did name (Paralayunan) keeps its answer. And the Sheet's October rows, read
 * month first since the fix, show October with their time.
 *
 * NO CREDENTIALS AND NO BACKEND: tests/e2e/26-new-application/borrowerFormHarness.ts.
 */
import { test, expect, signedInAs, BRANCH_SUBS } from '../26-new-application/borrowerFormHarness';

const row = (id: string, location: string, submittedAt: string, name: string) => ({
  id, source: 'google_form', channel: 'google_form', submitted_at: submittedAt, location, branch_sub: null,
  status: 'for_interview', full_name: name, contact_no: `0917000${id.padStart(4, '0')}`, amount_applied: '15000.00',
  purpose: 'Medical', intake_flags: [], outcome: 'for_interview', outcome_label: 'Waiting for interview', decline_reason: null,
});

const ROWS = [
  row('31', 'Hindi ko po sure', '2026-10-01 00:00:00', 'E2E Applicant Unsure'),
  row('32', 'Paralayunan, Mabalacat', '2026-10-04 13:45:00', 'E2E Applicant Paralayunan'),
  row('33', 'Balibago, Angeles', '2026-10-11 11:30:00', 'E2E Applicant Balibago'),
];

test('EDC list: "Hindi ko po sure" reads Not sure yet; a named place keeps its answer; October rows are October', async ({ page, backend }) => {
  test.setTimeout(180_000); // the dev server compiles the route on its first visit
  await signedInAs(page, backend, [Number(BRANCH_SUBS[0].id)]);
  backend.extraGraphql.set('getLoanApplications', () => ({
    data: { getLoanApplications: { data: ROWS, paginatorInfo: { total: ROWS.length, currentPage: 1, lastPage: 1, hasMorePages: false } } },
  }));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/applications', { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const unsure = page.getByRole('row').filter({ hasText: /E2E Applicant Unsure/i });
  await expect(unsure).toBeVisible({ timeout: 90_000 });
  const unsureCell = unsure.getByText('Not sure yet'); // after the screen reader's "Not assigned. "
  await expect(unsureCell).toBeVisible();
  await expect(unsure.locator('[title^="The applicant doesn\'t know which branch yet"]')).toHaveAttribute('title', /Hindi ko po sure/);
  await expect(unsure).not.toContainText('Hindi ko po');

  const named = page.getByRole('row').filter({ hasText: /E2E Applicant Paralayunan/i });
  await expect(named.getByText('Paralayunan, Mabalacat')).toBeVisible();
  await expect(named.getByText(/^Oct 4, 2026/)).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /E2E Applicant Balibago/i }).getByText(/^Oct 11, 2026/)).toBeVisible();

  await page.screenshot({ path: 'test-results/42-applications-not-sure.png' });
});
