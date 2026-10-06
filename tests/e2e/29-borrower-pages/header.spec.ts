/**
 * The borrower page header (spec 2026-10-05-borrower-pages-responsive-design.md, B2) and the
 * borrower Approve / Reject decision (2026-10-05-applications-pings-decisions-design.md, Part 1):
 *
 *   1. The header: the name once, the branch, the Payer stamp, the tel link, the date of birth
 *      and the address; a decision already on record shows as its stamp and its line.
 *   2. At 360px: no sideways scroll, the four tabs on one row and uncut, every header control
 *      48px or taller, and the breadcrumb's repeat of the name hidden.
 *   3. Approve posts `approved` (the reason optional) and the stamp reads Approved.
 *   4. Reject will not post without a reason; with one it posts `rejected` and the line shows it.
 *   5. A refused decision toasts the server's message and leaves the stamp as it was.
 *   6. More, then Delete borrower, starts the deletion request (the Borrowers list's flow), and an
 *      already pending request opens the "Already in the queue" modal instead. Escape, a click
 *      outside and tabbing away close the menu; an immediate delete goes back to the list.
 *   7. New Borrower: the header's back link and title only (no Approve or Reject), and its tabs fit at 360px.
 *   8. The header at 360, 768 and 1280 (screenshots to $UX_SHOTS_DIR when it is set).
 *
 * NO CREDENTIALS AND NO BACKEND: see ../26-new-application/borrowerFormHarness.ts. Fictional people only.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/29-borrower-pages --reporter=list
 */
import type { Page } from '@playwright/test';
import { expect, sidewaysScroll, signedInAs, test, type FakeBackend } from '../26-new-application/borrowerFormHarness';

test.setTimeout(180_000);

const BORROWER_ID = 8801;
const NAME = 'DELA CRUZ, JUANA S.';
const ADDRESS = 'BLK 12 LOT 4 SAMPAGUITA ST., BRGY. SAMPLE, SAMPLE CITY';
const TABS = ['Details', 'Loans', 'Co-Maker', 'Attachments'];
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

type Decision = { status: 'approved' | 'rejected'; reason: string | null; decided_at: string };

/** "Today" in these tests: a fixed Manila morning, so a computed age never depends on the day they run. */
const TODAY = new Date('2026-10-05T10:00:00+08:00');

type Details = Partial<{ dob: string; age: number; contact_no: string }>;

