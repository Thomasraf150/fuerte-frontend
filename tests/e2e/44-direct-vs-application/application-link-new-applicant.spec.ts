/**
 * Link to borrower on a NEW applicant's application (Rafael 2026-10-23): when the branch created the
 * person directly while Marketing's application waited, Create as borrower would be a duplicate. The
 * server says so (has_linkable_borrower), so Link to borrower replaces Create as borrower (which could
 * only make a duplicate); linking makes that borrower the application's (the server marks it
 * Borrower created).
 *
 *   1. Linkable: Link instead of Create; it posts linkLoanApplicationBorrower and the page shows it done.
 *   2. Not linkable -- even when the looser repeat-applicant check matched a name -- Create as borrower alone.
 *   3. A refusal (the borrower changed meanwhile) stays on screen under the button.
 *
 * NO CREDENTIALS AND NO BACKEND: see ../27-application-page/applicationPageHarness.ts. Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/44-direct-vs-application --reporter=list
 */
import {
  application,
  borrowerMatch,
  expect,
  openApplication,
  signedInAs,
  test,
  toolbar,
} from '../27-application-page/applicationPageHarness';

test.setTimeout(180_000);

const CLAIMED = 'This borrower was already made from another application, or already approved or rejected. Ask the branch.';

const interviewed = (linkable: boolean) => application({ status: 'interviewed', has_linkable_borrower: linkable });

test('1. linkable: Link to borrower replaces Create as borrower and links the application', async ({ page, backend }) => {
  backend.record = interviewed(true);
  backend.overrides.set('linkLoanApplicationBorrower', () => ({
    data: { linkLoanApplicationBorrower: { ...backend.record!, status: 'borrower_created', borrower_id: 8801, has_linkable_borrower: false } },
  }));
  await signedInAs(page, backend, 'PROC', [9101], 9101);
  await openApplication(page, '2');
  const bar = toolbar(page);

  const link = bar.getByRole('button', { name: 'Link to borrower' });
  await expect(link).toBeVisible({ timeout: 60_000 });
  await expect(bar.getByRole('link', { name: 'Create as borrower' })).toHaveCount(0);
  await link.click();

  await expect.poll(() => backend.calls('linkLoanApplicationBorrower').length).toBe(1);
  expect(backend.calls('linkLoanApplicationBorrower')[0].variables).toEqual({ id: 2 });
  await expect(bar.getByRole('button', { name: 'Link to borrower' })).toHaveCount(0);
  await expect(bar.getByRole('link', { name: 'Create as borrower' })).toHaveCount(0);
});

test('2. not linkable, even with a same-name match on the repeat-applicant card: only Create as borrower, as before', async ({ page, backend }) => {
  backend.record = interviewed(false);
  backend.match = borrowerMatch({ existsElsewhere: true, branches: ['E2E Sub-branch C'] });
  await signedInAs(page, backend, 'PROC', [9101], 9101);
  await openApplication(page, '2');
  const bar = toolbar(page);

  await expect(bar.getByRole('link', { name: 'Create as borrower' })).toBeVisible();
  await expect.poll(() => backend.calls('getLoanApplicationBorrowerMatch').length).toBeGreaterThan(0);
  await expect(bar.getByRole('button', { name: 'Link to borrower' })).toHaveCount(0);
});

test('3. a refused link keeps its sentence on screen and the button', async ({ page, backend }) => {
  backend.record = interviewed(true);
  backend.overrides.set('linkLoanApplicationBorrower', () => ({ errors: [{ message: CLAIMED }] }));
  await signedInAs(page, backend, 'PROC', [9101], 9101);
  await openApplication(page, '2');
  const bar = toolbar(page);

  await bar.getByRole('button', { name: 'Link to borrower' }).click();

  await expect(bar.getByText(CLAIMED, { exact: true })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Link to borrower' })).toBeVisible();
});
