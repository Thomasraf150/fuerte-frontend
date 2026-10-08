/**
 * An application's own page, /applications/[id], stubbed.
 *
 *   0. The applicant's first, middle and last name are CAPITALS: the form is seeded with them,
 *      Save posts them so (a spouse's and a reference's name keep their case), and the header
 *      and the name inputs are drawn in capitals (CSS only); a fresh load holds nothing unsaved.
 *   1. It opens prefilled from the stored form, under a header with the application's number
 *      ("Application #000002", the id to six digits), the name, Saan galing, the date (the
 *      list's formatting) and the branch ("No branch yet" until there is one).
 *   2. Only first name, last name and mobile are required, so an imported application with
 *      no amount or purpose still saves; spaces in a required field are stopped.
 *   3. A save's reply never brings back an older status (a status reply that came first stays).
 *      Save posts updateLoanApplication with the id as a NUMBER and the input the mapper
 *      builds: a section emptied in the form is sent empty (so the server clears it), the
 *      spouse only while civil status is Married or Live-in. The page stays open and the
 *      header follows the record the server returns. "Saved." is announced once, the same way.
 *   4. A refusal is shown as the server gave it, under the form and in a toast, and the
 *      form keeps its values. It is announced once, by the toast: the note under the form is
 *      the same words as visible text, not a second live region.
 *   5. The status select holds a CHOICE and posts nothing (an arrow key on a closed select
 *      changes it with every press); the "Save status" button beside it posts it, once. While
 *      it is out the button reads "Saving…" (aria-busy, ignores clicks) and the select is
 *      locked; then the pill follows, a polite live region says "Status saved: Interviewed",
 *      the button reads "Saved" for a moment, and Create as borrower re-evaluates. A refusal
 *      is announced once, by the toast, and stays beside the button as visible text that
 *      describes it; the choice stays, to try again or change back. While the choice differs
 *      from the saved status Create as borrower says "Save the status first." ("Save your
 *      changes first." still comes before it); Print is not held. Leaving with an unsaved
 *      choice posts nothing. A converted application's status is locked, with no button.
 *   6. Print Application calls printLoanApplication with {application_id: <number>} and opens
 *      the PDF in a window of its own; while it is made the button reads "Generating…".
 *   7. Create as borrower (Call Center included since 2026-10-07) says why while it cannot be pressed
 *      ("Assign a branch first", "Set the status to Interviewed first") and, once the
 *      application has a saved branch and is Interviewed, opens /borrowers/new?application=<id>.
 *      Both it and Print use the SAVED application, so while the form holds changes that are
 *      not saved (section 15) they wait, with "Save your changes first." ahead of the others.
 *   8. A converted application ("Borrower created") is a read-only record: no form, a link
 *      to the borrower, the Status select disabled, no Create as borrower; Print still works.
 *      So is one with a borrower linked whatever its status says (the server edits only an
 *      application with no borrower): the page, the toolbar and the select share one check,
 *      notConvertibleReason's "converted".
 *   9. A missing application, a malformed id and a failed load say so; Retry loads again.
 *  10. Owner, Admin and Call Center pick the branch from getApplicationBranches; branch
 *      staff see it read-only and send none, whatever their number of branches; an
 *      application nobody has placed stays unplaced until someone picks a branch. A save
 *      sends the branch ONLY when the picker was changed in this form (it differs from the one
 *      the page loaded or last saved): the server moves an application whenever the branch
 *      sent differs from the stored one, so a stale page must not undo a colleague's move.
 *  11. "From the Google Form": the flags, then the answers as a definition list, beside the
 *      form from 1280px (open, following the page) and above it on a phone (collapsed);
 *      nothing when the application has neither.
 *  12. Back (the form's own and the toolbar's) returns to the list without asking.
 *  13. At 360px nothing scrolls sideways and every control is 48px or taller, the form's
 *      buttons and react-selects included (and every react-select has a name). From md up
 *      the branch list's Retry keeps its own 36px. The repeat-applicant card, with long
 *      branch names, and its failure note and Retry are measured too, and so are Marketing's
 *      view-only page and a converted application's decision with a long reason.
 *  14. React logs no warning while the page loads, saves and changes status.
 *  15. Unsaved changes: while the form differs from what is saved (a typed field, a pick in a
 *      react-select, a reference row added or removed) or a save is out, Print and Create
 *      as borrower are aria-disabled with "Save your changes first."; a fresh load of a
 *      fully filled application, a status change alone, and tabbing through a number field
 *      ("12500" shown as "12,500"), leave them free. A save that went through says "Saved."
 *      under the form only while the form still says what it posted: edited while the save
 *      was out, the page says "Save your changes first." and not "Saved." beside it.
 *  16. The repeat-applicant warning (a fraud signal: the applicant's name or mobile matches a
 *      borrower already in Fuerte). getLoanApplicationBorrowerMatch is asked once the record
 *      has loaded, again after each saved edit and on Retry; for Call Center too (which is told
 *      to let the branch know, and whose matches are all "Branches"), and never for an
 *      application that is a borrower already. Shown only for a match (in my branches:
 *      the count and the names; elsewhere: the names; a problem account: the worst cut-offs):
 *      loading and "no match" show nothing, ever an all-clear. A failed check is a quiet
 *      note with Retry, never "new". A labelled section under the actions, before the form
 *      and the notes, announced politely once, never an alert; Print and Create as borrower
 *      are not touched by it. After a Retry that succeeds the focus goes to the card's heading
 *      (or, with no match, to the page's heading), once: never on the first check or a later
 *      one. Its lists are valid (axe: dlitem, definition-list), and it unfolds with exactly
 *      one native animation, none under prefers-reduced-motion.
 *  17. Whose branch: Create as borrower. Everyone but the Owner files a borrower only on a branch
 *      they have (getMyAccessibleBranchSubs: the list the server checks against), so for an
 *      application on another branch Create is off with "This application is on another branch.
 *      Ask that branch, or the Owner, to create the borrower." (after "Save your changes first.",
 *      and, as on the server, after the interview), and New Borrower opened on it shows a card
 *      instead of the form (and never draws the form while the list loads). The Owner is never
 *      blocked and not asked; a list that does not load blocks nobody; plain New Borrower is
 *      unchanged. Create as borrower is clicked through to New Borrower: the banner, the names.
 *  18. Date applied: for Owner, Admin and Call Center, on a Google Form application whose
 *      time did not come from Google's download (exact_time false) and that is not a borrower
 *      yet, a labelled date input in the form (2020-01-01 to today in Manila, widened to a day
 *      the application already holds). It starts on the day the application has; Save sends
 *      submitted_on only when the day differs from the day last loaded or saved; a changed
 *      day is unsaved (Print and Create wait); the header follows the server's reply; the
 *      server's refusals are shown as given. It is required: a cleared day stops Save with
 *      "Choose the date applied." and nothing is posted. Nobody else sees the field.
 *
 * NO CREDENTIALS AND NO BACKEND: see applicationPageHarness.ts. The users are fictional
 * Call Center, Owner, Admin and Processing staff, seeded with the harness's made-up token.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/27-application-page/application-page.spec.ts --reporter=line
 */
import type { Locator, Page } from '@playwright/test';
import { manilaToday } from '../../../src/utils/sourceTracker';
import {
  APP,
  BACKEND,
  BRANCHES,
  type FakeBackend,
  type GraphqlBody,
  type RoleCode,
  NOT_FOUND,
  DECLINE_REASON,
  answerDeclinePrompt,
  application,
  borrowerMatch,
  branchPicker,
  expect,
  field,
  fullApplication,
  googleFormApplication,
  noBorrowerMatch,
  openApplication,
  pickBranch,
  pickFromSelect,
  pickerOptions,
  pickerValue,
  requiredMarks,
  saveButton,
  selectControl,
  selectNamed,
  sidewaysScroll,
  signedInAs,
  statusSelect,
  test,
  toolbar,
} from './applicationPageHarness';

test.setTimeout(180_000);

const URL_2 = `${APP}/applications/2`;
const SAVED = 'Saved.';
/** Why Print and Create as borrower wait while the form holds changes that are not saved. */
const SAVE_FIRST = 'Save your changes first.';
/** Create as borrower waits while the status select holds a choice that is not saved. */
const SAVE_STATUS_FIRST = 'Save the status first.';
/** The repeat-applicant warning's words, as Rafael asked for them (2026-10-02). */
const REPEAT_TITLE = 'This applicant may already be a borrower';
const REPEAT_BODY =
  'Their name or mobile number matches a borrower already in Fuerte. They may be applying as a new borrower to get better rates. Check their record before you continue.';
const CHECK_FAILED = 'Could not check whether this applicant is already a borrower.';
/** What the server says when the check itself fails; the page does not repeat it. */
const SERVER_CHECK_FAILED = 'Could not check for an existing borrower. Please try again.';
/** Create as borrower for an application on a branch the user does not have: the page's sentence, and New Borrower's card (title and hint). */
const OTHER_BRANCH_TITLE = 'This application is on another branch';
const OTHER_BRANCH_HINT = 'Ask that branch, or the Owner, to create the borrower.';
const OTHER_BRANCH = `${OTHER_BRANCH_TITLE}. ${OTHER_BRANCH_HINT}`;
const BLANK = 'The first name, last name and mobile number cannot be blank.';
const GENERIC_SAVE = 'Could not save the application. Please try again.';