/** getBorrower's answer: a fictional borrower on the user's own sub-branch. */
const borrower = (decision: Decision | null = null, details: Details = {}) => ({
  id: String(BORROWER_ID),
  payer_standing: 'GOOD',
  decision,
  user_id: 90001,
  chief_id: 9201,
  amount_applied: '15000',
  purpose: 'Store capital',
  firstname: 'JUANA',
  middlename: 'SANTOS',
  lastname: 'DELA CRUZ',
  terms_of_payment: '12 months',
  residence_address: ADDRESS,
  is_rent: false,
  other_source_of_inc: 'Sari-sari store',
  est_monthly_fam_inc: '25000',
  employment_position: 'Teacher I',
  gender: 'Female',
  photo: null,
  is_deleted: 0,
  chief: { id: '9201', name: 'E2E Chief One' },
  borrower_details: {
    id: '1', dob: '1990-01-15', place_of_birth: 'Sample City', age: 36,
    email: 'e2e.juana@example.test', contact_no: '09170000011', civil_status: 'Single', ...details,
  },
  borrower_spouse_details: {
    work_address: '', occupation: '', fullname: '', company: '', dept_branch: '',
    length_of_service: '', salary: '', company_contact_person: '', contact_no: '',
  },
  borrower_work_background: {
    id: '1', company_borrower_id: 9301, employment_number: 'E2E-0011', area_id: 9401, sub_area_id: 9501,
    station: 'Sample School', term_in_service: '8 years', employment_status: 'Permanent', division: 'Sample Division',
    monthly_gross: '28000', monthly_net: '21000', office_address: '12 Sample Avenue',
    area: { id: '9401', name: 'E2E Area With Sub-areas', branch_sub_id: 9101, branch_sub: { id: '9101', branch_id: 91, name: 'E2E Sub-branch A' } },
  },
  borrower_company_info: { id: '1', employer: 'E2E Employer', salary: '28000', contract_duration: 'Permanent' },
  borrower_reference: [
    { id: '1', occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000021' },
    { id: '2', occupation: 'Administrative Officer/Master Teacher/Head Teacher', name: 'E2E Reference Two', contact_no: '09170000022' },
    { id: '3', occupation: 'Co-worker', name: 'E2E Reference Three', contact_no: '09170000023' },
  ],
  user: { id: 90001, name: 'E2E Admin', branchSub: { id: '9101', name: 'E2E Sub-branch A', branch_id: 91 } },
  branch_sub: { name: 'E2E Sub-branch A', branch: { name: 'E2E Branch FB' } },
});

type Pending = { request_id: string; requested_by_name: string; reason: string | null; created_at: string; is_mine: boolean };

/** Everything the borrower page asks for beyond the harness's defaults. */
async function stubBorrowerPage(
  page: Page,
  backend: FakeBackend,
  options: { decision?: Decision | null; pending?: Pending | null; details?: Details } = {},
) {
  backend.extraGraphql.set('getBorrower', () => ({ data: { getBorrower: borrower(options.decision ?? null, options.details) } }));
  // The header bell may poll this for some roles; always answered here.
  backend.extraGraphql.set('getApplicationNotifications', () => ({ data: { getApplicationNotifications: [] } }));
  backend.extraGraphql.set('pendingDeletionsForEntities', () => ({
    data: {
      pendingDeletionsForEntities: options.pending
        ? [{ entity_type: 'borrower', entity_id: BORROWER_ID, requested_by_user_id: 90002, ...options.pending }]
        : [],
    },
  }));
  backend.extraGraphql.set('setBorrowerDecision', (variables) => ({
    data: {
      setBorrowerDecision: {
        status: variables.status,
        reason: (variables.reason as string | null) ?? null,
        decided_at: '2026-10-05 14:30:00',
      },
    },
  }));
  backend.extraGraphql.set('deleteBorrower', () => ({
    data: { deleteBorrower: { status: true, message: 'E2E stub: deletion request submitted.', immediate: false, request_id: '77' } },
  }));
  // The profile photo: an empty one is still asked for, as /storage/null.
  for (const pattern of ['http://localhost:8080/storage/**', 'http://localhost:3000/storage/**']) {
    await page.route(pattern, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG }));
  }
  await page.clock.setFixedTime(TODAY);
  await signedInAs(page, backend, [9101]);
}