const refusal = (message: string): GraphqlBody => ({ errors: [{ message }] });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The header card, found by its heading (the applicant's name). */
const headerOf = (page: Page, name = 'E2E Applicant Two'): Locator => page.getByRole('region', { name });

/** The status pill in the header. */
const pill = (page: Page, label: string): Locator => headerOf(page).getByTitle(label, { exact: true });

const createAsBorrower = (page: Page): Locator => toolbar(page).getByText('Create as borrower', { exact: true });

/**
 * The note under the form after a save: visible text, NOT a live region (data-state says how the save
 * went). The toast the save raises is the one announcement of "Saved." or of a refusal; a live copy
 * here would be read a second time.
 */
const savedNote = (page: Page): Locator => page.locator('[data-testid="save-note"][data-state="saved"]').filter({ hasText: SAVED });
const failedNote = (page: Page, message: string): Locator => page.locator('[data-testid="save-note"][data-state="failed"]').filter({ hasText: message });
const toastWith = (page: Page, message: string): Locator => page.locator('.Toastify__toast').filter({ hasText: message });

/**
 * The live regions that hold these words right now, one entry each: "toast" (react-toastify puts
 * role="alert" on the body of every toast), "toolbar" (the status's polite paragraph), or the tag and
 * role of any other. A screen reader reads each of them, so words held by two are read twice. A region
 * inside another counts once, as the innermost; the visible notes are in none.
 */
const announcedBy = (page: Page, words: string): Promise<string[]> =>
  page.evaluate((needle) => {
    const live = Array.from(document.querySelectorAll<HTMLElement>('[role="alert"], [role="status"], [role="log"], [aria-live]'))
      .filter((region) => region.getAttribute('aria-live') !== 'off' && (region.textContent ?? '').includes(needle));
    return live
      .filter((region) => !live.some((inner) => inner !== region && region.contains(inner)))
      .map((region) => {
        if (region.closest('.Toastify')) return 'toast';
        if (region.closest('[aria-label="Application actions"]')) return 'toolbar';
        return `${region.tagName.toLowerCase()}[${region.getAttribute('role') ?? 'aria-live'}]`;
      });
  }, words);

/** Every updateLoanApplication the page has sent, in order. */
const updates = (backend: FakeBackend) => backend.calls('updateLoanApplication').map((call) => call.variables);

/** The repeat-applicant card, a section named by its heading; the quiet note when the check could not be made. */
const repeatCard = (page: Page): Locator => page.getByRole('region', { name: REPEAT_TITLE, exact: true });
const checkNote = (page: Page): Locator => page.getByText(CHECK_FAILED, { exact: true });
/** Every getLoanApplicationBorrowerMatch the page has sent, in order. */
const checks = (backend: FakeBackend) => backend.calls('getLoanApplicationBorrowerMatch');

/**
 * Seed a record, sign in, open /applications/2. Processing is branch staff on Sub-branch A
 * unless told otherwise; the other roles have no branch of their own.
 */
async function open(
  page: Page,
  backend: FakeBackend,
  record = application(),
  role: RoleCode = 'ADM',
  assignedBranchSubIds: number[] = role === 'PROC' ? [9101] : [],
  homeBranchSubId: number | null = role === 'PROC' ? 9101 : null,
): Promise<void> {
  backend.record = record;
  await signedInAs(page, backend, role, assignedBranchSubIds, homeBranchSubId);
  await openApplication(page, '2');
}

const printButton = (page: Page): Locator => toolbar(page).getByRole('button', { name: 'Print Application' });

/** The button that saves the status: "Save status"; "Saving…" while the post is out; "Saved" for a moment after. */
const saveStatusButton = (page: Page): Locator => toolbar(page).getByRole('button', { name: /^(Save status|Saving…|Saved)$/ });

/**
 * Choose a status in the select and save it, as staff do, and wait until the server has answered
 * (the button then reads "Saved"). The choice must differ from the saved status.
 */
async function changeStatusTo(page: Page, value: string): Promise<void> {
  await statusSelect(page).selectOption(value);
  await saveStatusButton(page).click();
  // Declined asks why first (tests/e2e/30-applicant-funnel covers the prompt itself).
  if (value === 'declined') await answerDeclinePrompt(page);
  await expect(saveStatusButton(page)).toHaveText('Saved');
}

/** Save status, answering the Declined prompt when the choice is Declined. */
async function saveDeclined(page: Page): Promise<void> {
  await saveStatusButton(page).click();
  await answerDeclinePrompt(page);
}
/** Print is free and the toolbar does not say to save: the form holds what is saved. */
const expectNothingToSave = async (page: Page): Promise<void> => {
  await expect(printButton(page)).toHaveAttribute('aria-disabled', 'false');
  await expect(toolbar(page).getByText(SAVE_FIRST)).toHaveCount(0);
};
const createButton = (page: Page): Locator => toolbar(page).getByRole('button', { name: 'Create as borrower' });
const createLink = (page: Page): Locator => toolbar(page).getByRole('link', { name: 'Create as borrower' });

/** The statuses the page has posted, in order. */
const postedStatuses = (backend: FakeBackend): string[] =>
  backend.calls('setLoanApplicationStatus').map((call) => call.variables.status);

// ---------------------------------------------------------------------------
// 1. The page opens prefilled, under its header
// ---------------------------------------------------------------------------

test.describe('1. The page and its header', () => {
  test('opens prefilled from the stored form, asking for the application by its number', async ({ page, backend }) => {
    await open(page, backend);

    await expect(field(page, 'firstname')).toHaveValue('E2E');
    await expect(field(page, 'lastname')).toHaveValue('APPLICANT TWO');
    await expect(field(page, 'contact_no')).toHaveValue('09170000002');
    await expect(field(page, 'email')).toHaveValue('e2e.two@example.test');
    await expect(field(page, 'amount_applied')).toHaveValue('15,000.00');
    await expect(field(page, 'purpose')).toHaveValue('Store capital');
    await expect(field(page, 'residence_address')).toHaveValue('1 Sample Street, Sample Town');
    await expect(field(page, 'is_rent')).toHaveValue('1');
    await expect(field(page, 'gender')).toHaveValue('Female');
    await expect(field(page, 'dob')).toHaveValue('1990-05-17');
    await expect(field(page, 'age')).toHaveValue('36');
    await expect(field(page, 'civil_status')).toHaveValue('Single');
    await expect.poll(() => pickerValue(page)).toBe('E2E Sub-branch A');

    const asked = backend.calls('getLoanApplication');
    expect(asked.length).toBeGreaterThan(0);
    for (const call of asked) expect(call.variables).toEqual({ id: 2 });
  });

  test('names stored in another case show in CAPITALS: the header, the three name inputs and their values; a fresh load holds nothing unsaved', async ({ page, backend }) => {
    const base = application();
    await open(page, backend, application({
      status: 'interviewed',
      full_name: 'maria santos dela peña',
      details: { ...base.details, info: { ...base.details.info!, firstname: 'maria', middlename: 'santos', lastname: 'dela Peña' } },
    }));
    const textTransform = (locator: Locator): Promise<string> => locator.evaluate((element) => getComputedStyle(element).textTransform);

    // The form is seeded with capitals, so the values are what a save would store.
    await expect(field(page, 'firstname')).toHaveValue('MARIA');
    await expect(field(page, 'middlename')).toHaveValue('SANTOS');
    await expect(field(page, 'lastname')).toHaveValue('DELA PEÑA');
    // The header: the text as stored (the DOM is not rewritten), drawn in capitals.
    const title = headerOf(page, 'maria santos dela peña').getByRole('heading');
    await expect(title).toHaveText('maria santos dela peña');
    expect(await textTransform(title)).toBe('uppercase');
    // The three name inputs are drawn in capitals too, and nothing else in the form is.
    for (const name of ['firstname', 'middlename', 'lastname']) expect(await textTransform(field(page, name)), name).toBe('uppercase');
    for (const name of ['purpose', 'residence_address', 'email']) expect(await textTransform(field(page, name)), name).toBe('none');

    // Loaded, and nothing to save: Print is free and nothing says to save, even a moment later.
    await expectNothingToSave(page);
    await page.waitForTimeout(800);
    await expectNothingToSave(page);
    // Typing the same name in lowercase is no change: what would be saved is the same.
    await field(page, 'firstname').fill('maria');
    await expectNothingToSave(page);
  });

  test('the header says which application it is, who, where it came from, when it came in, where it stands and which branch has it', async ({ page, backend }) => {
    await open(page, backend);
    const header = headerOf(page);

    await expect(header.getByText('Application #000002', { exact: true })).toBeVisible();
    await expect(header.getByRole('heading', { name: 'E2E Applicant Two' })).toBeVisible();
    // The source: its words ("Saan galing" is printed from sm up, and this runs at 1280px) and its name.
    await expect(header.getByText('Saan galing', { exact: true })).toBeVisible();
    await expect(header.getByText('Messenger', { exact: true })).toBeVisible();
    // The list's formatting of the Manila wall-clock the server sends.
    await expect(header.getByText('Sep 21, 2026, 8:05 PM', { exact: true })).toBeVisible();
    await expect(header.getByText('E2E Sub-branch A', { exact: true })).toBeVisible();
    await expect(pill(page, 'For Interview')).toBeVisible();
    // The trail starts at Applications, not Dashboard (Call Center would be bounced back from there).
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Applications' })).toHaveAttribute('href', '/applications');
  });

  test('the application number is the id to six digits, as New Borrower\'s banner has it, and a longer id is not cut', async ({ page, backend }) => {
    await signedInAs(page, backend, 'ADM');
    for (const [id, number] of [['7', '#000007'], ['123', '#000123'], ['1234567', '#1234567']]) {
      backend.record = application({ id });

      await openApplication(page, id);

      await expect(headerOf(page).getByText(`Application ${number}`, { exact: true })).toBeVisible();
    }
  });

  test('a time of exactly midnight is a date with no time, as in the list; no time at all shows no date', async ({ page, backend }) => {
    await open(page, backend, application({ submitted_at: '2026-10-01 00:00:00' }));
    await expect(headerOf(page).getByText('Oct 1, 2026', { exact: true })).toBeVisible();

    const none = application({ submitted_at: null });
    backend.record = none;
    await page.reload();
    await expect(toolbar(page)).toBeVisible({ timeout: 90_000 });
    await expect(headerOf(page).getByText('Submitted', { exact: true })).toHaveCount(0);
  });

  test('an application with no branch says "No branch yet"; one with no source shows no Saan galing', async ({ page, backend }) => {
    await open(page, backend, application({ branch_sub_id: null, branch_sub: null, channel: null }));
    const header = headerOf(page);

    await expect(header.getByText('No branch yet', { exact: true })).toBeVisible();
    await expect(header).not.toContainText('Saan galing');
  });

  test('every source has its own badge', async ({ page, backend }) => {
    const expected: [string, string][] = [['google_form', 'Google Form'], ['facebook', 'Messenger'], ['walk_in', 'Walk-in'], ['phone', 'Tawag/Text']];
    await open(page, backend);
    for (const [channel, label] of expected) {
      backend.record = application({ channel: channel as never });
      await page.reload();
      await expect(toolbar(page)).toBeVisible({ timeout: 90_000 });
      await expect(headerOf(page)).toContainText(label);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. What is required
// ---------------------------------------------------------------------------

test.describe('2. What is required', () => {
  test('only first name, last name and mobile carry the asterisk', async ({ page, backend }) => {
    await open(page, backend);

    expect(await requiredMarks(page)).toEqual(['contact_no', 'firstname', 'lastname']);
  });

  // Rafael 2026-10-08: the page stays open after a save, so the save bar's "Not saved yet" must
  // clear once the save went through (it read react-hook-form's isDirty, which no save resets).
  test('after a save that went through, the save bar no longer says "Not saved yet"', async ({ page, backend }) => {
    await open(page, backend);
    const unsaved = page.getByRole('status').filter({ hasText: 'Not saved yet' });
    await expect(unsaved).toHaveCount(0);

    await field(page, 'purpose').fill('E2E edited purpose');
    await expect(unsaved).toBeVisible();

    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    await expect(unsaved).toHaveCount(0);

    await field(page, 'purpose').fill('E2E edited again');
    await expect(unsaved).toBeVisible();
  });

  test('an application with no amount and no purpose still saves', async ({ page, backend }) => {
    const base = application();
    await open(page, backend, application({
      amount_applied: null, purpose: null,
      details: { ...base.details, info: { ...base.details.info!, amount_applied: null, purpose: null } },
    }));
    await expect(field(page, 'amount_applied')).toHaveValue('');
    await expect(field(page, 'purpose')).toHaveValue('');

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect(updates(backend)).toHaveLength(1);
  });

  test('a required field left empty is flagged, and nothing is posted', async ({ page, backend }) => {
    await open(page, backend);
    await field(page, 'firstname').fill('');

    await saveButton(page).click();

    await expect(page.getByText('This field is required')).toBeVisible();
    expect(updates(backend)).toHaveLength(0);
  });

  test('a first name of only spaces gets a plain message, and nothing is posted', async ({ page, backend }) => {
    await open(page, backend);
    await field(page, 'firstname').fill('   ');

    await saveButton(page).click();

    await expect(failedNote(page, BLANK)).toBeVisible();
    await expect(toastWith(page, BLANK)).toBeVisible();
    expect(updates(backend)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Saving
// ---------------------------------------------------------------------------

test.describe('3. Saving', () => {
  test('Save posts the id as a number and the form as the mapper builds it; the page stays open and the header follows the record', async ({ page, backend }) => {
    await open(page, backend);
    await field(page, 'firstname').fill('E2E Edited');

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    await expect(toastWith(page, SAVED)).toBeVisible();
    expect(updates(backend)).toEqual([
      {
        id: 2,
        input: {
          // No branch_sub_id: this is Admin, who may assign, but the picker was not touched, and the
          // server moves an application whenever the branch sent differs from the stored one (section 10).
          info: {
            firstname: 'E2E EDITED', lastname: 'APPLICANT TWO', amount_applied: '15000.00', purpose: 'Store capital',
            residence_address: '1 Sample Street, Sample Town', is_rent: 1, employment_position: 'Clerk', gender: 'Female',
          },
          detail: {
            contact_no: '09170000002', email: 'e2e.two@example.test', dob: '1990-05-17',
            place_of_birth: 'Sample Town', age: 36, civil_status: 'Single',
          },
          // Nothing in these sections: sent empty, so the server clears what it holds. The spouse is
          // left out (civil status is Single), so the stored one stays.
          work: {},
          company: {},
          references: [],
        },
      },
    ]);
    expect(typeof backend.calls('updateLoanApplication')[0].variables.id).toBe('number');
    // Not the list: BorrowerDetails closes its form after a save, and this page stays.
    await expect(page).toHaveURL(URL_2);
    await expect(field(page, 'firstname')).toHaveValue('E2E Edited');
    await expect(headerOf(page, 'E2E Edited Applicant Two').getByRole('heading')).toBeVisible();
  });

  test('names typed in lowercase are saved in CAPITALS, and the header follows; the spouse and the references keep their case', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    await field(page, 'firstname').fill('jose maría');
    await field(page, 'middlename').fill('muñoz');
    await field(page, 'lastname').fill('dela peña');

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    const { info, spouse, references } = updates(backend)[0].input;
    expect(info).toMatchObject({ firstname: 'JOSE MARÍA', middlename: 'MUÑOZ', lastname: 'DELA PEÑA' });
    expect(spouse.fullname).toBe('E2E Spouse');
    expect(references.map((reference: { name: string }) => reference.name)).toEqual([
      'E2E Reference One', 'E2E Reference Two', 'E2E Reference Three', 'E2E Reference Four',
    ]);
    // The record the server sends back is in capitals, and the header (drawn in capitals anyway) follows it.
    await expect(headerOf(page, 'JOSE MARÍA MUÑOZ DELA PEÑA').getByRole('heading')).toBeVisible();
    // The fields still hold what was typed, and that is nothing to save: the built input is the one just saved.
    await expect(field(page, 'firstname')).toHaveValue('jose maría');
    await expectNothingToSave(page);
  });

  test('a section the form has emptied goes empty, and the spouse goes only while civil status shows it', async ({ page, backend }) => {
    const base = application();
    await open(page, backend, application({
      details: {
        info: base.details.info,
        detail: { ...base.details.detail!, civil_status: 'Married' },
        spouse: {
          work_address: null, occupation: 'Teacher', fullname: 'E2E Spouse', company: null, dept_branch: null,
          length_of_service: null, salary: null, company_contact_person: null, contact_no: '09170000009',
        },
        work: {
          company_borrower_id: null, employment_number: 'E2E-1', area_id: null, sub_area_id: null, station: 'E2E Station',
          term_in_service: null, employment_status: null, division: null, monthly_gross: null, monthly_net: null, office_address: null,
        },
        company: { employer: 'E2E Employer', salary: '12000.00', contract_duration: '1 year' },
        references: [{ occupation: 'Co-worker', name: 'E2E Reference', contact_no: '09170000008' }],
      },
    }));
    await expect(field(page, 'civil_status')).toHaveValue('Married');
    await expect(field(page, 'fullname')).toHaveValue('E2E Spouse');

    // Untouched: everything stored goes back as it was.
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    const kept = updates(backend)[0].input;
    expect(kept.spouse).toEqual({ occupation: 'Teacher', fullname: 'E2E Spouse', contact_no: '09170000009' });
    expect(kept.work).toEqual({ employment_number: 'E2E-1', station: 'E2E Station' });
    expect(kept.company).toEqual({ employer: 'E2E Employer', salary: '12000.00', contract_duration: '1 year' });
    expect(kept.references).toEqual([{ occupation: 'Co-worker', name: 'E2E Reference', contact_no: '09170000008' }]);

    // The company and the reference emptied in the form: sent empty, not left out.
    await field(page, 'employer').fill('');
    await field(page, 'company_salary').fill('');
    await field(page, 'contract_duration').fill('');
    await field(page, 'reference.0.name').fill('');
    await field(page, 'reference.0.contact_no').fill('');
    // And the spouse hidden again (Single): the form says nothing about it, so it is left out.
    await field(page, 'civil_status').selectOption('Single');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(2);
    const emptied = updates(backend)[1].input;
    expect(emptied.company).toEqual({});
    expect(emptied.references).toEqual([]);
    expect(emptied.work).toEqual({ employment_number: 'E2E-1', station: 'E2E Station' });
    expect('spouse' in emptied).toBe(false);
  });

  test('"Saved." goes away once the form is edited again, and a refusal does too: the note says how the last save went', async ({ page, backend }) => {
    await open(page, backend);
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();

    await field(page, 'purpose').fill('Store capital, second thoughts');
    await expect(savedNote(page)).toHaveCount(0);

    backend.overrides.set('updateLoanApplication', () => refusal('You cannot move this application to that branch.'));
    await saveButton(page).click();
    await expect(failedNote(page, 'You cannot move this application to that branch.')).toBeVisible();
    await field(page, 'purpose').fill('Store capital, third thoughts');
    await expect(failedNote(page, 'You cannot move this application to that branch.')).toHaveCount(0);
  });

  test('the note goes away on a pick in a react-select or a reference added, as it does when a field is typed in', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();

    // Neither of these fires an input or change event in the page: the form's own state is what knows.
    await pickFromSelect(page, 'Chief', 'E2E Chief Two');
    await expect(savedNote(page)).toHaveCount(0);

    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    await page.getByRole('button', { name: 'Add More', exact: true }).click();
    await expect(savedNote(page)).toHaveCount(0);
  });

  test('"Saved." is announced once, by the toast: the note under the form is the same words as visible text, not a second live region', async ({ page, backend }) => {
    await open(page, backend);
    // Nothing saved yet: no note at all, so no empty live region sits under the form either.
    await expect(page.getByTestId('save-note')).toHaveCount(0);

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    await expect(toastWith(page, SAVED)).toBeVisible();
    expect(await announcedBy(page, SAVED), '"Saved." is read more than once').toEqual(['toast']);
    await expect(savedNote(page)).not.toHaveAttribute('role', /./);
    expect(await savedNote(page).evaluate((note) => note.closest('[role="alert"], [role="status"], [role="log"], [aria-live]'))).toBeNull();
  });

  test('a refusal is announced once, by the toast: the note under the form is the same words as visible text, not a second live region', async ({ page, backend }) => {
    await open(page, backend);
    const message = 'You cannot move this application to that branch.';
    backend.overrides.set('updateLoanApplication', () => refusal(message));

    await saveButton(page).click();

    await expect(failedNote(page, message)).toBeVisible();
    await expect(toastWith(page, message)).toBeVisible();
    expect(await announcedBy(page, message), 'the refusal is read more than once').toEqual(['toast']);
    await expect(failedNote(page, message)).not.toHaveAttribute('role', /./);
    expect(await failedNote(page, message).evaluate((note) => note.closest('[role="alert"], [role="status"], [role="log"], [aria-live]'))).toBeNull();
  });

  test('a save reply that arrives after a status reply does not bring the old status back', async ({ page, backend }) => {
    await open(page, backend);
    // The save's reply, as the server built it BEFORE the status changed: the name is the new one, the status still For Interview.
    const reply = { ...backend.record!, full_name: 'E2E Edited Applicant Two' };
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    backend.overrides.set('updateLoanApplication', async () => {
      await held;
      return { data: { updateLoanApplication: reply } };
    });
    await field(page, 'firstname').fill('E2E Edited');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(1);

    // The status changes while the save is out, and its reply comes first.
    await changeStatusTo(page, 'interviewed');
    await expect(pill(page, 'Interviewed')).toBeVisible();
    release();

    await expect(savedNote(page)).toBeVisible();
    const header = headerOf(page, 'E2E Edited Applicant Two');
    await expect(header.getByRole('heading')).toBeVisible();
    await expect(header.getByTitle('Interviewed', { exact: true })).toBeVisible();
    await expect(header.getByTitle('For Interview', { exact: true })).toHaveCount(0);
    await expect(statusSelect(page)).toHaveValue('interviewed');
    await expect(createLink(page)).toBeVisible();
  });

  test('Back after a save goes to the list: the page only stays open for the save itself', async ({ page, backend }) => {
    await open(page, backend);
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    await expect(page).toHaveURL(URL_2);

    await page.getByRole('button', { name: 'Back', exact: true }).click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
  });
});

// ---------------------------------------------------------------------------
// 4. A refusal
// ---------------------------------------------------------------------------

test.describe('4. A refusal from the server', () => {
  const REFUSALS = [
    NOT_FOUND,
    'This application is already a borrower and can no longer be edited.',
    'You cannot move this application to that branch.',
    "Only Call Center, Owner or Admin can change the name or mobile number until this applicant's Google Form answers come in. Change them back to save your other changes.",
  ];

  test('each message is shown as the server gave it, under the form and in a toast, announced once, and the form keeps its values', async ({ page, backend }) => {
    await open(page, backend);
    await field(page, 'firstname').fill('E2E Edited');

    for (const message of REFUSALS) {
      backend.overrides.set('updateLoanApplication', () => refusal(message));
      await saveButton(page).click();

      await expect(failedNote(page, message)).toBeVisible();
      await expect(toastWith(page, message)).toBeVisible();
      expect(await announcedBy(page, message), 'a refusal is read more than once').toEqual(['toast']);
      await expect(savedNote(page)).toHaveCount(0);
      await expect(field(page, 'firstname')).toHaveValue('E2E Edited');
      await expect(page).toHaveURL(URL_2);
    }
    expect(updates(backend)).toHaveLength(REFUSALS.length);
  });

  test('an answer with no message says the generic one; a later save that works clears the refusal', async ({ page, backend }) => {
    await open(page, backend);
    backend.overrides.set('updateLoanApplication', () => refusal(''));
    await saveButton(page).click();
    await expect(failedNote(page, GENERIC_SAVE)).toBeVisible();

    backend.overrides.delete('updateLoanApplication');
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    await expect(failedNote(page, GENERIC_SAVE)).toHaveCount(0);
  });

  test('a connection that fails says so, and the form is not lost', async ({ page, backend }) => {
    await open(page, backend);
    await field(page, 'firstname').fill('E2E Edited');
    await page.route(`${BACKEND}/fuerte-api`, (route) => (route.request().postData() ?? '').includes('updateLoanApplication') ? route.abort('failed') : route.fallback());

    await saveButton(page).click();

    await expect(failedNote(page, 'Cannot reach the server')).toBeVisible();
    await expect(toastWith(page, 'Cannot reach the server')).toBeVisible();
    expect(await announcedBy(page, 'Cannot reach the server'), 'the refusal is read more than once').toEqual(['toast']);
    await expect(field(page, 'firstname')).toHaveValue('E2E Edited');
  });
});

// ---------------------------------------------------------------------------
// 5. Status
// ---------------------------------------------------------------------------

test.describe('5. Status', () => {
  test('the select holds a choice and posts nothing: not when it changes, not when it is left, not after a long pause', async ({ page, backend }) => {
    await open(page, backend);
    await expect(statusSelect(page)).toHaveValue('for_interview');
    await expect(statusSelect(page).locator('option')).toHaveText(['For Interview', 'Interviewed', 'Declined']);
    // Nothing chosen yet, nothing to save.
    await expect(saveStatusButton(page)).toHaveText('Save status');
    await expect(saveStatusButton(page)).toHaveAttribute('aria-disabled', 'true');

    await statusSelect(page).focus();
    await statusSelect(page).selectOption('interviewed');
    await statusSelect(page).selectOption('declined');
    await page.keyboard.press('Tab'); // leaves the select
    await page.waitForTimeout(1_500); // far longer than any auto-save ever waited

    expect(postedStatuses(backend), 'a status was posted by choosing it').toEqual([]);
    await expect(statusSelect(page)).toHaveValue('declined');
    // The page still reads the SAVED status, and the button is on.
    await expect(pill(page, 'For Interview')).toBeVisible();
    await expect(saveStatusButton(page)).toBeFocused();
    await expect(saveStatusButton(page)).toHaveAttribute('aria-disabled', 'false');
  });

  test('the arrow keys step through the closed select without posting anything', async ({ page, backend }) => {
    test.skip(process.platform === 'darwin', 'macOS opens the list on an arrow key instead of changing the choice');
    await open(page, backend);

    await statusSelect(page).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect(statusSelect(page)).toHaveValue('declined');
    await page.waitForTimeout(1_500);
    expect(postedStatuses(backend), 'an arrow key posted a status').toEqual([]);
    await expect(pill(page, 'For Interview')).toBeVisible();
    // Interviewed went by on the way and was never saved, so Create as borrower was never switched on.
    await expect(createButton(page)).toBeDisabled();
  });

  test('Save status posts the choice exactly once; the pill, the announcement and Create as borrower follow, and "Saved" goes after a moment', async ({ page, backend }) => {
    await open(page, backend);
    await statusSelect(page).selectOption('interviewed');
    // Until it is saved, Create as borrower waits for it.
    await expect(createButton(page)).toBeDisabled();
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST, { exact: true })).toBeVisible();

    await saveStatusButton(page).click();

    await expect(saveStatusButton(page)).toHaveText('Saved');
    expect(backend.calls('setLoanApplicationStatus')).toHaveLength(1);
    expect(backend.calls('setLoanApplicationStatus')[0].variables).toEqual({ id: 2, status: 'interviewed' });
    expect(typeof backend.calls('setLoanApplicationStatus')[0].variables.id).toBe('number');
    await expect(pill(page, 'Interviewed')).toBeVisible();
    await expect(toolbar(page).getByRole('status')).toHaveText('Status saved: Interviewed');
    await expect(statusSelect(page)).toHaveValue('interviewed');
    // The saved status is Interviewed and the branch is assigned: Create as borrower is a link now.
    await expect(createLink(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST)).toHaveCount(0);
    // Nothing is left to save, and "Saved" is for a moment.
    await expect(saveStatusButton(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(saveStatusButton(page)).toHaveText('Save status', { timeout: 8_000 });
    expect(backend.calls('setLoanApplicationStatus'), 'a status was posted again').toHaveLength(1);
  });

  test('switches freely between For Interview, Interviewed and Declined, each save posting its status and showing its pill', async ({ page, backend }) => {
    await open(page, backend);

    const steps: [string, string][] = [
      ['interviewed', 'Interviewed'],
      ['declined', 'Declined'],
      ['for_interview', 'For Interview'],
      ['declined', 'Declined'],
      ['interviewed', 'Interviewed'],
    ];
    for (const [value, label] of steps) {
      await changeStatusTo(page, value);

      await expect(pill(page, label)).toBeVisible();
      await expect(statusSelect(page)).toHaveValue(value);
      await expect(toolbar(page).getByRole('status')).toHaveText(`Status saved: ${label}`);
      expect(backend.calls('setLoanApplicationStatus').at(-1)?.variables).toEqual(
        value === 'declined' ? { id: 2, status: value, reason: DECLINE_REASON } : { id: 2, status: value },
      );
    }
    expect(backend.calls('setLoanApplicationStatus')).toHaveLength(steps.length);
  });

  test('while the server answers the button reads "Saving…" and the select is locked; a double click posts once; the pill and Create follow the answer, not the choice', async ({ page, backend }) => {
    await open(page, backend);
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    backend.overrides.set('setLoanApplicationStatus', async () => {
      await held;
      return { data: { setLoanApplicationStatus: { id: '2', status: 'interviewed', borrower_id: null } } };
    });
    await statusSelect(page).selectOption('interviewed');

    await saveStatusButton(page).dblclick();
    await expect.poll(() => postedStatuses(backend)).toEqual(['interviewed']);

    await expect(saveStatusButton(page)).toHaveText('Saving…');
    await expect(saveStatusButton(page)).toHaveAttribute('aria-busy', 'true');
    await expect(saveStatusButton(page)).toHaveAttribute('aria-disabled', 'true');
    // aria-disabled, not disabled: it keeps the focus. And the select cannot change under the post.
    await expect(saveStatusButton(page)).toBeFocused();
    await expect(statusSelect(page)).toBeDisabled();
    await expect(statusSelect(page)).toHaveValue('interviewed');
    // Playwright will not click what is not "enabled": the further press is forced.
    await saveStatusButton(page).click({ force: true });
    await page.waitForTimeout(500);
    expect(postedStatuses(backend), 'a further press posted again').toEqual(['interviewed']);
    // The page keeps reading the SAVED status until the server has answered.
    await expect(pill(page, 'For Interview')).toBeVisible();
    await expect(createButton(page)).toBeDisabled();
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST, { exact: true })).toBeVisible();

    release();

    await expect(saveStatusButton(page)).toHaveText('Saved');
    await expect(saveStatusButton(page)).toHaveAttribute('aria-busy', 'false');
    await expect(statusSelect(page)).toBeEnabled();
    await expect(pill(page, 'Interviewed')).toBeVisible();
    await expect(createLink(page)).toBeVisible();
    expect(postedStatuses(backend)).toEqual(['interviewed']);
  });

  test('a refusal keeps the choice, is announced once (the toast) and stays beside the button as its description, and Save status can be pressed again', async ({ page, backend }) => {
    await open(page, backend);
    const message = 'This application is already a borrower and can no longer be edited.';
    backend.overrides.set('setLoanApplicationStatus', () => refusal(message));
    await statusSelect(page).selectOption('declined');

    await saveDeclined(page);

    // The words are plain text under the controls: still there when the toast is gone, and the button's description.
    await expect(toolbar(page).getByText(message, { exact: true })).toBeVisible();
    await expect(toastWith(page, message)).toBeVisible();
    await expect(saveStatusButton(page)).toHaveAccessibleDescription(message);
    expect(await announcedBy(page, message), 'the refusal is read more than once').toEqual(['toast']);
    // The choice stays, so it can be tried again or changed back; nothing was saved.
    await expect(statusSelect(page)).toHaveValue('declined');
    await expect(statusSelect(page)).toBeEnabled();
    await expect(saveStatusButton(page)).toHaveText('Save status');
    await expect(saveStatusButton(page)).toHaveAttribute('aria-disabled', 'false');
    await expect(pill(page, 'For Interview')).toBeVisible();
    await expect(toolbar(page).getByRole('status')).toHaveText('');
    await page.waitForTimeout(1_000);
    expect(postedStatuses(backend), 'a refused choice was posted again by itself').toEqual(['declined']);

    backend.overrides.delete('setLoanApplicationStatus');
    await saveDeclined(page);

    await expect(saveStatusButton(page)).toHaveText('Saved');
    expect(postedStatuses(backend)).toEqual(['declined', 'declined']);
    await expect(pill(page, 'Declined')).toBeVisible();
    await expect(toolbar(page).getByText(message)).toHaveCount(0);
    await expect(saveStatusButton(page)).toHaveAccessibleDescription('');
  });

  test('after a refusal, changing the choice back to the saved status clears the error and leaves nothing to save', async ({ page, backend }) => {
    await open(page, backend);
    const message = 'You cannot change this application.';
    backend.overrides.set('setLoanApplicationStatus', () => refusal(message));
    await statusSelect(page).selectOption('declined');
    await saveDeclined(page);
    await expect(toolbar(page).getByText(message, { exact: true })).toBeVisible();

    await statusSelect(page).selectOption('for_interview');

    await expect(toolbar(page).getByText(message)).toHaveCount(0);
    await expect(saveStatusButton(page)).toHaveAccessibleDescription('');
    await expect(saveStatusButton(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST)).toHaveCount(0);
    expect(postedStatuses(backend)).toEqual(['declined']);
  });

  test('"Save the status first." holds Create as borrower while the choice is not saved; "Save your changes first." comes before it; Print is not held', async ({ page, backend }) => {
    await open(page, backend, application({ status: 'interviewed' }));
    await expect(createLink(page)).toBeVisible();

    await statusSelect(page).selectOption('declined');

    await expect(createButton(page)).toBeDisabled();
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST, { exact: true })).toBeVisible();
    await expect(createButton(page)).toHaveAccessibleDescription(SAVE_STATUS_FIRST);
    await expect(createLink(page)).toHaveCount(0);
    await expect(printButton(page)).toHaveAttribute('aria-disabled', 'false');
    // Unsaved changes in the form come first.
    await field(page, 'purpose').fill('Store capital, edited');
    await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST)).toHaveCount(0);
    await field(page, 'purpose').fill('Store capital');
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST, { exact: true })).toBeVisible();
    // Back to the saved status: nothing waits any more.
    await statusSelect(page).selectOption('interviewed');
    await expect(createLink(page)).toBeVisible();
    await expect(toolbar(page).getByText(SAVE_STATUS_FIRST)).toHaveCount(0);
  });

  test('Print works with a status choice that is not saved: the printout does not carry the status', async ({ page, backend }) => {
    await open(page, backend);
    await statusSelect(page).selectOption('declined');

    const [popup] = await Promise.all([page.waitForEvent('popup'), printButton(page).click()]);

    await expect(popup).toHaveURL(`${BACKEND}/storage/pdf/application-2.pdf`, { timeout: 30_000 });
    expect(backend.calls('printLoanApplication')).toHaveLength(1);
    expect(postedStatuses(backend)).toEqual([]);
  });

  test('leaving the page with a choice that is not saved posts nothing', async ({ page, backend }) => {
    await open(page, backend);
    await statusSelect(page).selectOption('declined');

    await page.getByRole('link', { name: 'Back to Applications' }).click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    await page.waitForTimeout(1_000);
    expect(postedStatuses(backend), 'leaving the page saved the status').toEqual([]);
  });

  test('changing the status keeps what has been typed in the form, and posts nothing but the status', async ({ page, backend }) => {
    await open(page, backend);
    await field(page, 'firstname').fill('E2E Not Saved');

    await changeStatusTo(page, 'interviewed');

    await expect(pill(page, 'Interviewed')).toBeVisible();
    await expect(field(page, 'firstname')).toHaveValue('E2E Not Saved');
    expect(updates(backend)).toHaveLength(0);
    expect(backend.calls('setLoanApplicationStatus')).toHaveLength(1);
  });

  test('the status select and its button are named controls, reachable by keyboard in order, and Space on Save status saves', async ({ page, backend }) => {
    await open(page, backend);

    await page.getByRole('link', { name: 'Back to Applications' }).focus();
    await page.keyboard.press('Tab');
    await expect(statusSelect(page)).toBeFocused();
    await expect(statusSelect(page)).toBeEnabled();
    // The select's value is set the way assistive technology sets it; the key itself is not what is under test.
    await statusSelect(page).selectOption('interviewed');
    await page.keyboard.press('Tab');
    await expect(saveStatusButton(page)).toBeFocused();
    await expect(toolbar(page).getByRole('button', { name: 'Save status', exact: true })).toBeVisible();

    await page.keyboard.press('Space');

    await expect.poll(() => postedStatuses(backend)).toEqual(['interviewed']);
    await expect(saveStatusButton(page)).toHaveText('Saved');
    await expect(saveStatusButton(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(printButton(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(createLink(page)).toBeFocused();
  });

  test('the toolbar has ONE live region, in the page before it has anything to say: the status arrives in that node, and a refusal adds no second one', async ({ page, backend }) => {
    await open(page, backend);
    const before = await page.evaluate(() => {
      const regions = Array.from(document.querySelectorAll<HTMLElement>(
        '[aria-label="Application actions"] :is([role="alert"], [role="status"], [role="log"], [aria-live])',
      ));
      for (const region of regions) region.setAttribute('data-e2e-present', '');
      return regions.map((region) => ({ role: region.getAttribute('role'), display: getComputedStyle(region).display }));
    });
    expect(before.map((region) => region.role), 'the toolbar has one live region: the polite one').toEqual(['status']);
    expect(before.map((region) => region.display), 'a region that is display:none until it has text is not reliably announced').not.toContain('none');

    await changeStatusTo(page, 'interviewed');
    await expect(toolbar(page).getByRole('status')).toHaveText('Status saved: Interviewed');
    await expect(toolbar(page).getByRole('status')).toHaveAttribute('data-e2e-present', '');

    const message = 'This application is already a borrower and can no longer be edited.';
    backend.overrides.set('setLoanApplicationStatus', () => refusal(message));
    await statusSelect(page).selectOption('declined');
    await saveDeclined(page);
    await expect(toolbar(page).getByText(message, { exact: true })).toBeVisible();
    await expect(toastWith(page, message)).toBeVisible();
    // The refusal is the toast's to announce: the toolbar still has its one region, and the words are not in it.
    await expect(toolbar(page).locator('[role="alert"], [role="status"], [role="log"], [aria-live]')).toHaveCount(1);
    expect(await announcedBy(page, message)).toEqual(['toast']);
  });

  test('"Status saved: Interviewed" is announced once, by the toolbar\'s polite region; the visible "Saved" on the button is not announced', async ({ page, backend }) => {
    await open(page, backend);

    await changeStatusTo(page, 'interviewed');

    // One polite region carries the words; the button's "Saved" is the sighted copy, and a status raises no toast.
    await expect(toolbar(page).getByRole('status')).toHaveCount(1);
    await expect(toolbar(page).getByRole('status')).toHaveText('Status saved: Interviewed');
    await expect(toolbar(page).getByRole('alert')).toHaveCount(0);
    expect(await announcedBy(page, 'Status saved: Interviewed'), 'the status is read more than once').toEqual(['toolbar']);
    expect(await announcedBy(page, 'Saved'), "the button's Saved is read aloud").toEqual([]);
    await expect(page.locator('.Toastify__toast')).toHaveCount(0);
    await expect(saveStatusButton(page)).not.toHaveAttribute('aria-live', /./);
    await expect(toolbar(page).locator('[aria-live]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Print
// ---------------------------------------------------------------------------

test.describe('6. Print', () => {
  test('calls printLoanApplication with the id as a number and opens the PDF in a window of its own', async ({ page, backend }) => {
    await open(page, backend);

    const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Print Application' }).click()]);

    await expect(popup).toHaveURL(`${BACKEND}/storage/pdf/application-2.pdf`, { timeout: 30_000 });
    expect(backend.calls('printLoanApplication')).toEqual([{ field: 'printLoanApplication', variables: { application_id: 2 } }]);
    expect(typeof backend.calls('printLoanApplication')[0].variables.application_id).toBe('number');
    await expect(page.getByRole('button', { name: 'Print Application' })).toBeVisible();
    await expect(page).toHaveURL(URL_2);
  });

  test('while the PDF is made the button reads "Generating…" and ignores clicks, and only one window opens', async ({ page, backend, context }) => {
    await open(page, backend);
    let release!: () => void;
    backend.printHold = new Promise<void>((resolve) => { release = resolve; });
    const opened: unknown[] = [];
    context.on('page', (popup) => opened.push(popup));

    const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Print Application' }).click()]);

    const busy = page.getByRole('button', { name: 'Generating…' });
    await expect(busy).toBeVisible();
    await expect(busy).toHaveAttribute('aria-disabled', 'true');
    // aria-disabled, not disabled: it keeps the focus, and a click on it must do nothing. Playwright
    // will not click what is not "enabled", so the click is forced.
    await busy.click({ force: true });
    await page.waitForTimeout(500);
    expect(backend.calls('printLoanApplication')).toHaveLength(1);
    expect(opened).toHaveLength(1);

    release();
    await expect(popup).toHaveURL(`${BACKEND}/storage/pdf/application-2.pdf`, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Print Application' })).toBeVisible();
  });

  test('a refusal closes the window and says why', async ({ page, backend }) => {
    await open(page, backend);
    backend.overrides.set('printLoanApplication', () => refusal('Application not found.'));

    const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Print Application' }).click()]);

    await expect(toastWith(page, 'Application not found.')).toBeVisible();
    await expect.poll(() => popup.isClosed()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Create as borrower
// ---------------------------------------------------------------------------

test.describe('7. Create as borrower', () => {
  const button = (page: Page): Locator => toolbar(page).getByRole('button', { name: 'Create as borrower' });
  const link = (page: Page): Locator => toolbar(page).getByRole('link', { name: 'Create as borrower' });

  test('Call Center gets it too (2026-10-07): an Interviewed application on a branch opens New Borrower on it', async ({ page, backend }) => {
    await open(page, backend, application({ status: 'interviewed' }), 'CALLCTR');

    await expect(toolbar(page).getByRole('button', { name: 'Print Application' })).toBeVisible();
    await expect(link(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await expect(toolbar(page).getByText(/first\.?$/)).toHaveCount(0);
    // A saved application runs its own repeat-applicant check: Check Borrower is New application's only.
    await expect(page.getByRole('button', { name: 'Check Borrower', exact: true })).toHaveCount(0);
  });

  test('Call Center is held by the same rules: an application not Interviewed yet says so', async ({ page, backend }) => {
    await open(page, backend, application({ status: 'for_interview' }), 'CALLCTR');

    await expect(button(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(toolbar(page).getByText('Set the status to Interviewed first', { exact: true })).toBeVisible();
  });

  test('an application that already has a borrower is a read-only record, whatever its status says: the rule is New Borrower\'s own', async ({ page, backend }) => {
    // The server edits only an application with no borrower, so every save of this one would be refused.
    await open(page, backend, application({ status: 'interviewed', borrower_id: 77 }));

    const card = page.getByRole('region', { name: 'Borrower created', exact: true });
    await expect(card.getByRole('link', { name: 'Open the borrower' })).toHaveAttribute('href', '/borrowers/77');
    await expect(field(page, 'firstname')).toHaveCount(0);
    await expect(saveButton(page)).toHaveCount(0);
    // The status is what it is and cannot be changed; Create as borrower is not offered; Print still works.
    await expect(statusSelect(page)).toHaveValue('interviewed');
    await expect(statusSelect(page)).toBeDisabled();
    await expect(toolbar(page).getByRole('button', { name: /^Save/ })).toHaveCount(0);
    await expect(createAsBorrower(page)).toHaveCount(0);
    await expect(printButton(page)).toBeEnabled();
    await expect(toolbar(page).getByText(/first\.?$/)).toHaveCount(0);
  });

  test('with no branch it is disabled and says "Assign a branch first", even before the interview', async ({ page, backend }) => {
    await open(page, backend, application({ branch_sub_id: null, branch_sub: null, status: 'for_interview' }));

    await expect(button(page)).toBeDisabled();
    await expect(toolbar(page).getByText('Assign a branch first', { exact: true })).toBeVisible();
    await expect(toolbar(page).getByText('Set the status to Interviewed first')).toHaveCount(0);
    // The reason is the button's description, so a screen reader reads why it does nothing.
    await expect(button(page)).toHaveAccessibleDescription('Assign a branch first');
    await expect(link(page)).toHaveCount(0);
  });

  for (const status of ['for_interview', 'declined'] as const) {
    test(`with a branch but ${status}, it is disabled and says "Set the status to Interviewed first"`, async ({ page, backend }) => {
      await open(page, backend, application({ status }));

      await expect(button(page)).toBeDisabled();
      await expect(toolbar(page).getByText('Set the status to Interviewed first', { exact: true })).toBeVisible();
      await expect(button(page)).toHaveAccessibleDescription('Set the status to Interviewed first');
      await expect(toolbar(page).getByText('Assign a branch first')).toHaveCount(0);
    });
  }

  test('pressing it while disabled does nothing, and it is still reachable by keyboard', async ({ page, backend }) => {
    await open(page, backend, application({ status: 'for_interview' }));

    await button(page).click({ force: true });
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(URL_2);

    await page.getByRole('link', { name: 'Back to Applications' }).focus();
    await page.keyboard.press('Tab');
    await expect(statusSelect(page)).toBeFocused();
    // Save status has nothing to save yet, and is still reachable (aria-disabled, not disabled).
    await page.keyboard.press('Tab');
    await expect(saveStatusButton(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(toolbar(page).getByRole('button', { name: 'Print Application' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(button(page)).toBeFocused();
  });

  test('with a saved branch and Interviewed it is a link to /borrowers/new?application=<id>, and nothing is said against it', async ({ page, backend, context }) => {
    // Only the address matters here: the borrower page itself is not this page's to load.
    await context.route(`${APP}/borrowers/new**`, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>E2E borrower page</title><p>E2E borrower page</p>' }));
    await open(page, backend, application({ status: 'interviewed' }));

    await expect(link(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await expect(toolbar(page).getByText(/first\.?$/)).toHaveCount(0);
    await expect(button(page)).toHaveCount(0);
    await link(page).click();

    await expect(page).toHaveURL(`${APP}/borrowers/new?application=2`, { timeout: 90_000 });
  });

  test('it follows the application: Interviewed turns it on, and a branch saved on the page does too', async ({ page, backend }) => {
    await open(page, backend, application({ branch_sub_id: null, branch_sub: null, status: 'for_interview' }));
    await expect(toolbar(page).getByText('Assign a branch first', { exact: true })).toBeVisible();

    // The status alone is not enough: the branch comes first.
    await changeStatusTo(page, 'interviewed');
    await expect(pill(page, 'Interviewed')).toBeVisible();
    await expect(toolbar(page).getByText('Assign a branch first', { exact: true })).toBeVisible();

    // A branch picked but not saved is not a branch yet, and the borrower page would load the stored
    // application: the toolbar says to save, which comes before the rest ("Assign a branch first").
    await expect.poll(() => pickerOptions(page)).toHaveLength(BRANCHES.length);
    await pickBranch(page, 'E2E Sub-branch B');
    await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
    await expect(toolbar(page).getByText('Assign a branch first')).toHaveCount(0);
    await expect(button(page)).toBeDisabled();
    await expect(button(page)).toHaveAccessibleDescription(SAVE_FIRST);

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect(updates(backend)[0].input.branch_sub_id).toBe(9102);
    await expect(link(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await expect(toolbar(page).getByText('Assign a branch first')).toHaveCount(0);
    await expect(headerOf(page).getByText('E2E Sub-branch B', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. A converted application
// ---------------------------------------------------------------------------

test.describe('8. A converted application', () => {
  const converted = (overrides = {}) => googleFormApplication({ status: 'borrower_created', borrower_id: 77, ...overrides });

  test('is a read-only record: no form, a link to the borrower, a summary, and nothing to press but Print', async ({ page, backend }) => {
    await open(page, backend, converted(), 'OWN');

    await expect(pill(page, 'Borrower created')).toBeVisible();
    const card = page.getByRole('region', { name: 'Borrower created', exact: true });
    await expect(card).toContainText('This application is now a borrower and can no longer be edited.');
    await expect(card.getByRole('link', { name: 'Open the borrower' })).toHaveAttribute('href', '/borrowers/77');
    const summary = page.getByRole('region', { name: 'Application summary' });
    await expect(summary.locator('dt')).toHaveText(['Name', 'Mobile', 'Branch', 'Amount', 'Purpose']);
    // A valid definition list: every child of the <dl> is a <div> holding only its <dt> and <dd> (a nested wrapper is not).
    const strays = await summary.locator('dl').evaluate((dl) =>
      Array.from(dl.children).filter((child) => child.tagName !== 'DIV' || !Array.from(child.children).every((part) => ['DT', 'DD'].includes(part.tagName))).length);
    expect(strays).toBe(0);
    await expect(summary.locator('dd')).toHaveText(['E2E Applicant Two', '09170000002', 'E2E Sub-branch A', '₱15,000.00', 'Store capital']);
    // The name is drawn in capitals, as the header's is (CSS only: the text is as stored).
    expect(await summary.locator('dd').first().locator('span').evaluate((element) => getComputedStyle(element).textTransform)).toBe('uppercase');
    // No form and no Save, and no request for what only the form uses.
    await expect(field(page, 'firstname')).toHaveCount(0);
    await expect(saveButton(page)).toHaveCount(0);
    expect(backend.calls('getApplicationBranches')).toHaveLength(0);
    expect(backend.calls('getChief')).toHaveLength(0);
    // The actions: Status is fixed, Create as borrower is gone, Print stays.
    await expect(statusSelect(page)).toBeDisabled();
    await expect(statusSelect(page)).toHaveValue('borrower_created');
    // Locked: the status is not for choosing, so there is nothing to save, and no button for it.
    await expect(saveStatusButton(page)).toHaveCount(0);
    await expect(toolbar(page).getByRole('button', { name: /^Save/ })).toHaveCount(0);
    await expect(createAsBorrower(page)).toHaveCount(0);
    await expect(toolbar(page).getByText(/first$/)).toHaveCount(0);
    await expect(toolbar(page).getByRole('button', { name: 'Print Application' })).toBeEnabled();
  });

  test('Print still works', async ({ page, backend }) => {
    await open(page, backend, converted(), 'ADM');

    const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Print Application' }).click()]);

    await expect(popup).toHaveURL(`${BACKEND}/storage/pdf/application-2.pdf`, { timeout: 30_000 });
    expect(backend.calls('printLoanApplication')[0].variables).toEqual({ application_id: 2 });
  });

  test('keeps the intake notes beside it, and a blank amount, mobile or branch shows a dash', async ({ page, backend }) => {
    await open(page, backend, converted({ amount_applied: null, contact_no: null, purpose: null, branch_sub_id: null, branch_sub: null }), 'ADM');

    await expect(page.getByRole('complementary', { name: 'Google Form intake' })).toContainText('Amount is above the usual limit');
    const summary = page.getByRole('region', { name: 'Application summary' });
    // A dash for the eye, and "Not provided" for a screen reader.
    await expect(summary.locator('dd')).toHaveText(['E2E Applicant Two', '—Not provided', '—Not provided', '—Not provided', '—Not provided']);
    await expect(summary.locator('dd').nth(1).locator('[aria-hidden="true"]')).toHaveText('—');
  });

  test('with no borrower linked it says so instead of linking', async ({ page, backend }) => {
    await open(page, backend, converted({ borrower_id: null }), 'ADM');

    const card = page.getByRole('region', { name: 'Borrower created', exact: true });
    await expect(card.getByText('The borrower is not linked to this application.')).toBeVisible();
    await expect(card.getByRole('link')).toHaveCount(0);
  });

  test('an application that was open and editable becomes read-only once it is reloaded as converted', async ({ page, backend }) => {
    await open(page, backend, application({ status: 'interviewed' }), 'ADM');
    await expect(field(page, 'firstname')).toBeVisible();

    backend.record = converted();
    await page.reload();

    await expect(page.getByRole('region', { name: 'Borrower created', exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(field(page, 'firstname')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Not found, malformed, failed
// ---------------------------------------------------------------------------

test.describe('9. An application that cannot be shown', () => {
  test('a missing one, or one this user may not see, gets a friendly card with a way back', async ({ page, backend }) => {
    backend.record = null; // the server's answer is "Application not found."
    await signedInAs(page, backend, 'ADM');

    await page.goto('/applications/999', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page.getByRole('heading', { name: 'Application not found' })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("This application doesn't exist or isn't yours to see.")).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Applications' })).toHaveAttribute('href', '/applications');
    await expect(toolbar(page)).toHaveCount(0);
    // Not a failure to retry (Next's own route announcer is an empty alert on every page, so alerts are not counted).
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
    for (const call of backend.calls('getLoanApplication')) expect(call.variables).toEqual({ id: 999 });
  });

  test('the way back works', async ({ page, backend }) => {
    backend.record = null;
    await signedInAs(page, backend, 'CALLCTR');
    await page.goto('/applications/999', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await page.getByRole('link', { name: 'Back to Applications' }).click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
  });

  for (const id of ['abc', '0', '12abc', '99999999999', '1.5']) {
    test(`an address that cannot be an application's number (${id}) is "not found" without asking the server`, async ({ page, backend }) => {
      backend.record = application();
      await signedInAs(page, backend, 'ADM');

      await page.goto(`/applications/${id}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

      await expect(page.getByRole('heading', { name: 'Application not found' })).toBeVisible({ timeout: 90_000 });
      expect(backend.calls('getLoanApplication')).toHaveLength(0);
    });
  }

  test('any other failure is shown as it is, with Retry, which loads the application', async ({ page, backend }) => {
    backend.record = application();
    backend.overrides.set('getLoanApplication', () => refusal('The system is temporarily unavailable. Wait a moment, then retry.'));
    await signedInAs(page, backend, 'ADM');
    await page.goto('/applications/2', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    const alert = page.getByRole('alert').filter({ hasText: 'The system is temporarily unavailable.' });
    await expect(alert).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole('heading', { name: 'Application not found' })).toHaveCount(0);
    await expect(toolbar(page)).toHaveCount(0);

    backend.overrides.delete('getLoanApplication');
    await alert.getByRole('button', { name: 'Retry' }).click();

    await expect(toolbar(page)).toBeVisible({ timeout: 30_000 });
    await expect(field(page, 'firstname')).toHaveValue('E2E');
    await expect(alert).toHaveCount(0);
  });

  test('an answer with no application in it is a failure to retry, not "not found"', async ({ page, backend }) => {
    backend.record = application();
    backend.overrides.set('getLoanApplication', () => ({ data: {} }));
    await signedInAs(page, backend, 'ADM');

    await page.goto('/applications/2', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page.getByRole('alert').filter({ hasText: 'The server returned no application data.' })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole('heading', { name: 'Application not found' })).toHaveCount(0);
  });

  test('an application the server answers with null is "not found"', async ({ page, backend }) => {
    backend.overrides.set('getLoanApplication', () => ({ data: { getLoanApplication: null } }));
    await signedInAs(page, backend, 'ADM');

    await page.goto('/applications/2', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page.getByRole('heading', { name: 'Application not found' })).toBeVisible({ timeout: 90_000 });
  });
});

// ---------------------------------------------------------------------------
// 10. The branch
// ---------------------------------------------------------------------------

test.describe('10. The branch', () => {
  const BRANCH_NAMES = BRANCHES.map((branch) => branch.name);
  /** The read-only branch that branch staff get where the picker would be. */
  const readOnlyBranch = (page: Page): Locator =>
    page.locator('dl').filter({ hasText: 'Only the Call Center, Owner and Admin can change the branch.' });

  for (const role of ['ADM', 'OWN', 'CALLCTR'] as const) {
    test(`${role} picks the branch from getApplicationBranches, and starts on the application's own`, async ({ page, backend }) => {
      await open(page, backend, application(), role);

      await expect(branchPicker(page)).toBeVisible();
      await expect.poll(() => pickerValue(page)).toBe('E2E Sub-branch A');
      expect(await pickerOptions(page)).toEqual(BRANCH_NAMES);
      expect(backend.calls('getApplicationBranches').length).toBeGreaterThan(0);
      await expect(readOnlyBranch(page)).toHaveCount(0);
    });
  }

  test('a branch picked and saved goes as a number, and the header and the picker follow the record; the next save, with the picker untouched, sends none', async ({ page, backend }) => {
    await open(page, backend, application(), 'OWN');
    await expect.poll(() => pickerValue(page)).toBe('E2E Sub-branch A');

    await pickBranch(page, 'E2E Sub-branch C');
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect(updates(backend)[0].input.branch_sub_id).toBe(9103);
    expect(typeof updates(backend)[0].input.branch_sub_id).toBe('number');
    await expect(headerOf(page).getByText('E2E Sub-branch C', { exact: true })).toBeVisible();
    expect(await pickerValue(page)).toBe('E2E Sub-branch C');

    // The picker now holds the branch that was SAVED: a second save with it untouched moves nothing.
    await field(page, 'purpose').fill('Store capital, second thoughts');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(2);
    expect('branch_sub_id' in updates(backend)[1].input).toBe(false);
    await expect(savedNote(page)).toBeVisible();
    await expect(headerOf(page).getByText('E2E Sub-branch C', { exact: true })).toBeVisible();
  });

  // The server moves an application whenever the branch sent differs from the stored one, so a page that
  // went stale must not send its old branch along with an edit that has nothing to do with it.
  for (const role of ['ADM', 'OWN', 'CALLCTR'] as const) {
    test(`${role} saving without touching the picker sends no branch, so a stale page does not undo a colleague's move`, async ({ page, backend }) => {
      await open(page, backend, application(), role);
      await expect.poll(() => pickerValue(page)).toBe('E2E Sub-branch A');
      // A colleague moves the application to Sub-branch B while this page, still on A, is open.
      backend.record = { ...backend.record!, branch_sub_id: 9102, branch_sub: { id: '9102', name: 'E2E Sub-branch B' } };

      await field(page, 'contact_no').fill('09170000099');
      await saveButton(page).click();

      await expect(savedNote(page)).toBeVisible();
      expect('branch_sub_id' in updates(backend)[0].input).toBe(false);
      expect(updates(backend)[0].input.detail.contact_no).toBe('09170000099');
      // Still where the colleague put it: on the server, and in the header, which follows the record.
      expect(backend.record!.branch_sub_id).toBe(9102);
      await expect(headerOf(page).getByText('E2E Sub-branch B', { exact: true })).toBeVisible();
    });
  }

  test('a pick that is put back is not a change: saving sends no branch', async ({ page, backend }) => {
    await open(page, backend, application(), 'ADM');
    await expect.poll(() => pickerValue(page)).toBe('E2E Sub-branch A');

    await pickBranch(page, 'E2E Sub-branch B');
    await pickBranch(page, 'E2E Sub-branch A');
    await field(page, 'contact_no').fill('09170000099');
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect('branch_sub_id' in updates(backend)[0].input).toBe(false);
  });

  test('a save that is refused does not use up the pick: the next one still sends it', async ({ page, backend }) => {
    await open(page, backend, application(), 'ADM');
    await expect.poll(() => pickerValue(page)).toBe('E2E Sub-branch A');
    await pickBranch(page, 'E2E Sub-branch B');
    backend.overrides.set('updateLoanApplication', () => refusal('You cannot move this application to that branch.'));

    await saveButton(page).click();
    await expect(failedNote(page, 'You cannot move this application to that branch.')).toBeVisible();
    backend.overrides.delete('updateLoanApplication');
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect(updates(backend).map((call) => call.input.branch_sub_id)).toEqual([9102, 9102]);
    await expect(headerOf(page).getByText('E2E Sub-branch B', { exact: true })).toBeVisible();
  });

  test('an application nobody has placed stays unplaced until someone picks a branch, even for a user whose home branch is a choice', async ({ page, backend }) => {
    // Admin with two branches, the first their home branch: BorrowerDetails would preselect it, and the first save would assign it.
    await open(page, backend, application({ branch_sub_id: null, branch_sub: null }), 'ADM', [9102, 9103], 9102);
    await expect(headerOf(page).getByText('No branch yet')).toBeVisible();
    await expect.poll(() => pickerOptions(page)).toEqual(BRANCH_NAMES);
    expect(await pickerValue(page)).toBe('');

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect('branch_sub_id' in updates(backend)[0].input).toBe(false);
    await expect(headerOf(page).getByText('No branch yet')).toBeVisible();
  });

  test('branch staff see the branch read-only, no picker, load no branch choices, and send no branch', async ({ page, backend }) => {
    await open(page, backend, application(), 'PROC');

    const branch = readOnlyBranch(page);
    await expect(branch).toBeVisible();
    await expect(branch.locator('dt')).toHaveText('Branch');
    await expect(branch.locator('dd').first()).toHaveText('E2E Sub-branch A');
    await expect(branchPicker(page)).toBeHidden();
    // The test id is what the page hides the picker by: if it ever goes, the picker's own words would show.
    await expect(page.getByText('Select the branch for this application...')).toBeHidden();
    expect(backend.calls('getApplicationBranches')).toHaveLength(0);

    await field(page, 'firstname').fill('E2E Edited');
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect('branch_sub_id' in updates(backend)[0].input).toBe(false);
  });

  test('branch staff with several branches get no picker either (the Details form would draw New Borrower\'s), and send no branch', async ({ page, backend }) => {
    await open(page, backend, application(), 'PROC', [9101, 9102], 9101);

    await expect(readOnlyBranch(page)).toBeVisible();
    // With two branches BorrowerDetails does draw New Borrower's picker (it is in the page, empty): it must not show.
    await expect(branchPicker(page)).toHaveCount(1);
    await expect(branchPicker(page)).toBeHidden();
    await expect(page.getByText('Select the branch for this application...')).toBeHidden();
    expect(backend.calls('getApplicationBranches')).toHaveLength(0);

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect('branch_sub_id' in updates(backend)[0].input).toBe(false);
  });

  test('a branch list that fails to load says so, and Retry loads it', async ({ page, backend }) => {
    backend.overrides.set('getApplicationBranches', () => refusal('Could not load the branches.'));
    await open(page, backend, application(), 'ADM');

    const alert = page.getByRole('alert').filter({ hasText: 'Could not load the branches.' });
    await expect(alert).toBeVisible();
    // The form still saves, and the branch the application already has is left alone: none is sent.
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    expect('branch_sub_id' in updates(backend)[0].input).toBe(false);

    backend.overrides.delete('getApplicationBranches');
    await alert.getByRole('button', { name: 'Retry' }).click();

    await expect(alert).toHaveCount(0);
    expect(await pickerOptions(page)).toEqual(BRANCH_NAMES);
    await expect.poll(() => pickerValue(page)).toBe('E2E Sub-branch A');
  });

  test('the failed list\'s Retry keeps its own height: 36px from md up, 48px on a phone, whatever the form\'s buttons are given', async ({ page, backend }) => {
    backend.overrides.set('getApplicationBranches', () => refusal('Could not load the branches.'));
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, backend, application(), 'ADM');
    const retry = page.getByRole('alert').filter({ hasText: 'Could not load the branches.' }).getByRole('button', { name: 'Retry' });
    await expect(retry).toBeVisible();

    expect((await retry.boundingBox())!.height, 'Retry at 1280px').toBeGreaterThanOrEqual(35.5);

    await page.setViewportSize({ width: 360, height: 800 });
    await expect(async () => {
      expect((await retry.boundingBox())!.height, 'Retry at 360px').toBeGreaterThanOrEqual(47.5);
    }).toPass({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// 11. From the Google Form
// ---------------------------------------------------------------------------

test.describe('11. From the Google Form', () => {
  const panel = (page: Page): Locator => page.getByRole('complementary', { name: 'Google Form intake' });
  const answers = (page: Page): Locator => panel(page).locator('details');
  const flags = (page: Page): Locator => panel(page).getByRole('region', { name: 'Check these' });

  /** Whether the notes come before the form in the page's own order, which is what Tab and a screen reader follow. */
  const notesBeforeForm = (page: Page): Promise<boolean> =>
    page.evaluate(() => {
      const notes = document.querySelector('aside[aria-label="Google Form intake"]');
      const form = document.querySelector('main form');
      return Boolean(notes && form && notes.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING);
    });

  /** The content area's own scroller: the page scrolls inside it, not the window. */
  const scrollContent = (page: Page, top: number): Promise<void> =>
    page.evaluate((to) => {
      let shell = document.querySelector('main')?.parentElement as HTMLElement | null;
      while (shell && !['auto', 'scroll'].includes(getComputedStyle(shell).overflowY)) shell = shell.parentElement;
      shell?.scrollTo(0, to);
    }, top);

  test('shows the flags, then the questions and answers as a definition list in the order asked', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, backend, googleFormApplication());

    await expect(flags(page).getByRole('listitem')).toHaveText(['Amount is above the usual limit', 'Mobile number looks short']);
    const dl = answers(page).locator('dl');
    await expect(dl.locator('dt')).toHaveText([
      'Buong pangalan', 'Mobile number', 'Magkano ang nais ninyong utangin?',
      'Para saan ang gagamitin ng pera? Ilarawan po nang buo ang inyong pangangailangan.', 'Karagdagang sagot',
    ]);
    await expect(dl.locator('dd')).toHaveText([
      'E2E Applicant Two', '09170000002', '15000',
      'Pambili ng paninda sa tindahan ko sa palengke, at pambayad sa upa ng puwesto para sa susunod na tatlong buwan.',
      'No answer',
    ]);
    // The flags come first, and nothing in the panel can be typed into: the form is where an answer is corrected.
    const flagsBox = (await flags(page).boundingBox())!;
    const answersBox = (await answers(page).boundingBox())!;
    expect(flagsBox.y + flagsBox.height).toBeLessThanOrEqual(answersBox.y);
    await expect(panel(page).locator('input, textarea, select')).toHaveCount(0);
  });

  test('from 1280px it sits beside the form, open, and follows the page as it scrolls', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await open(page, backend, googleFormApplication());

    await expect(answers(page)).toHaveAttribute('open', '');
    // First in the page's order (Tab and screen readers meet the flags before a long form), yet in the right-hand column.
    expect(await notesBeforeForm(page), 'the notes come before the form in the page order').toBe(true);
    const form = (await field(page, 'firstname').boundingBox())!;
    const side = (await panel(page).boundingBox())!;
    expect(side.x, 'the panel is to the right of the form').toBeGreaterThan(form.x + form.width);
    // Level with the form's first card (the form element starts 12px above its card: BorrowerDetails' own margin).
    const formTop = await field(page, 'firstname').evaluate((el) => el.closest('form')!.getBoundingClientRect().y);
    expect(Math.abs(side.y - formTop)).toBeLessThan(30);

    await scrollContent(page, 900);

    await expect(async () => {
      const box = (await panel(page).boundingBox())!;
      expect(box.y, 'the panel stays under the header').toBeGreaterThan(70);
      expect(box.y).toBeLessThan(130);
    }).toPass({ timeout: 5_000 });
    expect((await field(page, 'firstname').boundingBox())!.y, 'the form has scrolled away').toBeLessThan(0);
  });

  test('on a phone it comes before the form, collapsed to one row, and opens with a tap or Enter', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, backend, googleFormApplication(), 'CALLCTR');
    const summary = answers(page).locator('summary');

    await expect(answers(page)).not.toHaveAttribute('open', '');
    await expect(summary).toContainText('From the Google Form');
    await expect(summary).toContainText('5 answers');
    await expect(answers(page).locator('dd').first()).toBeHidden();
    // Above the form: the flags are the first thing to know, and the form is long. The page's own order says the same as the screen.
    expect((await panel(page).boundingBox())!.y).toBeLessThan((await field(page, 'firstname').boundingBox())!.y);
    expect(await notesBeforeForm(page), 'the notes come before the form in the page order').toBe(true);
    await expect(flags(page)).toBeVisible();

    await summary.click();
    await expect(answers(page).locator('dd').first()).toBeVisible();
    await summary.click();
    await expect(answers(page).locator('dd').first()).toBeHidden();

    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(answers(page).locator('dd').first()).toBeVisible();
    expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
  });

  test('a long answer wraps inside the panel, at both widths', async ({ page, backend }) => {
    const longWord = 'Napakahabangsagotnawalangputolputolparangtalagangsinasadyakungmaaringlumabasngkahonngpanel1234567890';
    const record = googleFormApplication({ form_answers: [{ question: 'Mahabang sagot', answer: `${longWord} ${longWord}` }] });
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, backend, record, 'ADM');
      // Open from 1280px, collapsed below it.
      if (width < 1280) await answers(page).locator('summary').click();

      const answer = answers(page).locator('dd').first();
      await expect(answer).toBeVisible();
      const [scroll, client] = await answer.evaluate((el) => [el.scrollWidth, el.clientWidth]);
      expect(scroll, `the answer overflows its box at ${width}px`).toBeLessThanOrEqual(client);
      expect(await sidewaysScroll(page), `the page scrolls sideways at ${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test('an application with neither flags nor answers has no panel, and the form has the width', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, backend, application());

    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByText('From the Google Form')).toHaveCount(0);
    await expect(page.getByText('Check these')).toHaveCount(0);
    const form = (await field(page, 'firstname').evaluate((el) => el.closest('form')!.getBoundingClientRect().width));
    expect(form).toBeGreaterThan(900);
  });

  test('flags with no answers show the flags alone; answers with no flags show the answers alone', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, backend, application({ intake_flags: ['Amount is above the usual limit'] }));
    await expect(flags(page).getByRole('listitem')).toHaveText(['Amount is above the usual limit']);
    await expect(answers(page)).toHaveCount(0);

    backend.record = googleFormApplication({ intake_flags: [] });
    await page.reload();
    await expect(answers(page)).toBeVisible({ timeout: 90_000 });
    await expect(flags(page)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 12. Back
// ---------------------------------------------------------------------------

test.describe('12. Back', () => {
  test('the form\'s Back returns to the list without asking, even with changes not saved', async ({ page, backend }) => {
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => { dialogs.push(dialog.message()); void dialog.dismiss(); });
    await open(page, backend);
    await field(page, 'firstname').fill('E2E Not Saved');

    await page.getByRole('button', { name: 'Back', exact: true }).click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    expect(dialogs).toEqual([]);
    expect(updates(backend)).toHaveLength(0);
  });

  test('the toolbar\'s Back is a link to the list', async ({ page, backend }) => {
    await open(page, backend);
    const back = page.getByRole('link', { name: 'Back to Applications' });

    await expect(back).toHaveAttribute('href', '/applications');
    await back.click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
  });
});

// ---------------------------------------------------------------------------
// 13. Phones
// ---------------------------------------------------------------------------

test.describe('13. At 360px', () => {
  /**
   * Every control the page draws (the breadcrumb's link is the layout's, not this page's) that is under 48px
   * tall, and every react-select with no name. A react-select is measured by the box around its value, which is
   * what a finger presses: the search box inside it is 4px wide and not a control of its own, but it is where
   * the name lives.
   */
  const shortControls = (page: Page): Promise<string[]> =>
    page.evaluate(() => {
      const nameOf = (el: HTMLElement): string =>
        (el.getAttribute('aria-label') || el.innerText || (el as HTMLInputElement).name || '').trim().slice(0, 30);
      return Array.from(document.querySelectorAll<HTMLElement>('main a, main button, main select, main summary, main input:not([type="hidden"])'))
        .filter((el) => !el.closest('nav'))
        .map((el) => {
          const selectBox = el.closest<HTMLElement>('.react-select__control');
          return { el, isSelect: selectBox !== null, box: (selectBox ?? el).getBoundingClientRect() };
        })
        .filter(({ box, isSelect }) => box.height > 0 && (isSelect || box.width >= 10))
        .flatMap(({ el, box, isSelect }) => {
          const problems: string[] = [];
          if (box.height < 47.5) problems.push(`${isSelect ? 'react-select' : el.tagName.toLowerCase()} "${nameOf(el)}" is ${Math.round(box.height)}px`);
          if (isSelect && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) problems.push('a react-select has no name');
          return problems;
        });
    });

  const STATES: {
    name: string;
    record: () => ReturnType<typeof application>;
    role: RoleCode;
    setup?: (backend: FakeBackend) => void;
    /** What must be on screen before the page is measured (the repeat-applicant card and note arrive after the page). */
    waitFor?: (page: Page) => Locator;
  }[] = [
    { name: 'Admin, Google Form, Interviewed (panel, picker, Create as borrower)', record: () => googleFormApplication({ status: 'interviewed' }), role: 'ADM' },
    { name: 'Admin, every group filled in (spouse, work, company, four references: the react-selects, Add More, Remove, Save, Back)', record: () => fullApplication(), role: 'ADM' },
    {
      name: 'Admin, the branch list failed to load (Retry)',
      record: () => application(),
      role: 'ADM',
      setup: (backend) => backend.overrides.set('getApplicationBranches', () => refusal('Could not load the branches.')),
    },
    { name: 'Call Center, no branch yet', record: () => application({ branch_sub_id: null, branch_sub: null }), role: 'CALLCTR' },
    { name: 'branch staff (read-only branch), Create as borrower disabled', record: () => application(), role: 'PROC' },
    { name: 'a converted application', record: () => googleFormApplication({ status: 'borrower_created', borrower_id: 77 }), role: 'OWN' },
    {
      name: 'Admin, a repeat applicant: both lines, a problem account, branch names with a very long word',
      record: () => googleFormApplication({ status: 'interviewed' }),
      role: 'ADM',
      setup: (backend) => {
        backend.match = borrowerMatch({
          existsInMyBranches: true, myBranches: ['E2E Sub-branch A', 'Napakahabangpangalanngsangsangayngbangkonawalangputolputol1234567890'], myBranchMatchCount: 2,
          myBranchIsProblem: true, myBranchWorstCutoffs: 3,
          existsElsewhere: true, branches: ['E2E Sub-branch B', 'E2E Sub-branch C Extension Office With A Longer Name'],
        });
      },
      waitFor: repeatCard,
    },
    {
      name: 'Admin, an application on another branch (Create as borrower off, with its long reason)',
      record: () => application({ status: 'interviewed' }),
      role: 'ADM',
      setup: (backend) => {
        backend.myBranches = [9102];
      },
      waitFor: (page) => toolbar(page).getByText(OTHER_BRANCH, { exact: true }),
    },
    {
      name: 'Admin, the repeat-applicant check failed (the note and Retry)',
      record: () => application(),
      role: 'ADM',
      setup: (backend) => backend.overrides.set('getLoanApplicationBorrowerMatch', () => refusal(SERVER_CHECK_FAILED)),
      waitFor: checkNote,
    },
    {
      name: 'Marketing, another branch\'s application (view only: the note, the summary, the status fixed, Print)',
      record: () => googleFormApplication({ can_edit: false, branch_sub_id: 9103, branch_sub: { id: '9103', name: 'E2E Sub-branch C Extension Office With A Longer Name' } }),
      role: 'COL',
      waitFor: (page) => page.getByText(/^View only: /),
    },
    {
      name: 'a converted application with a rejected decision and a long reason',
      record: () =>
        googleFormApplication({
          status: 'borrower_created',
          borrower_id: 77,
          can_edit: false,
          borrower_decision: {
            status: 'rejected',
            reason: 'Napakahabangdahilannawalangputolputol1234567890: kulang ang income at may dalawang aktibong utang pa sa ibang lending',
            decided_at: '2026-10-05 14:45:00',
          },
        }),
      role: 'CALLCTR',
      waitFor: (page) => page.locator('[data-outcome="rejected"]'),
    },
  ];

  for (const state of STATES) {
    test(`${state.name}: nothing scrolls sideways and every control is 48px or taller`, async ({ page, backend }) => {
      // No unfolding card to catch half way: the card's own motion is a quarter of a second.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 360, height: 800 });
      state.setup?.(backend);
      await open(page, backend, state.record(), state.role);
      await expect(page.locator('main').getByRole('heading', { level: 3 }).first()).toBeVisible();
      if (state.waitFor) await expect(state.waitFor(page)).toBeVisible();

      expect(await sidewaysScroll(page), 'the page scrolled sideways').toBeLessThanOrEqual(0);
      expect(await shortControls(page), 'controls under 48px').toEqual([]);
    });
  }

  test('Save status is a full-width 48px row under the select on a phone, in every state, and nothing scrolls sideways', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    backend.overrides.set('setLoanApplicationStatus', async () => {
      await held;
      return { data: { setLoanApplicationStatus: { id: '2', status: 'interviewed', borrower_id: null } } };
    });
    await open(page, backend);

    // Idle, pending, saving and saved: the same full-width row, 48px tall, named, under the select.
    const checkRow = async (name: string): Promise<void> => {
      const select = (await statusSelect(page).boundingBox())!;
      const button = (await saveStatusButton(page).boundingBox())!;
      const print = (await printButton(page).boundingBox())!;
      expect(button.y, `${name}: under the select`).toBeGreaterThanOrEqual(select.y + select.height);
      expect(button.height, `${name}: height`).toBeGreaterThanOrEqual(47.5);
      expect(button.width, `${name}: as wide as the rows under it`).toBeCloseTo(print.width, 0);
      expect(await sidewaysScroll(page), `${name}: the page scrolled sideways`).toBeLessThanOrEqual(0);
      expect(await shortControls(page), `${name}: controls under 48px`).toEqual([]);
    };
    await checkRow('idle');
    await statusSelect(page).selectOption('interviewed');
    await checkRow('pending');
    await saveStatusButton(page).click();
    await expect(saveStatusButton(page)).toHaveText('Saving…');
    await checkRow('saving');
    release();
    await expect(saveStatusButton(page)).toHaveText('Saved');
    await checkRow('saved');
  });

  test('from md up the status controls and the actions stay ONE row at 1280px through a save, as Create as borrower becomes a wider link', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, backend);
    const tops = async (): Promise<Record<string, number>> => {
      const top = async (locator: Locator): Promise<number> => (await locator.boundingBox())!.y;
      return {
        select: await top(statusSelect(page)),
        save: await top(saveStatusButton(page)),
        print: await top(printButton(page)),
        create: await top(toolbar(page).getByText('Create as borrower', { exact: true })),
      };
    };
    const expectOneRow = async (name: string): Promise<void> => {
      const { select, ...others } = await tops();
      for (const [what, y] of Object.entries(others)) expect(Math.abs(y - select), `${name}: ${what} is on another row`).toBeLessThan(12);
    };

    await expectOneRow('idle');
    await statusSelect(page).selectOption('interviewed');
    await expectOneRow('pending');
    await saveStatusButton(page).click();
    // Saved: Create as borrower is a link with an arrow now, 22px wider. Nothing wraps for it.
    await expect(saveStatusButton(page)).toHaveText('Saved');
    await expect(createLink(page)).toBeVisible();
    await expectOneRow('saved');
    await expect(saveStatusButton(page)).toHaveText('Save status', { timeout: 8_000 });
    await expectOneRow('idle again');
  });

  test('every react-select (Branch, Chief, Office, Area, Sub Area) has its name and is 48px tall on a phone, and keeps the form\'s own height from md up', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, backend, fullApplication(), 'ADM');
    const NAMES = ['Branch', 'Chief', 'Office Where Currently Employed', 'Area', 'Sub Area'];

    for (const name of NAMES) {
      await expect(selectNamed(page, name), `the react-select named ${name}`).toHaveCount(1);
      await expect(selectControl(page, name)).toBeVisible();
      expect((await selectControl(page, name).boundingBox())!.height, `${name} at 360px`).toBeGreaterThanOrEqual(47.5);
    }
    // Nothing else on the page is a react-select without one of these names.
    await expect(page.locator('main .react-select__control')).toHaveCount(NAMES.length);

    // The form's own height is left alone from md up: the 48px is the phone's, and only this page asks for it.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(async () => {
      expect((await selectControl(page, 'Chief').boundingBox())!.height, 'Chief at 1280px').toBeLessThan(47.5);
    }).toPass({ timeout: 5_000 });
  });

  test('a long unbroken name or purpose wraps instead of widening the page, in the header, the form and the summary', async ({ page, backend }) => {
    const word = 'Napakahabangsalitangwalangputolputolparangtalagangsinasadyakungmaaringlumabasngkahonngpanel1234567890';
    await page.setViewportSize({ width: 360, height: 800 });
    const base = application();
    await open(page, backend, application({
      full_name: `E2E ${word}`, purpose: word,
      details: { ...base.details, info: { ...base.details.info!, lastname: word, purpose: word } },
    }), 'ADM');
    await expect(headerOf(page, `E2E ${word}`).getByRole('heading')).toBeVisible();
    expect(await sidewaysScroll(page), 'the editable page scrolled sideways').toBeLessThanOrEqual(0);

    backend.record = application({ status: 'borrower_created', borrower_id: 77, full_name: `E2E ${word}`, purpose: word });
    await page.reload();
    await expect(page.getByRole('region', { name: 'Application summary' })).toBeVisible({ timeout: 90_000 });
    expect(await sidewaysScroll(page), 'the converted page scrolled sideways').toBeLessThanOrEqual(0);
  });

  test('the actions are one full-width row each, and the number and the pill share the header\'s top line', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, backend, application({ status: 'interviewed' }), 'ADM');

    const rows = [
      toolbar(page).getByRole('button', { name: 'Print Application' }),
      toolbar(page).getByRole('link', { name: 'Create as borrower' }),
    ];
    const widths = await Promise.all(rows.map(async (row) => (await row.boundingBox())!.width));
    expect(widths[0]).toBeCloseTo(widths[1], 0);
    for (const row of rows) expect((await row.boundingBox())!.height, 'a label wrapped onto two lines').toBeLessThan(49);
    // The number and the pill share the top line, so the pill does not drop to a row of its own.
    const number = (await headerOf(page).getByText('Application #000002', { exact: true }).boundingBox())!;
    const status = (await pill(page, 'Interviewed').boundingBox())!;
    expect(Math.abs(number.y + number.height / 2 - (status.y + status.height / 2))).toBeLessThan(14);
    // The source sits with the date and the branch, under the name, as "Messenger" (its words are for screen readers on a phone).
    const name = (await headerOf(page).getByRole('heading').boundingBox())!;
    const source = (await headerOf(page).getByText('Messenger', { exact: true }).boundingBox())!;
    expect(source.y).toBeGreaterThan(name.y + name.height - 1);
    // sr-only is a 1px clipped box, which Playwright still calls visible: measure it.
    expect((await headerOf(page).getByText('Saan galing', { exact: true }).boundingBox())!.width).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 14. No React warnings
// ---------------------------------------------------------------------------

test('14. React logs no warning while the page loads, saves and changes status', async ({ page, backend }) => {
  const logged: string[] = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()) && !/Failed to load resource/.test(message.text())) logged.push(`${message.type()}: ${message.text()}`);
  });
  await open(page, backend, googleFormApplication());
  await field(page, 'firstname').fill('E2E Edited');
  await saveButton(page).click();
  await expect(savedNote(page)).toBeVisible();
  await changeStatusTo(page, 'interviewed');
  // The save renamed the applicant, and the header is named after the applicant.
  await expect(headerOf(page, 'E2E Edited Applicant Two').getByTitle('Interviewed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Print Application' }).click();
  await expect.poll(() => backend.calls('printLoanApplication').length).toBe(1);

  expect(logged).toEqual([]);
});

// ---------------------------------------------------------------------------
// 15. Unsaved changes
// ---------------------------------------------------------------------------

test.describe('15. Unsaved changes', () => {
  /** Print and Create as borrower are held: neither can be pressed, and both say why (the reason is their description). */
  async function expectHeld(page: Page): Promise<void> {
    // aria-disabled, not disabled: both stay reachable by keyboard, and the reason is their description.
    await expect(printButton(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(createButton(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(printButton(page)).toBeDisabled();
    await expect(createButton(page)).toBeDisabled();
    await expect(createLink(page)).toHaveCount(0);
    await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
    await expect(printButton(page)).toHaveAccessibleDescription(SAVE_FIRST);
    await expect(createButton(page)).toHaveAccessibleDescription(SAVE_FIRST);
  }

  /** Neither is held: Print can be pressed, Create as borrower is its link, and nothing is said against either. */
  async function expectFree(page: Page): Promise<void> {
    await expect(printButton(page)).toBeEnabled();
    await expect(createLink(page)).toBeVisible();
    await expect(createButton(page)).toHaveCount(0);
    await expect(toolbar(page).getByText(SAVE_FIRST)).toHaveCount(0);
  }

  test('a freshly loaded application with every group filled in holds nothing unsaved', async ({ page, backend }) => {
    await open(page, backend, fullApplication());

    // Everything has loaded: the text fields, and each react-select once its list has come.
    await expect(field(page, 'firstname')).toHaveValue('E2E');
    await expect(field(page, 'fullname')).toHaveValue('E2E Spouse');
    await expect(field(page, 'reference.3.name')).toHaveValue('E2E Reference Four');
    await expect(field(page, 'employer')).toHaveValue('E2E Employer');
    const shown = [
      ['Branch', 'E2E Sub-branch A'],
      ['Chief', 'E2E Chief One'],
      ['Office Where Currently Employed', 'E2E Company One'],
      ['Area', 'E2E Area With Sub-areas'],
      ['Sub Area', 'E2E Sub-area One'],
    ] as const;
    for (const [name, value] of shown) await expect(selectControl(page, name)).toContainText(value);

    await expectFree(page);
    // And nothing is normalised a moment later: the comparison runs on every change of the form.
    await page.waitForTimeout(1_000);
    await expectFree(page);
  });

  test('a spouse stored under a civil status that hides it is wiped from the form on load, and that is not an edit', async ({ page, backend }) => {
    // The form clears its spouse fields once it mounts under any other civil status (BorrowerDetails); a real
    // stored application can be like this, and loading it must not read as unsaved.
    const full = fullApplication();
    await open(page, backend, fullApplication({ details: { ...full.details, detail: { ...full.details.detail!, civil_status: 'Single' } } }));
    await expect(field(page, 'civil_status')).toHaveValue('Single');
    await expect(field(page, 'fullname')).toHaveCount(0);

    await expectFree(page);
    await page.waitForTimeout(1_000);
    await expectFree(page);
  });

  test('tabbing through a number field changes nothing: the form takes the text the field shows ("12,500"), and "12500" is still "12500"', async ({ page, backend }) => {
    // Est. Monthly Family Income and the spouse's salary are text on the server, and their fields show the number with separators;
    // react-hook-form takes the shown text when a field loses focus.
    const full = fullApplication();
    await open(page, backend, fullApplication({
      details: {
        ...full.details,
        info: { ...full.details.info!, est_monthly_fam_inc: '12500' },
        spouse: { ...full.details.spouse!, salary: '25000' },
      },
    }));
    await expect(field(page, 'est_monthly_fam_inc')).toHaveValue('12,500');
    await expect(field(page, 'salary')).toHaveValue('25,000');
    await expectFree(page);

    for (const name of ['est_monthly_fam_inc', 'salary']) {
      await field(page, name).focus();
      await page.keyboard.press('Tab');
    }
    // Edit another field and put it back: the form is what it was, so nothing is unsaved.
    await field(page, 'purpose').fill('Store capital, edited');
    await expectHeld(page);
    await field(page, 'purpose').fill('Store capital');
    await expectFree(page);

    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    expect(updates(backend)[0].input.info.est_monthly_fam_inc).toBe('12500');
    expect(updates(backend)[0].input.spouse.salary).toBe('25000');
  });

  test('typing in a field holds both, with the reason, and typing the saved text back frees them', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    await expectFree(page);

    await field(page, 'purpose').fill('Store capital, edited');
    await expectHeld(page);

    await field(page, 'purpose').fill('Store capital');
    await expectFree(page);
  });

  // A pick in a react-select fires no input or change event in the page: only the form's own state knows.
  for (const [name, saved, other] of [
    ['Chief', 'E2E Chief One', 'E2E Chief Two'],
    ['Office Where Currently Employed', 'E2E Company One', 'E2E Company Two'],
    ['Sub Area', 'E2E Sub-area One', 'E2E Sub-area Two'],
    ['Branch', 'E2E Sub-branch A', 'E2E Sub-branch B'],
  ] as const) {
    test(`a pick in ${name} holds both, and picking the saved one again frees them`, async ({ page, backend }) => {
      await open(page, backend, fullApplication());
      await expect(selectControl(page, name)).toContainText(saved);
      await expectFree(page);

      await pickFromSelect(page, name, other);
      await expect(selectControl(page, name)).toContainText(other);
      await expectHeld(page);

      await pickFromSelect(page, name, saved);
      await expectFree(page);
    });
  }

  test('adding a reference holds both, and taking the added row off frees them', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    await expectFree(page);

    await page.getByRole('button', { name: 'Add More', exact: true }).click();
    await expect(field(page, 'reference.4.name')).toBeVisible();
    await expectHeld(page);

    await page.getByRole('button', { name: 'Remove', exact: true }).last().click();
    await expect(field(page, 'reference.4.name')).toHaveCount(0);
    await expectFree(page);
  });

  test('removing a reference holds both', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    await expectFree(page);

    await page.getByRole('button', { name: 'Remove', exact: true }).first().click();
    await expect(field(page, 'reference.3.name')).toHaveCount(0);

    await expectHeld(page);
  });

  test('Save frees them again, and Print then prints what was saved: the save went first', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    await field(page, 'purpose').fill('Store capital, edited');
    await expectHeld(page);

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    await expectFree(page);
    const [popup] = await Promise.all([page.waitForEvent('popup'), printButton(page).click()]);
    await expect(popup).toHaveURL(`${BACKEND}/storage/pdf/application-2.pdf`, { timeout: 30_000 });
    const order = backend.graphql.map((call) => call.field).filter((name) => ['updateLoanApplication', 'printLoanApplication'].includes(name));
    expect(order).toEqual(['updateLoanApplication', 'printLoanApplication']);
  });

  test('a status change alone does not make the form unsaved', async ({ page, backend }) => {
    await open(page, backend, fullApplication({ status: 'for_interview' }));
    await expect(createButton(page)).toBeDisabled();
    await expect(toolbar(page).getByText('Set the status to Interviewed first', { exact: true })).toBeVisible();

    await changeStatusTo(page, 'interviewed');

    await expect(pill(page, 'Interviewed')).toBeVisible();
    await expectFree(page);
    await expect(createLink(page)).toHaveAttribute('href', '/borrowers/new?application=2');
  });

  test('while a save is out both are held, and they are free once it has been answered', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    let release!: () => void;
    backend.saveHold = new Promise<void>((resolve) => { release = resolve; });
    await field(page, 'purpose').fill('Store capital, edited');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(1);
    await expectHeld(page);

    release();

    await expect(savedNote(page)).toBeVisible();
    await expectFree(page);
  });

  test('an edit made while a save is out is not covered by it: what was posted is what is saved, and "Saved." is not said beside "Save your changes first."', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    let release!: () => void;
    backend.saveHold = new Promise<void>((resolve) => { release = resolve; });
    await field(page, 'purpose').fill('Store capital, first');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(1);
    await field(page, 'residence_address').fill('9 Sample Street, typed while the save was out');

    release();

    // The save went through (the toast says so), but the form has moved on from what it posted:
    // the page says "Save your changes first." and nothing under the form says "Saved." beside it.
    await expect(toastWith(page, SAVED)).toBeVisible();
    await expectHeld(page);
    await page.waitForTimeout(300);
    await expect(savedNote(page)).toHaveCount(0);
    expect(updates(backend)[0].input.info.purpose).toBe('Store capital, first');
    expect(updates(backend)[0].input.info.residence_address).toBe('1 Sample Street, Sample Town');

    backend.saveHold = null;
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(2);
    expect(updates(backend)[1].input.info.residence_address).toBe('9 Sample Street, typed while the save was out');
    await expect(savedNote(page)).toBeVisible();
    await expectFree(page);
  });

  test('an edit made while a save is out and put back before it answers leaves nothing unsaved, and "Saved." shows', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    let release!: () => void;
    backend.saveHold = new Promise<void>((resolve) => { release = resolve; });
    await field(page, 'purpose').fill('Store capital, first');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(1);
    await field(page, 'residence_address').fill('9 Sample Street, typed while the save was out');
    await field(page, 'residence_address').fill('1 Sample Street, Sample Town');

    release();

    await expect(savedNote(page)).toBeVisible();
    await expectFree(page);
  });

  test('a refused save is said even when the form was edited while it was out', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    let release!: () => void;
    backend.saveHold = new Promise<void>((resolve) => { release = resolve; });
    backend.overrides.set('updateLoanApplication', async () => {
      await backend.saveHold;
      return refusal('You cannot move this application to that branch.');
    });
    await field(page, 'purpose').fill('Store capital, first');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(1);
    await field(page, 'residence_address').fill('9 Sample Street, typed while the save was out');

    release();

    await expect(failedNote(page, 'You cannot move this application to that branch.')).toBeVisible();
    await expectHeld(page);
  });

  test('a refused save leaves both held: nothing was saved', async ({ page, backend }) => {
    await open(page, backend, fullApplication());
    backend.overrides.set('updateLoanApplication', () => refusal('You cannot move this application to that branch.'));
    await field(page, 'purpose').fill('Store capital, edited');

    await saveButton(page).click();

    await expect(failedNote(page, 'You cannot move this application to that branch.')).toBeVisible();
    await expectHeld(page);
  });

  test('pressing Print or Create as borrower while they are held does nothing, by click or by keyboard', async ({ page, backend, context }) => {
    const windows: unknown[] = [];
    context.on('page', (opened) => windows.push(opened));
    await open(page, backend, fullApplication());
    await field(page, 'purpose').fill('Store capital, edited');
    await expectHeld(page);

    // aria-disabled, not disabled: still reachable by keyboard, and a press must do nothing. Playwright will not
    // click what is not "enabled", so the clicks are forced.
    await printButton(page).click({ force: true });
    await createButton(page).click({ force: true });
    for (const button of [printButton(page), createButton(page)]) {
      await button.focus();
      await expect(button).toBeFocused();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
    }
    await page.waitForTimeout(500);

    expect(backend.calls('printLoanApplication'), 'a printout was asked for').toHaveLength(0);
    expect(windows, 'a window opened').toHaveLength(0);
    await expect(page).toHaveURL(URL_2);
    expect(updates(backend), 'the page saved for them').toHaveLength(0);
  });

  for (const role of ['CALLCTR', 'PROC'] as const) {
    test(`${role}: Print is held too, with the reason, and so is Create as borrower`, async ({ page, backend }) => {
      await open(page, backend, fullApplication(), role);
      await expect(printButton(page)).toBeEnabled();
      await expect(toolbar(page).getByText(SAVE_FIRST)).toHaveCount(0);

      await field(page, 'purpose').fill('Store capital, edited');

      await expect(printButton(page)).toBeDisabled();
      await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
      await expect(printButton(page)).toHaveAccessibleDescription(SAVE_FIRST);
      await expect(createButton(page)).toBeDisabled();
      await expect(createButton(page)).toHaveAccessibleDescription(SAVE_FIRST);

      await saveButton(page).click();
      await expect(savedNote(page)).toBeVisible();
      await expect(printButton(page)).toBeEnabled();
      await expect(toolbar(page).getByText(SAVE_FIRST)).toHaveCount(0);
    });
  }
});

// ---------------------------------------------------------------------------
// 16. The repeat-applicant warning
// ---------------------------------------------------------------------------

test.describe('16. The repeat-applicant warning', () => {
  const MINE = borrowerMatch({ existsInMyBranches: true, myBranches: ['E2E Sub-branch A', 'E2E Sub-branch B'], myBranchMatchCount: 2 });
  const ELSEWHERE_PROBLEM = borrowerMatch({
    existsElsewhere: true, branches: ['E2E Sub-branch C'], isProblem: true, worstCutoffsMissed: 3,
  });

  /** One line of the card's list, by its label. */
  const row = (page: Page, label: string): Locator =>
    repeatCard(page).locator('dl > div').filter({ has: page.locator('dt', { hasText: label }) });
  /** The polite region the card is announced in: always in the page, a div (the form's own notes are paragraphs). */
  const announcer = (page: Page): Locator => page.locator('main div.sr-only[role="status"]');
  const ANNOUNCEMENT = `${REPEAT_TITLE}. Check their record before you continue.`;
  /** Words an "all clear" or a "new applicant" would use: the page must never say them. */
  const ALL_CLEAR = /all clear|no match|not a borrower|new applicant|is new|not yet a borrower/i;

  /** Held answers: look at the page while the check is out, then let it answer. */
  const holdChecks = (backend: FakeBackend): (() => void) => {
    let release!: () => void;
    backend.matchHold = new Promise<void>((resolve) => { release = resolve; });
    return release;
  };

  // --- what it shows ---------------------------------------------------------

  test('a match in my branches shows the card with the count and the branch names, and nothing about other branches or a problem', async ({ page, backend }) => {
    backend.match = MINE;
    await open(page, backend);

    const card = repeatCard(page);
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading', { name: REPEAT_TITLE, level: 3 })).toBeVisible();
    await expect(card.getByText(REPEAT_BODY, { exact: true })).toBeVisible();
    await expect(row(page, 'In your branches').getByText('2 borrowers', { exact: true })).toBeVisible();
    await expect(row(page, 'In your branches').getByRole('listitem')).toHaveText(['E2E Sub-branch A', 'E2E Sub-branch B']);
    await expect(row(page, 'Other branches')).toHaveCount(0);
    await expect(row(page, 'Problem account')).toHaveCount(0);
    // Asked once the record had loaded, with the application's id as a NUMBER.
    expect(checks(backend).length).toBeGreaterThan(0);
    for (const call of checks(backend)) expect(call.variables).toEqual({ id: 2 });
    expect(typeof checks(backend)[0].variables.id).toBe('number');
  });

  test('a match elsewhere with a problem account shows the branch names (no count) and the problem line', async ({ page, backend }) => {
    backend.match = ELSEWHERE_PROBLEM;
    await open(page, backend);

    await expect(repeatCard(page)).toBeVisible();
    await expect(row(page, 'Other branches')).toHaveText(/E2E Sub-branch C/);
    await expect(row(page, 'Other branches').getByRole('listitem')).toHaveText(['E2E Sub-branch C']);
    await expect(row(page, 'Other branches')).not.toContainText(/borrower/i);
    await expect(row(page, 'In your branches')).toHaveCount(0);
    await expect(row(page, 'Problem account')).toContainText('Worst: 3 cut-offs missed');
  });

  test('a match in both shows both lines, and the problem line takes the worst of the flagged sides', async ({ page, backend }) => {
    backend.match = borrowerMatch({
      existsInMyBranches: true, myBranches: ['E2E Sub-branch A'], myBranchMatchCount: 1, myBranchIsProblem: true, myBranchWorstCutoffs: 2,
      existsElsewhere: true, branches: ['E2E Sub-branch B', 'E2E Sub-branch C'], isProblem: true, worstCutoffsMissed: 5,
    });
    await open(page, backend);

    await expect(repeatCard(page)).toBeVisible();
    await expect(row(page, 'In your branches').getByText('1 borrower', { exact: true })).toBeVisible();
    await expect(row(page, 'Other branches').getByRole('listitem')).toHaveText(['E2E Sub-branch B', 'E2E Sub-branch C']);
    await expect(row(page, 'Problem account')).toContainText('Worst: 5 cut-offs missed');
  });

  test('a problem account on one side only counts that side, and one cut-off is singular', async ({ page, backend }) => {
    // The other side's number is not flagged, so it is not read: whatever it holds.
    backend.match = borrowerMatch({
      existsInMyBranches: true, myBranches: ['E2E Sub-branch A'], myBranchMatchCount: 1, myBranchIsProblem: true, myBranchWorstCutoffs: 1,
      existsElsewhere: true, branches: ['E2E Sub-branch B'], isProblem: false, worstCutoffsMissed: 9,
    });
    await open(page, backend);

    await expect(repeatCard(page)).toBeVisible();
    await expect(row(page, 'Problem account')).toContainText('Worst: 1 cut-off missed');
    await expect(row(page, 'Problem account')).not.toContainText('cut-offs');
  });

  test('a problem flag with nothing found anywhere is no warning', async ({ page, backend }) => {
    backend.match = borrowerMatch({ myBranchIsProblem: true, myBranchWorstCutoffs: 4, isProblem: true, worstCutoffsMissed: 4 });
    await open(page, backend);
    await expect.poll(() => checks(backend).length).toBeGreaterThan(0);
    await page.waitForTimeout(500);

    await expect(repeatCard(page)).toHaveCount(0);
    await expect(announcer(page)).toHaveText('');
  });

  for (const role of ['OWN', 'PROC'] as const) {
    test(`${role} is asked too, and sees the card`, async ({ page, backend }) => {
      backend.match = MINE;
      await open(page, backend, application(), role);

      await expect(repeatCard(page)).toBeVisible();
      expect(checks(backend).length).toBeGreaterThan(0);
    });
  }

  // --- what it does not show -------------------------------------------------

  test('no match shows nothing at all, and never an all-clear', async ({ page, backend }) => {
    await open(page, backend);
    await expect.poll(() => checks(backend).length).toBeGreaterThan(0);
    await page.waitForTimeout(500);

    await expect(repeatCard(page)).toHaveCount(0);
    await expect(checkNote(page)).toHaveCount(0);
    await expect(announcer(page)).toHaveText('');
    await expect(page.locator('main')).not.toContainText(ALL_CLEAR);
  });

  test('while the check is out nothing shows, then the card arrives', async ({ page, backend }) => {
    backend.match = MINE;
    const release = holdChecks(backend);
    await open(page, backend);
    await expect.poll(() => checks(backend).length).toBeGreaterThan(0);
    await page.waitForTimeout(300);

    await expect(repeatCard(page)).toHaveCount(0);
    await expect(checkNote(page)).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(ALL_CLEAR);

    release();

    await expect(repeatCard(page)).toBeVisible();
  });

  // --- when the check cannot be made -----------------------------------------

  test('a failed check says so quietly, with Retry, and never that the applicant is new; Retry then shows the card', async ({ page, backend }) => {
    backend.overrides.set('getLoanApplicationBorrowerMatch', () => refusal(SERVER_CHECK_FAILED));
    await open(page, backend);

    await expect(checkNote(page)).toBeVisible();
    await expect(repeatCard(page)).toHaveCount(0);
    // Its own words, not the server's; no alert; no all-clear.
    await expect(page.getByText(SERVER_CHECK_FAILED)).toHaveCount(0);
    await expect(checkNote(page).locator('xpath=ancestor-or-self::*[@role="alert"]')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(ALL_CLEAR);
    const asked = checks(backend).length;

    backend.overrides.delete('getLoanApplicationBorrowerMatch');
    backend.match = ELSEWHERE_PROBLEM;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();

    await expect(repeatCard(page)).toBeVisible();
    await expect(checkNote(page)).toHaveCount(0);
    expect(checks(backend).length).toBeGreaterThan(asked);
  });

  test('a retry that fails again keeps the note, and Retry can be pressed again', async ({ page, backend }) => {
    backend.overrides.set('getLoanApplicationBorrowerMatch', () => refusal(SERVER_CHECK_FAILED));
    await open(page, backend);
    await expect(checkNote(page)).toBeVisible();
    const asked = checks(backend).length;

    await page.getByRole('button', { name: 'Retry', exact: true }).click();

    await expect.poll(() => checks(backend).length).toBeGreaterThan(asked);
    await expect(checkNote(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveAttribute('aria-disabled', 'false');
    await expect(repeatCard(page)).toHaveCount(0);
  });

  test('while a retry is out the note stays, and Retry keeps its place and ignores a second press', async ({ page, backend }) => {
    backend.overrides.set('getLoanApplicationBorrowerMatch', () => refusal(SERVER_CHECK_FAILED));
    await open(page, backend);
    await expect(checkNote(page)).toBeVisible();
    backend.overrides.delete('getLoanApplicationBorrowerMatch');
    backend.match = MINE;
    const release = holdChecks(backend);
    const asked = checks(backend).length;
    const retry = page.getByRole('button', { name: /^(Retry|Checking…)$/ });

    await retry.click();
    await expect.poll(() => checks(backend).length).toBe(asked + 1);

    await expect(retry).toHaveText('Checking…');
    await expect(retry).toHaveAttribute('aria-disabled', 'true');
    await expect(checkNote(page)).toBeVisible();
    await retry.click({ force: true });
    await page.waitForTimeout(300);
    expect(checks(backend).length, 'a second press asked again').toBe(asked + 1);

    release();

    await expect(repeatCard(page)).toBeVisible();
    await expect(checkNote(page)).toHaveCount(0);
  });

  test('an answer without the field is a failed check, not "no match"', async ({ page, backend }) => {
    backend.overrides.set('getLoanApplicationBorrowerMatch', () => ({ data: {} }));
    await open(page, backend);

    await expect(checkNote(page)).toBeVisible();
    await expect(repeatCard(page)).toHaveCount(0);
  });

  test('"Application not found." for the check is the same quiet note, and the form stays', async ({ page, backend }) => {
    backend.overrides.set('getLoanApplicationBorrowerMatch', () => refusal(NOT_FOUND));
    await open(page, backend);

    await expect(checkNote(page)).toBeVisible();
    await expect(field(page, 'firstname')).toHaveValue('E2E');
    await expect(page.getByRole('region', { name: 'Application not found' })).toHaveCount(0);
  });

  // --- when it is asked ------------------------------------------------------

  test('Call Center is asked too: a problem account elsewhere shows the card, which says to let the branch know', async ({ page, backend }) => {
    // Call Center has no branch of its own, so the server puts every match elsewhere (Rafael, 2026-10-05).
    backend.match = ELSEWHERE_PROBLEM;
    await open(page, backend, application({ status: 'interviewed' }), 'CALLCTR');

    const card = repeatCard(page);
    await expect(card).toBeVisible();
    await expect(card.getByText(`${REPEAT_BODY.replace(' Check their record before you continue.', '')} Let the branch know before they continue.`, { exact: true })).toBeVisible();
    await expect(card).not.toContainText('Check their record');
    // "Branches", not "Other branches": Call Center has none of its own.
    const branches = card.locator('dl > div').filter({ has: page.locator('dt', { hasText: /^Branches$/ }) });
    await expect(branches.getByRole('listitem')).toHaveText(['E2E Sub-branch C']);
    await expect(card.locator('dt', { hasText: /other branches/i })).toHaveCount(0);
    await expect(row(page, 'Problem account')).toContainText('Worst: 3 cut-offs missed');
    await expect(announcer(page)).toHaveText(`${REPEAT_TITLE}. Let the branch know before they continue.`);
    expect(checks(backend).length).toBeGreaterThan(0);
    for (const call of checks(backend)) expect(call.variables).toEqual({ id: 2 });
    // The card changes nothing else: the warning blocks nothing, so Call Center's Create as borrower
    // (2026-10-07) is still offered for this Interviewed application.
    await expect(createAsBorrower(page)).toHaveCount(1);
  });

  test('a converted application is never asked: not by its status, and not by a borrower linked whatever the status says', async ({ page, backend }) => {
    backend.match = MINE;
    await open(page, backend, googleFormApplication({ status: 'borrower_created', borrower_id: 77 }), 'ADM');
    await expect(page.getByRole('region', { name: 'Borrower created', exact: true })).toBeVisible();
    await page.waitForTimeout(800);
    expect(checks(backend), 'a converted application sent the check').toHaveLength(0);

    backend.record = application({ status: 'interviewed', borrower_id: 77 });
    await page.reload();
    await expect(page.getByRole('region', { name: 'Borrower created', exact: true })).toBeVisible({ timeout: 90_000 });
    await page.waitForTimeout(800);
    expect(checks(backend), 'an application with a borrower linked sent the check').toHaveLength(0);
    await expect(repeatCard(page)).toHaveCount(0);
  });

  test('a saved edit asks again, and shows what the new name finds; a refused save and a status change do not', async ({ page, backend }) => {
    await open(page, backend);
    await expect.poll(() => checks(backend).length).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    const first = checks(backend).length;
    await expect(repeatCard(page)).toHaveCount(0);

    // A status change is not a correction of the name.
    await changeStatusTo(page, 'interviewed');
    await expect(pill(page, 'Interviewed')).toBeVisible();
    await page.waitForTimeout(500);
    expect(checks(backend).length, 'a status change asked again').toBe(first);

    // A save that was refused saved nothing.
    backend.overrides.set('updateLoanApplication', () => refusal('You cannot move this application to that branch.'));
    await field(page, 'firstname').fill('E2E Corrected');
    await saveButton(page).click();
    await expect(failedNote(page, 'You cannot move this application to that branch.')).toBeVisible();
    await page.waitForTimeout(500);
    expect(checks(backend).length, 'a refused save asked again').toBe(first);

    // A saved one asks again, and the card follows the answer.
    backend.overrides.delete('updateLoanApplication');
    backend.match = MINE;
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    await expect(repeatCard(page)).toBeVisible();
    await expect.poll(() => checks(backend).length).toBe(first + 1);
  });

  test('a correction that stops the match takes the card away', async ({ page, backend }) => {
    backend.match = MINE;
    await open(page, backend);
    await expect(repeatCard(page)).toBeVisible();

    backend.match = noBorrowerMatch();
    await field(page, 'firstname').fill('E2E Corrected');
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    await expect(repeatCard(page)).toHaveCount(0);
    await expect(announcer(page)).toHaveText('');
  });

  // --- how it reads ----------------------------------------------------------

  test('it is announced politely, once, in a region that was already there; a re-check that still matches says nothing more, and nothing is an alert', async ({ page, backend }) => {
    backend.match = MINE;
    const release = holdChecks(backend);
    await open(page, backend);
    await expect.poll(() => checks(backend).length).toBeGreaterThan(0);

    // The region is in the page before there is anything to say; count what happens to it from here.
    await expect(announcer(page)).toHaveCount(1);
    await expect(announcer(page)).toHaveText('');
    await announcer(page).evaluate((node) => {
      const seen = window as unknown as { __announced: number };
      seen.__announced = 0;
      node.setAttribute('data-e2e-present', '');
      new MutationObserver((records) => { seen.__announced += records.length; }).observe(node, { childList: true, characterData: true, subtree: true });
    });

    release();
    await expect(repeatCard(page)).toBeVisible();
    await expect(announcer(page)).toHaveText(ANNOUNCEMENT);
    await expect(announcer(page)).toHaveAttribute('data-e2e-present', '');
    const announced = await page.evaluate(() => (window as unknown as { __announced: number }).__announced);
    expect(announced, 'the words arrived in one change').toBeGreaterThan(0);

    // A save asks again; it still matches. Nothing is said a second time.
    backend.matchHold = null;
    const asked = checks(backend).length;
    await field(page, 'firstname').fill('E2E Corrected');
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    await expect.poll(() => checks(backend).length).toBeGreaterThan(asked);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { __announced: number }).__announced)).toBe(announced);
    await expect(announcer(page)).toHaveAttribute('data-e2e-present', '');

    // A labelled section with a real heading: not an alert, not live itself, and not inside a live region.
    await expect(repeatCard(page).getByRole('heading', { level: 3 })).toHaveText(REPEAT_TITLE);
    await expect(repeatCard(page).locator('[role="alert"], [aria-live]')).toHaveCount(0);
    expect(await repeatCard(page).getAttribute('role')).toBeNull();
    expect(await repeatCard(page).evaluate((node) => node.closest('[role="alert"], [role="status"], [aria-live]'))).toBeNull();
  });

  // --- where the focus goes -------------------------------------------------

  /** Log every focus move from before the page loads: "tag:text" of what took focus. */
  const watchFocus = (page: Page): Promise<void> =>
    page.addInitScript(() => {
      const log: string[] = [];
      (window as unknown as { __focus: string[] }).__focus = log;
      document.addEventListener('focusin', (event) => {
        const element = event.target as HTMLElement;
        log.push(`${element.tagName.toLowerCase()}:${(element.textContent ?? '').trim().slice(0, 40)}`);
      });
    });
  const focused = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { __focus: string[] }).__focus);

  /** The page after a failed check, with the keyboard on Retry and the server about to answer `next`. */
  async function retryWith(page: Page, backend: FakeBackend, next: ReturnType<typeof borrowerMatch>): Promise<void> {
    backend.overrides.set('getLoanApplicationBorrowerMatch', () => refusal(SERVER_CHECK_FAILED));
    await open(page, backend);
    await expect(checkNote(page)).toBeVisible();
    await page.getByRole('button', { name: 'Retry', exact: true }).focus();
    backend.overrides.delete('getLoanApplicationBorrowerMatch');
    backend.match = next;
    await page.keyboard.press('Enter');
  }

  /** A saved edit asks again. The user's own clicks are the only focus moves it may leave in the log (Save is disabled while it saves, so the focus falls to the body: not the page's doing). */
  async function saveAnEdit(page: Page, backend: FakeBackend): Promise<void> {
    const asked = checks(backend).length;
    await field(page, 'firstname').fill('E2E Corrected');
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    await expect.poll(() => checks(backend).length).toBeGreaterThan(asked);
    await page.waitForTimeout(500);
  }

  test('a Retry that brings a match puts the focus on the card heading, once; a later check moves nothing', async ({ page, backend }) => {
    await watchFocus(page);
    await retryWith(page, backend, MINE);

    await expect(repeatCard(page).getByRole('heading', { level: 3 })).toBeFocused();
    expect(await focused(page)).toEqual(['button:Retry', `h3:${REPEAT_TITLE}`]);

    await saveAnEdit(page, backend);
    expect(await focused(page)).toEqual(['button:Retry', `h3:${REPEAT_TITLE}`, 'input:', 'button:Save']);
    expect(await page.evaluate(() => document.activeElement?.tagName), 'a later check took the focus').not.toBe('H3');
  });

  test('a Retry that brings no match puts the focus on the page heading, once; a later check moves nothing', async ({ page, backend }) => {
    await watchFocus(page);
    await retryWith(page, backend, noBorrowerMatch());

    await expect(checkNote(page)).toHaveCount(0);
    await expect(headerOf(page).getByRole('heading')).toBeFocused();
    await expect(repeatCard(page)).toHaveCount(0);
    expect(await focused(page)).toEqual(['button:Retry', 'h3:E2E Applicant Two']);

    // Even a later check that finds a match: the card arrives, and nothing takes the focus from Save.
    backend.match = MINE;
    await saveAnEdit(page, backend);
    await expect(repeatCard(page)).toBeVisible();
    expect(await focused(page)).toEqual(['button:Retry', 'h3:E2E Applicant Two', 'input:', 'button:Save']);
    expect(await page.evaluate(() => document.activeElement?.tagName), 'a later check took the focus').not.toBe('H3');
  });

  test('a Retry that fails again leaves the focus on Retry', async ({ page, backend }) => {
    await watchFocus(page);
    backend.overrides.set('getLoanApplicationBorrowerMatch', () => refusal(SERVER_CHECK_FAILED));
    await open(page, backend);
    await expect(checkNote(page)).toBeVisible();
    const retry = page.getByRole('button', { name: 'Retry', exact: true });
    await retry.focus();
    const asked = checks(backend).length;

    await page.keyboard.press('Enter');

    await expect.poll(() => checks(backend).length).toBeGreaterThan(asked);
    await expect(retry).toHaveAttribute('aria-disabled', 'false');
    await expect(retry).toBeFocused();
    expect(await focused(page)).toEqual(['button:Retry']);
  });

  for (const [what, answer] of [['a match', MINE], ['no match', noBorrowerMatch()]] as const) {
    test(`the first check on load, with ${what}, never takes the focus`, async ({ page, backend }) => {
      await watchFocus(page);
      backend.match = answer;
      await open(page, backend);
      await expect.poll(() => checks(backend).length).toBeGreaterThan(0);
      await page.waitForTimeout(800);

      expect(await focused(page)).toEqual([]);
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });
  }

  // --- how it is built and how it moves --------------------------------------

  test('the card\'s lists are valid lists: every group is a div holding only terms and descriptions (axe: dlitem, definition-list)', async ({ page, backend }) => {
    backend.match = borrowerMatch({
      existsInMyBranches: true, myBranches: ['E2E Sub-branch A'], myBranchMatchCount: 1, myBranchIsProblem: true, myBranchWorstCutoffs: 3,
      existsElsewhere: true, branches: ['E2E Sub-branch B'],
    });
    await open(page, backend);
    await expect(repeatCard(page)).toBeVisible();
    await expect(row(page, 'In your branches')).toHaveCount(1);
    await expect(row(page, 'Other branches')).toHaveCount(1);
    await expect(row(page, 'Problem account')).toHaveCount(1);

    const problems = await repeatCard(page).locator('dl').evaluateAll((lists) =>
      lists.flatMap((list) =>
        Array.from(list.children).flatMap((group) => {
          if (group.tagName !== 'DIV') return [`<${group.tagName.toLowerCase()}> straight in the list`];
          const parts = Array.from(group.children).map((part) => part.tagName);
          const stray = parts.filter((tag) => tag !== 'DT' && tag !== 'DD').map((tag) => `<${tag.toLowerCase()}> in a group`);
          const whole = parts[0] === 'DT' && parts.includes('DD');
          return whole ? stray : [...stray, `a group without a term and then a description: ${parts.join(', ')}`];
        }),
      ),
    );
    expect(problems).toEqual([]);
  });

  /** Record the Element.animate calls that open the card: the page has no other animation of its own. */
  const watchAnimations = (page: Page): Promise<void> =>
    page.addInitScript(() => {
      const calls: { properties: string[]; duration: number }[] = [];
      (window as unknown as { __unfolds: typeof calls }).__unfolds = calls;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (this: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) {
        if (this.tagName === 'SECTION' && this.querySelector('h3')?.textContent === 'This applicant may already be a borrower') {
          calls.push({
            properties: Object.keys((Array.isArray(keyframes) ? keyframes[0] : keyframes) ?? {}),
            duration: Number(typeof options === 'object' ? options.duration : options),
          });
        }
        return animate.call(this, keyframes, options);
      };
    });
  const unfolds = (page: Page): Promise<unknown[]> => page.evaluate(() => (window as unknown as { __unfolds: unknown[] }).__unfolds);

  test('inserting the card starts exactly one animation, which unfolds it; a re-check that still matches starts none', async ({ page, backend }) => {
    await watchAnimations(page);
    backend.match = MINE;
    await open(page, backend);
    await expect(repeatCard(page)).toBeVisible();
    await page.waitForTimeout(600);

    expect(await unfolds(page)).toEqual([{ properties: ['height', 'opacity'], duration: 260 }]);

    await saveAnEdit(page, backend);
    expect(await unfolds(page), 'a re-check opened the card again').toHaveLength(1);
  });

  test('under prefers-reduced-motion: reduce the card starts no animation at all', async ({ page, backend }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await watchAnimations(page);
    backend.match = MINE;
    await open(page, backend);
    await expect(repeatCard(page)).toBeVisible();
    await page.waitForTimeout(600);

    expect(await unfolds(page)).toEqual([]);
    // It is simply there, at its full height.
    expect((await repeatCard(page).boundingBox())!.height).toBeGreaterThan(100);
  });

  test('a very long branch name wraps inside its tag and the card keeps to the screen, at both widths', async ({ page, backend }) => {
    const long = 'Napakahabangpangalanngsangsangayngbangkonawalangputolputol1234567890';
    backend.match = borrowerMatch({
      existsInMyBranches: true, myBranches: [long, `${long}${long}`], myBranchMatchCount: 2, existsElsewhere: true, branches: [long],
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, backend, application(), 'ADM');
      await expect(repeatCard(page)).toBeVisible();

      // The card clips what overflows it, so the page not scrolling sideways proves nothing: measure each tag.
      const card = (await repeatCard(page).boundingBox())!;
      const tags = await repeatCard(page).getByRole('listitem').evaluateAll((items) =>
        items.map((item) => ({ cut: item.scrollWidth > item.clientWidth, right: item.getBoundingClientRect().right })));
      expect(tags).toHaveLength(3);
      for (const tag of tags) {
        expect(tag.cut, `a tag cuts its name at ${width}px`).toBe(false);
        expect(tag.right, `a tag leaves the card at ${width}px`).toBeLessThanOrEqual(card.x + card.width);
      }
      expect(await sidewaysScroll(page), `the page scrolled sideways at ${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test('it changes nothing about Print or Create as borrower', async ({ page, backend }) => {
    backend.match = borrowerMatch({
      existsInMyBranches: true, myBranches: ['E2E Sub-branch A'], myBranchMatchCount: 1, myBranchIsProblem: true, myBranchWorstCutoffs: 2,
      existsElsewhere: true, branches: ['E2E Sub-branch B'],
    });
    await open(page, backend, application({ status: 'interviewed' }));
    await expect(repeatCard(page)).toBeVisible();

    await expect(printButton(page)).toBeEnabled();
    await expect(createLink(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await expect(toolbar(page).getByText(/first\.?$/)).toHaveCount(0);
    const [popup] = await Promise.all([page.waitForEvent('popup'), printButton(page).click()]);
    await expect(popup).toHaveURL(`${BACKEND}/storage/pdf/application-2.pdf`, { timeout: 30_000 });
  });

  test('it sits under the header and the actions and before the form and the notes, in the page order and on the screen', async ({ page, backend }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    backend.match = MINE;
    await open(page, backend, googleFormApplication({ status: 'interviewed' }));
    await expect(repeatCard(page)).toBeVisible();

    const handles = await Promise.all([
      headerOf(page).elementHandle(),
      toolbar(page).elementHandle(),
      repeatCard(page).elementHandle(),
      page.getByRole('complementary', { name: 'Google Form intake' }).elementHandle(),
      page.locator('main form').elementHandle(),
    ]);
    const follows = await page.evaluate(
      ([header, actions, card, notes, form]) => {
        const after = (a: Node | null, b: Node | null) => Boolean(a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
        return { actionsAfterHeader: after(header, actions), cardAfterActions: after(actions, card), notesAfterCard: after(card, notes), formAfterCard: after(card, form) };
      },
      handles,
    );
    expect(follows).toEqual({ actionsAfterHeader: true, cardAfterActions: true, notesAfterCard: true, formAfterCard: true });

    // And on the screen: the card spans the width above both columns; the form and the notes begin below it.
    const card = (await repeatCard(page).boundingBox())!;
    const actions = (await toolbar(page).boundingBox())!;
    const notes = (await page.getByRole('complementary', { name: 'Google Form intake' }).boundingBox())!;
    const form = (await field(page, 'firstname').boundingBox())!;
    expect(card.y).toBeGreaterThanOrEqual(actions.y + actions.height);
    expect(notes.y).toBeGreaterThanOrEqual(card.y + card.height - 1);
    expect(form.y).toBeGreaterThan(card.y + card.height);
    expect(card.x + card.width).toBeGreaterThanOrEqual(notes.x + notes.width - 1);
  });
});

// ---------------------------------------------------------------------------
// 17. Whose branch: Create as borrower
// ---------------------------------------------------------------------------

test.describe('17. Whose branch: Create as borrower', () => {
  const banner = (page: Page): Locator => page.getByRole('note').filter({ hasText: 'Creating a borrower from application' });
  const stopCard = (page: Page, title: string): Locator => page.getByRole('region', { name: title, exact: true });
  const askedForBranches = (backend: FakeBackend) => backend.calls('getMyAccessibleBranchSubs');
  const NEW_BORROWER = `${APP}/borrowers/new?application=2`;
  const openNewBorrower = (page: Page): Promise<unknown> => page.goto('/borrowers/new?application=2', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  /** What Create as borrower opens on an application the user may convert: the banner, and the form started from it. */
  async function expectFormFromApplication(page: Page): Promise<void> {
    await expect(banner(page)).toBeVisible({ timeout: 90_000 });
    await expect(field(page, 'firstname')).toHaveValue('E2E');
    // The applicant's names are prefilled in capitals, so the borrower is filed so.
    await expect(field(page, 'lastname')).toHaveValue('APPLICANT TWO');
    await expect(page.getByRole('region', { name: OTHER_BRANCH_TITLE })).toHaveCount(0);
  }

  // --- the application page --------------------------------------------------

  test('an Admin sees an application on another branch: Create as borrower is off, and says why; unsaved changes still come first', async ({ page, backend }) => {
    backend.myBranches = [9102];
    await open(page, backend, application({ status: 'interviewed' }), 'ADM');

    await expect(createButton(page)).toBeDisabled();
    await expect(toolbar(page).getByText(OTHER_BRANCH, { exact: true })).toBeVisible();
    await expect(createButton(page)).toHaveAccessibleDescription(OTHER_BRANCH);
    await expect(createLink(page)).toHaveCount(0);
    expect(askedForBranches(backend).length).toBeGreaterThan(0);

    await field(page, 'purpose').fill('Store capital, edited');
    await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
    await expect(toolbar(page).getByText(OTHER_BRANCH)).toHaveCount(0);

    await field(page, 'purpose').fill('Store capital');
    await expect(toolbar(page).getByText(OTHER_BRANCH, { exact: true })).toBeVisible();
  });

  test('the branch comes last, as it does on the server: an application not yet interviewed says that first', async ({ page, backend }) => {
    backend.myBranches = [9102];
    await open(page, backend, application({ status: 'for_interview' }), 'ADM');
    await expect(toolbar(page).getByText('Set the status to Interviewed first', { exact: true })).toBeVisible();
    await expect(toolbar(page).getByText(OTHER_BRANCH)).toHaveCount(0);

    await changeStatusTo(page, 'interviewed');

    await expect(pill(page, 'Interviewed')).toBeVisible();
    await expect(toolbar(page).getByText(OTHER_BRANCH, { exact: true })).toBeVisible();
    await expect(toolbar(page).getByText('Set the status to Interviewed first')).toHaveCount(0);
  });

  test('an Admin on their own branch is allowed: Create as borrower opens New Borrower with the banner and the form started from the application', async ({ page, backend }) => {
    backend.myBranches = [9101];
    await open(page, backend, application({ status: 'interviewed' }), 'ADM');
    await expect(createLink(page)).toHaveAttribute('href', '/borrowers/new?application=2');

    await createLink(page).click();

    await expect(page).toHaveURL(NEW_BORROWER, { timeout: 90_000 });
    await expectFormFromApplication(page);
    await expect(field(page, 'contact_no').first()).toHaveValue('09170000002');
    await expect(banner(page).getByRole('link', { name: /View application/ })).toHaveAttribute('href', '/applications/2');
    expect(backend.calls('getLoanApplication').length).toBeGreaterThan(1);
  });

  test('the Owner is never blocked, whatever the branch, and the page does not ask for branches', async ({ page, backend }) => {
    backend.myBranches = [];
    await open(page, backend, application({ status: 'interviewed' }), 'OWN');
    await expect(createLink(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await page.waitForTimeout(500);
    expect(askedForBranches(backend), 'the application page asked the Owner for branches').toHaveLength(0);

    await createLink(page).click();

    await expect(page).toHaveURL(NEW_BORROWER, { timeout: 90_000 });
    await expectFormFromApplication(page);
  });

  test('branch staff are allowed on their own branch (they only see their own)', async ({ page, backend }) => {
    backend.myBranches = [9101];
    await open(page, backend, application({ status: 'interviewed' }), 'PROC');
    await expect(createLink(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await expect.poll(() => askedForBranches(backend).length).toBeGreaterThan(0);

    await createLink(page).click();

    await expect(page).toHaveURL(NEW_BORROWER, { timeout: 90_000 });
    await expectFormFromApplication(page);
  });

  test('a list of branches that does not load blocks nobody: the page and New Borrower go on, and the server still decides', async ({ page, backend }) => {
    backend.myBranches = [9102];
    backend.overrides.set('getMyAccessibleBranchSubs', () => refusal('Could not load the branches.'));
    await open(page, backend, application({ status: 'interviewed' }), 'ADM');
    await expect.poll(() => askedForBranches(backend).length).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    await expect(createLink(page)).toHaveAttribute('href', '/borrowers/new?application=2');
    await expect(toolbar(page).getByText(OTHER_BRANCH)).toHaveCount(0);

    await createLink(page).click();

    await expect(page).toHaveURL(NEW_BORROWER, { timeout: 90_000 });
    await expectFormFromApplication(page);
  });

  // --- New Borrower ----------------------------------------------------------

  test('New Borrower opened on an application of another branch shows a card instead of the form: nothing to type, no photo to store', async ({ page, backend }) => {
    backend.myBranches = [9102];
    backend.record = application({ status: 'interviewed' });
    await signedInAs(page, backend, 'ADM');

    await openNewBorrower(page);

    const stop = stopCard(page, OTHER_BRANCH_TITLE);
    await expect(stop).toBeVisible({ timeout: 90_000 });
    await expect(stop.getByRole('heading', { name: OTHER_BRANCH_TITLE, level: 3 })).toBeVisible();
    await expect(stop).toContainText(OTHER_BRANCH_HINT);
    await expect(stop).toContainText('Application #000002');
    await expect(stop.getByRole('link', { name: 'Open application #000002', exact: true })).toHaveAttribute('href', '/applications/2');
    await expect(field(page, 'firstname')).toHaveCount(0);
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(banner(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
    expect(backend.calls('saveBorrower')).toHaveLength(0);
  });

  test('while the user\'s branches are on their way the form is not drawn at all, and the card follows', async ({ page, backend }) => {
    backend.record = application({ status: 'interviewed' });
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    backend.overrides.set('getMyAccessibleBranchSubs', async () => {
      await held;
      return { data: { getMyAccessibleBranchSubs: [{ id: '9102', branch_id: 91, code: 'E2E-9102', name: 'E2E Sub-branch B', address: '1 Sample Street' }] } };
    });
    await signedInAs(page, backend, 'ADM');
    // Has the form been in the page at any moment? (A card that comes after a flash of the form is too late: a name may be typed.)
    await page.addInitScript(() => {
      const seen = window as unknown as { __formSeen: boolean };
      seen.__formSeen = false;
      new MutationObserver(() => {
        if (document.querySelector('input[name="firstname"]')) seen.__formSeen = true;
      }).observe(document, { subtree: true, childList: true });
    });

    await openNewBorrower(page);
    await expect.poll(() => askedForBranches(backend).length).toBeGreaterThan(0);
    await expect.poll(() => backend.calls('getLoanApplication').length).toBeGreaterThan(0);
    await page.waitForTimeout(800);
    await expect(field(page, 'firstname')).toHaveCount(0);
    await expect(stopCard(page, OTHER_BRANCH_TITLE)).toHaveCount(0);

    release();

    await expect(stopCard(page, OTHER_BRANCH_TITLE)).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => (window as unknown as { __formSeen: boolean }).__formSeen), 'the form was drawn before the card').toBe(false);
  });

  test('plain New Borrower, with no ?application=, is unchanged: the form, no card, no application asked for', async ({ page, backend }) => {
    backend.myBranches = [9102];
    await signedInAs(page, backend, 'ADM');

    await page.goto('/borrowers/new', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(field(page, 'firstname')).toBeVisible({ timeout: 90_000 });
    await expect(banner(page)).toHaveCount(0);
    await expect(page.getByRole('region', { name: OTHER_BRANCH_TITLE })).toHaveCount(0);
    expect(backend.calls('getLoanApplication')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 18. Date applied
// ---------------------------------------------------------------------------

test.describe('18. Date applied', () => {
  const HINT = "From a Sheet paste or a PDF, so it may be off. Google's download will set the exact time.";
  /** What a cleared day is stopped with. */
  const REQUIRED = 'Choose the date applied.';
  const dateField = (page: Page): Locator => field(page, 'submitted_on');
  /** The header's date, as the list words it: "Sep 21, 2026, 8:05 PM", or "Sep 14, 2026" for midnight. */
  const headerDate = (page: Page, text: string): Locator => headerOf(page).getByText(text, { exact: true });
  /** A Google Form application whose time is only a guess: it came from a Sheet paste or a PDF. */
  const pasted = (over: Partial<ReturnType<typeof application>> = {}) => googleFormApplication({ exact_time: false, ...over });

  // --- who sees it -----------------------------------------------------------

  const CASES: { name: string; role: RoleCode; record: () => ReturnType<typeof application>; shown: boolean }[] = [
    { name: 'Admin, a Google Form row from a paste or a PDF', role: 'ADM', record: () => pasted(), shown: true },
    { name: 'Owner, a Google Form row from a paste or a PDF', role: 'OWN', record: () => pasted(), shown: true },
    { name: 'Call Center, a Google Form row from a paste or a PDF', role: 'CALLCTR', record: () => pasted(), shown: true },
    { name: 'branch staff (Processing), the same row', role: 'PROC', record: () => pasted(), shown: false },
    { name: 'Admin, but Google gave the exact time', role: 'ADM', record: () => pasted({ exact_time: true }), shown: false },
    { name: 'Admin, a Facebook application', role: 'ADM', record: () => application({ channel: 'facebook', exact_time: false }), shown: false },
    { name: 'Admin, a walk-in application', role: 'ADM', record: () => application({ channel: 'walk_in', exact_time: false }), shown: false },
    { name: 'Admin, a phone application', role: 'ADM', record: () => application({ channel: 'phone', exact_time: false }), shown: false },
    { name: 'Admin, converted (Borrower created)', role: 'ADM', record: () => pasted({ status: 'borrower_created', borrower_id: 77 }), shown: false },
    { name: 'Admin, a borrower linked whatever the status says', role: 'ADM', record: () => pasted({ status: 'interviewed', borrower_id: 77 }), shown: false },
  ];

  for (const { name, role, record, shown } of CASES) {
    test(`${shown ? 'is offered' : 'is not offered'}: ${name}`, async ({ page, backend }) => {
      await open(page, backend, record(), role);
      // The header's date is everyone's; the form's field is for those who can correct it.
      await expect(headerOf(page).getByText('Sep 21, 2026, 8:05 PM', { exact: true })).toBeVisible();

      if (!shown) {
        await expect(dateField(page)).toHaveCount(0);
        await expect(page.getByText('Date applied', { exact: true })).toHaveCount(0);
        return;
      }
      await expect(dateField(page)).toBeVisible();
      // A labelled date input, with its hint as its description.
      await expect(page.getByLabel('Date applied')).toHaveAttribute('name', 'submitted_on');
      await expect(dateField(page)).toHaveAccessibleName('Date applied');
      await expect(dateField(page)).toHaveAttribute('type', 'date');
      await expect(dateField(page)).toHaveAccessibleDescription(HINT);
      // Required like the form's other starred fields: the asterisk is drawn, and the input says so to assistive technology.
      await expect(dateField(page)).toHaveAttribute('aria-required', 'true');
      expect(await requiredMarks(page)).toEqual(['contact_no', 'firstname', 'lastname', 'submitted_on']);
    });
  }

  // --- what it holds ---------------------------------------------------------

  test('starts on the day the application has, between 2020-01-01 and today in Manila; a fresh load holds nothing unsaved', async ({ page, backend }) => {
    await open(page, backend, pasted({ status: 'interviewed' }));

    await expect(dateField(page)).toHaveValue('2026-09-21');
    await expect(dateField(page)).toHaveAttribute('min', '2020-01-01');
    await expect(dateField(page)).toHaveAttribute('max', manilaToday());
    await expectNothingToSave(page);
    await page.waitForTimeout(800);
    await expectNothingToSave(page);
  });

  test('a day outside the range that the application already holds does not block the form: the bounds widen to it', async ({ page, backend }) => {
    // The browser blocks the WHOLE form when a bounded field holds a value outside its bounds, even an untouched one.
    await open(page, backend, pasted({ submitted_at: '2019-05-03 10:00:00' }));

    await expect(dateField(page)).toHaveValue('2019-05-03');
    await expect(dateField(page)).toHaveAttribute('min', '2019-05-03');
    await field(page, 'purpose').fill('Store capital, edited');
    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    expect('submitted_on' in updates(backend)[0].input).toBe(false);
  });

  // --- saving it -------------------------------------------------------------

  test('the day is posted only when it was changed: not with another edit, and again only when it differs from the day last saved', async ({ page, backend }) => {
    await open(page, backend, pasted());

    // 1. Another edit: the day is not part of it.
    await field(page, 'purpose').fill('Store capital, edited');
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    expect('submitted_on' in updates(backend)[0].input, 'an untouched day was sent').toBe(false);

    // 2. The day changed: sent as Y-m-d, and the header shows it as a date alone (the server stores it at 00:00).
    await dateField(page).fill('2026-09-14');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(2);
    expect(updates(backend)[1].input.submitted_on).toBe('2026-09-14');
    await expect(headerDate(page, 'Sep 14, 2026')).toBeVisible();
    await expect(headerDate(page, 'Sep 21, 2026, 8:05 PM')).toHaveCount(0);

    // 3. Saved: another edit does not send it again.
    await field(page, 'purpose').fill('Store capital, edited again');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(3);
    expect('submitted_on' in updates(backend)[2].input, 'a saved day was sent again').toBe(false);

    // 4. Back to the day it was loaded with: that differs from the day now saved, so it goes.
    await dateField(page).fill('2026-09-21');
    await saveButton(page).click();
    await expect.poll(() => updates(backend).length).toBe(4);
    expect(updates(backend)[3].input.submitted_on).toBe('2026-09-21');
    await expect(headerDate(page, 'Sep 21, 2026')).toBeVisible();
  });

  test('typing the day it already has is no change: nothing unsaved, and nothing sent', async ({ page, backend }) => {
    await open(page, backend, pasted());

    await dateField(page).fill('2026-09-14');
    await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
    await dateField(page).fill('2026-09-21');
    await expectNothingToSave(page);

    await field(page, 'purpose').fill('Store capital, edited');
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    expect('submitted_on' in updates(backend)[0].input).toBe(false);
  });

  test('a changed day is unsaved: Print and Create as borrower wait for Save, and are free after it', async ({ page, backend }) => {
    await open(page, backend, pasted({ status: 'interviewed' }));
    await expectNothingToSave(page);
    await expect(createLink(page)).toBeVisible();

    await dateField(page).fill('2026-09-14');

    await expect(printButton(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(createButton(page)).toBeDisabled();
    await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
    await expect(printButton(page)).toHaveAccessibleDescription(SAVE_FIRST);

    await saveButton(page).click();

    await expect(savedNote(page)).toBeVisible();
    await expectNothingToSave(page);
    await expect(createLink(page)).toBeVisible();
  });

  test('a cleared day is stopped with "Choose the date applied.": the field is flagged and focused, nothing is posted, and choosing a day lets Save through', async ({ page, backend }) => {
    await open(page, backend, pasted());
    await expect(dateField(page)).toHaveAttribute('aria-required', 'true');
    await expect(dateField(page)).not.toHaveAttribute('aria-invalid', /./);

    await dateField(page).fill('');
    // Cleared is a change from the day loaded: the toolbar waits for a Save, which cannot go through yet.
    await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();
    await saveButton(page).click();

    await expect(page.getByText(REQUIRED, { exact: true })).toBeVisible();
    await expect(dateField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(dateField(page)).toHaveAccessibleDescription(`${REQUIRED} ${HINT}`);
    await expect(dateField(page)).toBeFocused();
    await page.waitForTimeout(500);
    expect(updates(backend), 'a cleared day was posted').toHaveLength(0);
    await expect(page.getByTestId('save-note')).toHaveCount(0);
    await expect(headerDate(page, 'Sep 21, 2026, 8:05 PM')).toBeVisible();
    // The message is read with the field, which has the focus: a live copy would read it twice.
    expect(await announcedBy(page, REQUIRED)).toEqual([]);

    await dateField(page).fill('2026-09-14');

    await expect(page.getByText(REQUIRED)).toHaveCount(0);
    await expect(dateField(page)).not.toHaveAttribute('aria-invalid', /./);
    await expect(dateField(page)).toHaveAccessibleDescription(HINT);
    await saveButton(page).click();
    await expect(savedNote(page)).toBeVisible();
    expect(updates(backend).map((call) => call.input.submitted_on)).toEqual(['2026-09-14']);
    await expect(headerDate(page, 'Sep 14, 2026')).toBeVisible();
  });

  test('a cleared day stops the other edits too: Save posts nothing until the field has a day', async ({ page, backend }) => {
    await open(page, backend, pasted());
    await field(page, 'purpose').fill('Store capital, edited');
    await dateField(page).fill('');

    await saveButton(page).click();

    await expect(page.getByText(REQUIRED, { exact: true })).toBeVisible();
    await page.waitForTimeout(500);
    expect(updates(backend), 'an edit was posted without a day').toHaveLength(0);
    await expect(field(page, 'purpose')).toHaveValue('Store capital, edited');

    await dateField(page).fill('2026-09-21');
    await saveButton(page).click();

    // The day it was loaded with is no change, so it is not sent; the other edit is.
    await expect(savedNote(page)).toBeVisible();
    expect(updates(backend)).toHaveLength(1);
    expect('submitted_on' in updates(backend)[0].input).toBe(false);
    expect(updates(backend)[0].input.info.purpose).toBe('Store capital, edited');
  });

  // --- the server says no ----------------------------------------------------

  for (const message of [
    'Only Call Center, Owner or Admin can change the date applied.',
    'Only a Google Form application pasted from the Sheet, added from a PDF or typed in can have its date changed.',
    'Choose a date applied between Jan 1, 2020 and today.',
  ]) {
    test(`a refusal is shown as it was given, the day stays, and the next save sends it again: "${message.slice(0, 40)}…"`, async ({ page, backend }) => {
      await open(page, backend, pasted());
      backend.overrides.set('updateLoanApplication', () => refusal(message));
      await dateField(page).fill('2026-09-14');

      await saveButton(page).click();

      await expect(failedNote(page, message)).toBeVisible();
      await expect(toastWith(page, message)).toBeVisible();
      await expect(dateField(page)).toHaveValue('2026-09-14');
      await expect(headerDate(page, 'Sep 21, 2026, 8:05 PM')).toBeVisible();
      // Nothing was saved: the form still holds a change.
      await expect(toolbar(page).getByText(SAVE_FIRST, { exact: true })).toBeVisible();

      backend.overrides.delete('updateLoanApplication');
      await saveButton(page).click();

      await expect(savedNote(page)).toBeVisible();
      expect(updates(backend).map((call) => call.input.submitted_on)).toEqual(['2026-09-14', '2026-09-14']);
      await expect(headerDate(page, 'Sep 14, 2026')).toBeVisible();
    });
  }

  // --- phones ----------------------------------------------------------------

  test('at 360px it is labelled, 48px tall and inside the screen, and its hint wraps instead of widening the page', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, backend, pasted());

    const input = (await dateField(page).boundingBox())!;
    expect(input.height).toBeGreaterThanOrEqual(47.5);
    expect(input.x).toBeGreaterThanOrEqual(0);
    expect(input.x + input.width).toBeLessThanOrEqual(360);
    const hint = (await page.getByText(HINT, { exact: true }).boundingBox())!;
    expect(hint.x + hint.width).toBeLessThanOrEqual(360);
    expect(hint.height, 'the hint is on more than one line at 360px').toBeGreaterThan(16);
    expect(await sidewaysScroll(page), 'the page scrolled sideways').toBeLessThanOrEqual(0);
    await expect(page.getByLabel('Date applied')).toBeVisible();
  });
});