/** Open the saved borrower and wait for its header and its Details form. */
async function openBorrower(page: Page): Promise<void> {
  // The dev server compiles the route on its first visit.
  await page.goto(`/borrowers/${BORROWER_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('heading', { level: 2, name: NAME })).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('input[name="firstname"]')).toHaveValue('JUANA');
  // The root layout covers every page with its spinner for its first second.
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0);
}

const header = (page: Page) => page.locator('main header');
const decisionStamp = (page: Page) => header(page).locator('[data-decision]');
const decisionLine = (page: Page) => page.getByTestId('borrower-decision-line');
const moreSummary = (page: Page) => header(page).locator('summary', { hasText: 'More' });
/** The tab row, and the white card it heads. */
const tabBar = (page: Page) => page.getByRole('button', { name: 'Details', exact: true }).locator('xpath=..');
/**
 * <button>s on the page with no accessible name (the old icon-only back button was one): no text,
 * no aria-label, no title. Real buttons only: the photo uploader's file input also has the button
 * role, and the Details form is not this page's to change.
 */
async function unnamedButtons(page: Page): Promise<number> {
  return page.locator('main button').evaluateAll((buttons) =>
    buttons.filter((b) => b.checkVisibility() && !(b.getAttribute('aria-label') || b.textContent?.trim() || b.getAttribute('title'))).length,
  );
}

// ---------------------------------------------------------------------------
// 1. What the header shows
// ---------------------------------------------------------------------------

test('1. the header shows the name once, the branch, the Payer stamp, the tel link, the date of birth and the address', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend);
  await openBorrower(page);
  const top = header(page);

  await expect(page.getByRole('heading', { name: NAME })).toHaveCount(1);
  await expect(page.getByText('Borrower: ', { exact: false })).toHaveCount(0);
  await expect(top.getByRole('link', { name: 'Back to Borrowers' })).toHaveAttribute('href', '/borrowers');
  await expect(top.getByText('FB', { exact: true })).toBeVisible();
  await expect(top.getByText('E2E Sub-branch A', { exact: true })).toBeVisible();
  await expect(top.locator('[data-payer-standing="GOOD"]')).toHaveText('Good');

  const tel = top.getByRole('link', { name: 'Call 09170000011' });
  await expect(tel).toHaveAttribute('href', 'tel:09170000011');
  await expect(tel).toHaveText('09170000011');
  await expect(top.getByText('Jan 15, 1990 · 36 years', { exact: true })).toBeVisible();
  await expect(top.getByText(ADDRESS, { exact: true })).toBeVisible();

  // No decision yet: no stamp and no line, but both actions.
  await expect(decisionStamp(page)).toHaveCount(0);
  await expect(decisionLine(page)).toHaveCount(0);
  await expect(top.getByRole('button', { name: 'Approve' })).toBeVisible();
  await expect(top.getByRole('button', { name: 'Reject' })).toBeVisible();
  await expect(moreSummary(page)).toBeVisible();

  // The icon-only back button is gone: the header's back link replaces it.
  expect(await unnamedButtons(page)).toBe(0);
});

test('1b. a borrower already rejected opens with the Rejected stamp and its line; of two numbers, the first is the link', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend, {
    decision: { status: 'rejected', reason: 'Kulang ang income', decided_at: '2026-10-04 09:15:00' },
    details: { contact_no: '0917 000 0011 / 0918 000 0012' },
  });
  await openBorrower(page);

  await expect(decisionStamp(page)).toHaveAttribute('data-decision', 'rejected');
  await expect(decisionStamp(page)).toHaveText('Rejected');
  await expect(decisionLine(page)).toHaveText('Rejected Oct 4, 2026 · Kulang ang income');

  const tel = header(page).getByRole('link', { name: 'Call 0917 000 0011' });
  await expect(tel).toHaveAttribute('href', 'tel:09170000011');
  await expect(header(page).getByText('/ 0918 000 0012', { exact: true })).toBeVisible();
});

test('1c. on a saved borrower ?application= is ignored, as the old back button ignored it: the link goes back to Borrowers', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend);
  await page.goto(`/borrowers/${BORROWER_ID}?application=5`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('heading', { level: 2, name: NAME })).toBeVisible({ timeout: 120_000 });

  await expect(header(page).getByRole('link', { name: 'Back to Borrowers' })).toHaveAttribute('href', '/borrowers');
  await expect(header(page).getByRole('link', { name: 'Back to Application' })).toHaveCount(0);
  expect(backend.calls('getLoanApplication')).toHaveLength(0);
});

test('1d. the age is counted from the date of birth on the Manila date, not read from the typed-in age', async ({ page, backend }) => {
  // Born Oct 6, 1990: on Oct 5, 2026 the birthday is tomorrow, so 35, whatever the stale stored 99 says.
  await stubBorrowerPage(page, backend, { details: { dob: '1990-10-06', age: 99 } });
  await openBorrower(page);
  await expect(header(page).getByText('Oct 6, 1990 · 35 years', { exact: true })).toBeVisible();
});

test('1e. with no date of birth the stored age is shown alone', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend, { details: { dob: '', age: 41 } });
  await openBorrower(page);
  await expect(header(page).getByText('41 years', { exact: true })).toBeVisible();
});

test('1f. a 29 February birthday turns over on 1 March in a common year', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend, { details: { dob: '2000-02-29', age: 99 } });
  await page.clock.setFixedTime(new Date('2026-02-28T10:00:00+08:00'));
  await openBorrower(page);
  await expect(header(page).getByText('Feb 29, 2000 · 25 years', { exact: true })).toBeVisible();

  await page.clock.setFixedTime(new Date('2026-03-01T10:00:00+08:00'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(header(page).getByText('Feb 29, 2000 · 26 years', { exact: true })).toBeVisible({ timeout: 120_000 });
});

test('1g. a date of birth in the future shows the date and no age, never the stored one', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend, { details: { dob: '2030-01-01', age: 41 } });
  await openBorrower(page);
  await expect(header(page).getByText('Jan 1, 2030', { exact: true })).toBeVisible();
  await expect(header(page).getByText(/years/)).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// 2. At 360px
// ---------------------------------------------------------------------------

test('2. at 360px nothing scrolls sideways, the four tabs sit on one row uncut, and every header control is 48px or taller', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await stubBorrowerPage(page, backend);
  await openBorrower(page);

  expect(await sidewaysScroll(page)).toBe(0);

  // The name once on a phone: the breadcrumb, which repeats it, is hidden.
  await expect(page.getByText(NAME, { exact: true }).filter({ visible: true })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeHidden();

  // The tabs: all four visible, each on one line, none cut, and the bar does not need to scroll.
  const bar = tabBar(page);
  const barBox = await bar.boundingBox();
  expect(barBox).not.toBeNull();
  const barScroll = await bar.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(barScroll, 'the tab bar overflows its card').toBe(0);
  for (const label of TABS) {
    const tab = bar.getByRole('button', { name: label, exact: true });
    await expect(tab).toBeVisible();
    const box = (await tab.boundingBox())!;
    expect(box.x, `${label} starts outside the bar`).toBeGreaterThanOrEqual(barBox!.x - 0.5);
    expect(box.x + box.width, `${label} ends outside the bar`).toBeLessThanOrEqual(barBox!.x + barBox!.width + 0.5);
    expect(Math.round(box.height), `${label} wrapped onto a second line`).toBe(48);
    expect(await tab.evaluate((el) => el.scrollWidth <= el.clientWidth), `${label} is cut`).toBe(true);
  }

  // Every control in the header: the back link, the tel link, Approve, Reject and More.
  const controls = header(page).locator('a, button, summary').filter({ visible: true });
  const names: string[] = [];
  for (const control of await controls.all()) {
    const box = (await control.boundingBox())!;
    const name = (await control.getAttribute('aria-label')) ?? (await control.innerText());
    names.push(name);
    expect(box.height, `${name} is shorter than 48px`).toBeGreaterThanOrEqual(48);
  }
  expect(names).toEqual(['Back to Borrowers', 'Call 09170000011', 'Approve', 'Reject', 'More actions']);
});

// ---------------------------------------------------------------------------
// 3–5. Approve and Reject
// ---------------------------------------------------------------------------

test('3. Approve posts approved, with the reason optional, and the stamp reads Approved', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend);
  await openBorrower(page);
  const reads = backend.calls('getBorrower').length;

  await header(page).getByRole('button', { name: 'Approve' }).click();
  const prompt = page.getByRole('dialog', { name: 'Approve this borrower?' });
  await expect(prompt.getByRole('textbox', { name: 'Why? (optional)' })).toBeVisible();
  await prompt.getByRole('button', { name: 'Approve', exact: true }).click();

  await expect.poll(() => backend.calls('setBorrowerDecision').length).toBe(1);
  expect(backend.calls('setBorrowerDecision')[0].variables).toEqual({ borrower_id: BORROWER_ID, status: 'approved', reason: null });
  await expect(decisionStamp(page)).toHaveAttribute('data-decision', 'approved');
  await expect(decisionStamp(page)).toHaveText('Approved');
  await expect(decisionLine(page)).toHaveText('Approved Oct 5, 2026');
  await expect(page.getByText('Marked Approved.')).toBeVisible();
  // No reload: the borrower is not read again, and the Details form keeps what it showed.
  expect(backend.calls('getBorrower')).toHaveLength(reads);
  await expect(page.locator('input[name="firstname"]')).toHaveValue('JUANA');
});

test('4. Reject will not post without a reason; with one it posts rejected and the line shows the reason', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend);
  await openBorrower(page);

  await header(page).getByRole('button', { name: 'Reject' }).click();
  const prompt = page.getByRole('dialog', { name: 'Reject this borrower?' });
  const why = prompt.getByRole('textbox', { name: 'Why?' });
  await expect(why).toBeVisible();
  // The server keeps at most 500 characters of a reason; the box takes no more.
  await expect(why).toHaveAttribute('maxlength', '500');

  // Empty, then spaces only: the prompt stays open with the message, and nothing is posted.
  await prompt.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(prompt.getByText('Write why the borrower is rejected.')).toBeVisible();
  await why.fill('   ');
  await prompt.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(prompt.getByText('Write why the borrower is rejected.')).toBeVisible();
  expect(backend.calls('setBorrowerDecision')).toHaveLength(0);

  await why.fill('Kulang ang income');
  await prompt.getByRole('button', { name: 'Reject', exact: true }).click();

  await expect.poll(() => backend.calls('setBorrowerDecision').length).toBe(1);
  expect(backend.calls('setBorrowerDecision')[0].variables).toEqual({ borrower_id: BORROWER_ID, status: 'rejected', reason: 'Kulang ang income' });
  await expect(decisionStamp(page)).toHaveAttribute('data-decision', 'rejected');
  await expect(decisionStamp(page)).toHaveText('Rejected');
  await expect(decisionLine(page)).toHaveText('Rejected Oct 5, 2026 · Kulang ang income');
  await expect(page.getByText('Marked Rejected.')).toBeVisible();
});

test('5. a refused decision toasts the server\'s message and leaves the stamp as it was', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend, {
    decision: { status: 'approved', reason: null, decided_at: '2026-10-01 08:00:00' },
  });
  backend.extraGraphql.set('setBorrowerDecision', () => ({ errors: [{ message: 'Borrower not found.' }] }));
  await openBorrower(page);

  await header(page).getByRole('button', { name: 'Reject' }).click();
  const prompt = page.getByRole('dialog', { name: 'Reject this borrower?' });
  await prompt.getByRole('textbox', { name: 'Why?' }).fill('Hindi na nag-reply');
  await prompt.getByRole('button', { name: 'Reject', exact: true }).click();

  await expect(page.getByText('Borrower not found.')).toBeVisible();
  expect(backend.calls('setBorrowerDecision')).toHaveLength(1);
  await expect(decisionStamp(page)).toHaveAttribute('data-decision', 'approved');
  await expect(decisionLine(page)).toHaveText('Approved Oct 1, 2026');
  // Nothing is stuck: Reject opens its prompt again.
  await header(page).getByRole('button', { name: 'Reject' }).click();
  await expect(page.getByRole('dialog', { name: 'Reject this borrower?' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 6. More
// ---------------------------------------------------------------------------

test('6. More, then Delete borrower, files the deletion request; Escape and a click outside close the menu', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend);
  await openBorrower(page);
  await expect.poll(() => backend.calls('pendingDeletionsForEntities').length).toBe(1);
  expect(backend.calls('pendingDeletionsForEntities')[0].variables).toEqual({ entity_type: 'borrower', entity_ids: [BORROWER_ID] });

  const deleteItem = header(page).getByRole('button', { name: 'Delete borrower' });
  await expect(deleteItem).toBeHidden();

  await moreSummary(page).click();
  await expect(deleteItem).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(deleteItem).toBeHidden();
  await expect(moreSummary(page)).toBeFocused();

  await moreSummary(page).click();
  await expect(deleteItem).toBeVisible();
  await page.getByRole('heading', { level: 2, name: NAME }).click();
  await expect(deleteItem).toBeHidden();

  // By keyboard: Enter opens it, Tab reaches Delete borrower, a second Tab leaves the menu and closes it.
  await moreSummary(page).focus();
  await page.keyboard.press('Enter');
  await expect(deleteItem).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(deleteItem).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(deleteItem).toBeHidden();
  await expect(moreSummary(page)).not.toBeFocused();

  await moreSummary(page).click();
  await deleteItem.click();
  await expect(deleteItem).toBeHidden();
  const prompt = page.getByRole('dialog', { name: 'Delete this borrower?' });
  await prompt.getByRole('textbox', { name: 'Reason for deletion' }).fill('Duplicate entry');
  await prompt.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect.poll(() => backend.calls('deleteBorrower').length).toBe(1);
  expect(backend.calls('deleteBorrower')[0].variables).toEqual({ id: BORROWER_ID, reason: 'Duplicate entry' });
  await expect(page.getByText('E2E stub: deletion request submitted.')).toBeVisible();
  // The request was filed, not carried out: the page stays, and asks again what is pending.
  await expect.poll(() => backend.calls('pendingDeletionsForEntities').length).toBe(2);
  await expect(page).toHaveURL(new RegExp(`/borrowers/${BORROWER_ID}$`));
});

test('6b. with a deletion already pending, Delete borrower opens "Already in the queue" and files nothing', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend, {
    pending: { request_id: '42', requested_by_name: 'E2E Encoder', reason: 'Wrong branch', created_at: '2026-10-05 09:00:00', is_mine: false },
  });
  await openBorrower(page);

  await moreSummary(page).click();
  const deleteItem = header(page).getByRole('button', { name: /Delete borrower/ });
  await expect(deleteItem).toContainText('Already in the deletion queue');
  await deleteItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal.getByText('Already in the queue')).toBeVisible();
  await expect(modal.getByText('E2E Encoder filed this deletion', { exact: false })).toBeVisible();
  await expect(modal.getByText('Request #00042')).toBeVisible();
  await modal.getByRole('button', { name: 'Close' }).click();
  expect(backend.calls('deleteBorrower')).toHaveLength(0);
});

test('6c. an immediate delete goes back to the list with its toast; a cancelled one hands the focus back to More', async ({ page, backend }) => {
  await stubBorrowerPage(page, backend);
  backend.extraGraphql.set('deleteBorrower', () => ({
    data: { deleteBorrower: { status: true, message: 'E2E stub: borrower deleted.', immediate: true, request_id: null } },
  }));
  backend.extraGraphql.set('getBorrowers', () => ({
    data: { getBorrowers: { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, perPage: 20, hasMorePages: false } } },
  }));
  await openBorrower(page);

  // Cancel first: nothing is filed, and the focus is back on More, not lost on the page.
  await moreSummary(page).click();
  await header(page).getByRole('button', { name: 'Delete borrower' }).click();
  const prompt = page.getByRole('dialog', { name: 'Delete this borrower?' });
  await prompt.getByRole('button', { name: 'Cancel' }).click();
  await expect(prompt).toBeHidden();
  await expect(moreSummary(page)).toBeFocused();
  expect(backend.calls('deleteBorrower')).toHaveLength(0);

  // Then delete: done at once (an Admin), so the page has no borrower left and goes back to the list.
  await moreSummary(page).click();
  await header(page).getByRole('button', { name: 'Delete borrower' }).click();
  await page.getByRole('dialog', { name: 'Delete this borrower?' }).getByRole('button', { name: 'Delete', exact: true }).click();
  // The toast first: it closes after 3s, and the dev server may take longer to compile the list.
  await expect(page.getByText('E2E stub: borrower deleted.')).toBeVisible();
  await expect(page).toHaveURL(/\/borrowers$/, { timeout: 90_000 });
  expect(backend.calls('deleteBorrower')[0].variables).toEqual({ id: BORROWER_ID, reason: null });
});

// ---------------------------------------------------------------------------
// 7. New Borrower
// ---------------------------------------------------------------------------

test('7. New Borrower gets the header back link and title only, and its tabs fit one row at 360px', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  backend.extraGraphql.set('getApplicationNotifications', () => ({ data: { getApplicationNotifications: [] } }));
  await signedInAs(page, backend, [9101]);
  await page.goto('/borrowers/new', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.locator('input[name="firstname"]')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0);
  const top = header(page);

  await expect(top.getByRole('heading', { level: 2, name: 'New Borrower' })).toBeVisible();
  const back = top.getByRole('link', { name: 'Back to Borrowers', exact: true });
  await expect(back).toHaveAttribute('href', '/borrowers');
  expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  // No status line, facts or actions, and no icon-only back button.
  await expect(top.locator('[data-payer-standing], [data-decision], dl')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reject' })).toHaveCount(0);
  await expect(page.locator('summary', { hasText: 'More' })).toHaveCount(0);
  expect(await unnamedButtons(page)).toBe(0);

  // The tabs: one row, no scrolling inside it; the three locked ones disabled and described by the draft note.
  const bar = tabBar(page);
  expect(await bar.evaluate((el) => el.scrollWidth - el.clientWidth), 'the tab bar overflows its card').toBe(0);
  for (const label of TABS) {
    const tab = bar.getByRole('button', { name: label, exact: true });
    await expect(tab).toBeVisible();
    expect(Math.round((await tab.boundingBox())!.height), `${label} wrapped onto a second line`).toBe(48);
  }
  for (const label of TABS.slice(1)) {
    const tab = bar.getByRole('button', { name: label, exact: true });
    await expect(tab).toBeDisabled();
    await expect(tab).toHaveAccessibleDescription(/Save the details below to unlock Loans, Co-Maker and Attachments/);
  }
  expect(await sidewaysScroll(page)).toBe(0);
  expect(backend.calls('getBorrower')).toHaveLength(0);
  expect(backend.calls('pendingDeletionsForEntities')).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// 8. The header at three widths
// ---------------------------------------------------------------------------

for (const width of [360, 768, 1280]) {
  test(`8. at ${width}px the header wraps without cutting anything off`, async ({ page, backend }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await stubBorrowerPage(page, backend, {
      decision: { status: 'rejected', reason: 'Kulang ang income', decided_at: '2026-10-05 10:00:00' },
    });
    await openBorrower(page);

    expect(await sidewaysScroll(page)).toBe(0);
    // Anything on screen whose content is wider than its box and hidden by its overflow. Screen-reader
    // labels (sr-only) are clipped on purpose, and the closed More menu is not on screen.
    const cut = await header(page).evaluate((root) =>
      Array.from(root.querySelectorAll<HTMLElement>('*'))
        .filter((el) => el.checkVisibility({ checkVisibilityCSS: true }) && !el.classList.contains('sr-only'))
        .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible')
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(cut, 'an element in the header clips its content').toEqual([]);

    const box = (await header(page).boundingBox())!;
    const card = (await tabBar(page).locator('xpath=..').boundingBox())!;
    testInfo.annotations.push({ type: 'header height', description: `${width}px: header ${Math.round(box.height)}px, tabs card starts at ${Math.round(card.y)}px` });
    console.log(`[header ${width}px] header ${Math.round(box.height)}px tall; tab card top at y=${Math.round(card.y)}`);

    const dir = process.env.UX_SHOTS_DIR;
    await page.screenshot({ path: dir ? `${dir}/after-header-${width}.png` : testInfo.outputPath(`after-header-${width}.png`) });
  });
}
