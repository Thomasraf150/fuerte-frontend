/**
 * Create as borrower: New Borrower opened from an application
 * (/borrowers/new?application=<id>), stubbed.
 *
 * Pure (no browser): the parameter, the application number, why an application cannot
 * become a borrower yet, the extra variables of a conversion, the Branch picker's one
 * choice, and the two save queries: the plain one is untouched, and the converting one
 * declares the application id non-null, so that a lost id fails closed.
 *
 * In the browser:
 *   1. The banner, and the form prefilled from the application: names, mobile, amount,
 *      references and branch; the Chief, Office, Area and Sub Area it has not got are left
 *      to add. Arriving by a client-side navigation, as the application page's button
 *      does, reads the parameter too.
 *   2. Save posts the application_id and the application's branch (also for a user with
 *      one branch, who sends none today, and who now has a picker locked to it), through
 *      its own mutation, then lands on /applications/<id>, and never asks for the
 *      Borrowers list on the way.
 *   3. What an application already holds (Chief, Office, Area and its Sub Area) shows,
 *      the Area's sub-areas load, the reference rows it does not reach keep the form's own
 *      Positions, and Save sends it all, never with an id. (This takes over
 *      borrower-details-switches.spec.ts, which mounted a second BorrowerDetails to prove
 *      `initialValues` before any page used it.)
 *   4. The branch: the Branch picker offers the application's branch alone, for a user with
 *      one branch or two, so it cannot be pointed at another; that branch, not the user's
 *      home branch, is what Save sends. The picker is named "Branch" for assistive tech,
 *      locked or not.
 *   5. A refused save shows the server's message and keeps the form.
 *   6. Back returns to the application, not the list.
 *   7. An application that cannot become a borrower (not interviewed, declined, no
 *      branch, already a borrower) gets a card with the reason and no form.
 *   8. An application that is not found gets a card; a load that fails says so, with Retry
 *      and a link back to the application beside it, and Retry loads it and moves focus to
 *      the banner. Every outcome of a Retry puts focus on what it shows, once, as it appears:
 *      the banner, the new alert's Retry button if it fails again (never the old alert, which
 *      is still there for a render, and not the new alert itself, which is announced as it
 *      appears), or the card it finds (converted, no branch, not found), from which Tab
 *      reaches its link. A first load into any of them moves no focus, and once the banner
 *      has it, typing and picking an Area never send focus back.
 *   9. An unusable ?application= is ignored: New Borrower as ever, with the plain save.
 *  10. At 360px the banner, the card and the failed-load alert scroll nothing sideways and
 *      their controls are 48px.
 *  11. On an existing borrower (/borrowers/<id>?application=7) the parameter is ignored: no
 *      lookup, no banner, and the plain update.
 *
 * /applications/<id> belongs to another page: it is answered here, so these tests do not
 * depend on it (or on the requests it makes). NO CREDENTIALS AND NO BACKEND: see
 * borrowerFormHarness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/26-new-application --reporter=line
 */
import type { Locator, Page } from '@playwright/test';
import BorrowerQueryMutations from '../../../src/graphql/BorrowerQueryMutations';
import {
  NOT_FOUND_MESSAGE, applicationIdFromSearch, applicationNumber, branchChoicesFor, isNotFoundMessage, notConvertibleReason, parseApplicationId,
  withApplication,
} from '../../../src/utils/convertApplication';
import type { LoanApplicationDetails, LoanApplicationRecord } from '../../../src/utils/DataTypes';
import {
  AREA_WITH_SUB_AREAS,
  BRANCH_SUBS,
  type FakeBackend,
  type GraphqlBody,
  expect,
  fieldErrors,
  optionsOf,
  pick,
  saveButton,
  selectControl,
  selectedText,
  sidewaysScroll,
  signedInAs,
  test,
} from './borrowerFormHarness';

test.setTimeout(180_000);

const APP = 'http://localhost:3000';
const ID = 7;
const NUMBER = '#000007';
const BANNER = `Creating a borrower from application ${NUMBER} — check the details, then add the Chief, Area / Sub-area, Office and a photo.`;
const SAVED = 'E2E stub: borrower saved.';

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

test('the parameter is a positive whole number, or nothing', () => {
  expect(applicationIdFromSearch('?application=7')).toBe(7);
  expect(applicationIdFromSearch('?foo=1&application=12&bar=2')).toBe(12);
  expect(applicationIdFromSearch('?application=007')).toBe(7);
  expect(applicationIdFromSearch('?application=7&application=8')).toBe(7);
  expect(applicationIdFromSearch('?application=2147483647')).toBe(2147483647);

  for (const search of [
    '', '?', '?application', '?application=', '?application=abc', '?application=0', '?application=-3', '?application=7abc',
    '?application=1.5', '?application=1e3', '?application=0x10', '?application=%207', '?application=+7', '?application=7%20',
    '?application=2147483648', '?application=99999999999999999999', '?Application=7', '?applications=7', '?id=7',
  ]) {
    expect(applicationIdFromSearch(search), JSON.stringify(search)).toBeNull();
  }
});

test('parseApplicationId is the one parser behind the page\'s address and ?application=', () => {
  expect(parseApplicationId('7')).toBe(7);
  expect(parseApplicationId('007')).toBe(7);
  expect(parseApplicationId('2147483647')).toBe(2147483647);
  for (const text of [null, undefined, '', '0', '-3', '7abc', '1.5', '1e3', '0x10', ' 7', '7 ', '+7', '2147483648', '99999999999999999999']) {
    expect(parseApplicationId(text), JSON.stringify(text)).toBeNull();
  }
});

test('"Application not found." is one definition: the server\'s sentence, found in whatever case and surroundings', () => {
  expect(NOT_FOUND_MESSAGE).toBe('Application not found.');
  expect(isNotFoundMessage(NOT_FOUND_MESSAGE)).toBe(true);
  expect(isNotFoundMessage('application not found')).toBe(true);
  expect(isNotFoundMessage('Error: Application not found. (id 9)')).toBe(true);
  for (const text of [null, undefined, '', 'Could not load the application. Please try again.', 'Not found']) {
    expect(isNotFoundMessage(text), JSON.stringify(text)).toBe(false);
  }
});

test('the application number is the id to six digits', () => {
  expect(applicationNumber(7)).toBe('#000007');
  expect(applicationNumber(123)).toBe('#000123');
  expect(applicationNumber(1234567)).toBe('#1234567');
});

test('why an application cannot become a borrower yet, in the order the server checks', () => {
  const ready = { status: 'interviewed', branch_sub_id: 9101, borrower_id: null } as const;
  expect(notConvertibleReason(ready)).toBeNull();

  expect(notConvertibleReason({ ...ready, status: 'for_interview' })).toBe('not-interviewed');
  expect(notConvertibleReason({ ...ready, status: 'declined' })).toBe('not-interviewed');
  expect(notConvertibleReason({ ...ready, branch_sub_id: null })).toBe('no-branch');
  expect(notConvertibleReason({ ...ready, status: 'borrower_created', borrower_id: 4321 })).toBe('converted');
  // A borrower id alone means converted, whatever the status says.
  expect(notConvertibleReason({ ...ready, borrower_id: 4321 })).toBe('converted');

  // More than one holds: converted, then no branch, then not interviewed.
  expect(notConvertibleReason({ status: 'borrower_created', branch_sub_id: null, borrower_id: 4321 })).toBe('converted');
  expect(notConvertibleReason({ status: 'for_interview', branch_sub_id: null, borrower_id: null })).toBe('no-branch');
});

test('and, for anyone but the Owner, last of all: an application on a branch the user does not have', () => {
  const ready = { status: 'interviewed', branch_sub_id: 9101, borrower_id: null } as const;
  const mine = { kind: 'some', branchSubIds: [9101, 9102] } as const;
  const elsewhere = { kind: 'some', branchSubIds: [9102, 9103] } as const;

  expect(notConvertibleReason(ready, mine)).toBeNull();
  expect(notConvertibleReason(ready, elsewhere)).toBe('other-branch');
  expect(notConvertibleReason(ready, { kind: 'some', branchSubIds: [] })).toBe('other-branch');
  // The Owner reaches every branch. A list that has not come or did not load, and no list at all, judge nothing.
  expect(notConvertibleReason(ready, { kind: 'any' })).toBeNull();
  expect(notConvertibleReason(ready, { kind: 'unknown' })).toBeNull();
  expect(notConvertibleReason(ready)).toBeNull();

  // The server's order: converted, no branch, not interviewed, and only then the branch.
  expect(notConvertibleReason({ ...ready, borrower_id: 4321 }, elsewhere)).toBe('converted');
  expect(notConvertibleReason({ ...ready, branch_sub_id: null }, elsewhere)).toBe('no-branch');
  expect(notConvertibleReason({ ...ready, status: 'for_interview' }, elsewhere)).toBe('not-interviewed');
});

test('a conversion adds the application and its branch, and changes nothing else, nor its input', () => {
  const plain = {
    inputBorrInfo: { firstname: 'Maria', branch_sub_id: '9102', user_id: 90001 },
    inputBorrDetail: { contact_no: '09170000041' },
  };
  const before = JSON.parse(JSON.stringify(plain));

  const converted = withApplication(plain, { applicationId: ID, branchSubId: 9101 });

  expect(converted).toEqual({
    inputBorrInfo: { firstname: 'Maria', branch_sub_id: '9101', user_id: 90001 },
    inputBorrDetail: { contact_no: '09170000041' },
    application_id: ID,
  });
  expect(plain, 'the plain variables were changed').toEqual(before);
  // The branch goes as text, as the picker's own value does; the application id as the Int it is.
  expect(typeof converted.inputBorrInfo.branch_sub_id).toBe('string');
  expect(typeof converted.application_id).toBe('number');
  // A user with one branch sends none today: the conversion adds it.
  expect(withApplication({ inputBorrInfo: { firstname: 'Maria' } }, { applicationId: ID, branchSubId: 9101 }).inputBorrInfo)
    .toEqual({ firstname: 'Maria', branch_sub_id: '9101' });
});

test('the picker\'s one choice is the application\'s branch, by id and name', () => {
  expect(branchChoicesFor({ branch_sub: { id: '9102', name: 'E2E Sub-branch B' } }, 9102))
    .toEqual([{ value: '9102', label: 'E2E Sub-branch B' }]);
  // The value is the id the save sends, as text, as the picker's own options are; a branch that came without a name is shown by its id.
  expect(branchChoicesFor({ branch_sub: null }, 9102)).toEqual([{ value: '9102', label: 'Branch 9102' }]);
});

test('the plain save query is untouched, and converting has its own', () => {
  const { SAVE_BORROWER_MUTATION, SAVE_BORROWER_FROM_APPLICATION_MUTATION } = BorrowerQueryMutations;

  expect(SAVE_BORROWER_MUTATION).toContain('mutation SaveBorrower(');
  expect(SAVE_BORROWER_MUTATION).not.toContain('application_id');
  expect(SAVE_BORROWER_FROM_APPLICATION_MUTATION).toContain('mutation SaveBorrowerFromApplication(');
  // Declared NON-NULL: an id lost on the way (a dropped undefined, a NaN that JSON makes null)
  // must fail GraphQL's validation, not become a plain save that creates an unlinked borrower.
  expect(SAVE_BORROWER_FROM_APPLICATION_MUTATION).toContain('$application_id: Int!');
  expect(SAVE_BORROWER_FROM_APPLICATION_MUTATION).toContain('application_id: $application_id');
  // Apart from that one argument, the two are the same operation.
  const squash = (query: string) => query.replace(/\s+/g, ' ').replace(/ ?,/g, '');
  expect(squash(SAVE_BORROWER_FROM_APPLICATION_MUTATION).replace('SaveBorrowerFromApplication', 'SaveBorrower')
    .replace(' $application_id: Int!', '').replace(' application_id: $application_id', ''))
    .toBe(squash(SAVE_BORROWER_MUTATION));
});

// ---------------------------------------------------------------------------
// A fictional application, and the page around it
// ---------------------------------------------------------------------------

/** Everything New Borrower requires, but the Chief, Office, Area and Sub Area: what a typed-in application or a Google Form row usually lacks. */
const DETAILS: LoanApplicationDetails = {
  info: {
    firstname: 'Maria', middlename: 'Cruz', lastname: 'Reyes', amount_applied: '20000.00', purpose: 'Tuition',
    chief_id: null, terms_of_payment: '12 months', residence_address: '21 Sample Street, Sample City', is_rent: 0,
    other_source_of_inc: 'Sari-sari store', est_monthly_fam_inc: '25000.00', employment_position: 'Teacher I', gender: 'Female',
  },
  detail: {
    contact_no: '09170000041', email: 'e2e.maria@example.test', dob: '1990-01-15', place_of_birth: 'Sample City', age: 36,
    civil_status: 'Single',
  },
  spouse: null,
  work: {
    company_borrower_id: null, employment_number: 'E2E-0041', area_id: null, sub_area_id: null,
    station: 'Sample Elementary School', term_in_service: '8 years', employment_status: 'Permanent',
    division: 'Sample Division', monthly_gross: '28000.00', monthly_net: '21000.00', office_address: '12 Sample Avenue, Sample City',
  },
  company: { employer: 'E2E Employer', salary: '28000.00', contract_duration: 'Permanent' },
  references: [
    { occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000021' },
    { occupation: 'Administrative Officer/Master Teacher/Head Teacher', name: 'E2E Reference Two', contact_no: '09170000022' },
    { occupation: 'Co-worker', name: 'E2E Reference Three', contact_no: '09170000023' },
  ],
};

/**
 * The same, with the Chief, Office, Area and Sub Area filled in, as an application typed in by
 * staff may be, and only the first reference: the other two rows are left as the form starts them.
 */
const DETAILS_WITH_PICKS: LoanApplicationDetails = {
  ...DETAILS,
  info: { ...DETAILS.info!, chief_id: 9201 },
  work: { ...DETAILS.work!, company_borrower_id: 9302, area_id: 9401, sub_area_id: 9502 },
  references: [DETAILS.references![0]],
};

/** An application on one of the harness's sub-branches, by its position there. */
const onBranch = (index: number) => ({
  branch_sub_id: Number(BRANCH_SUBS[index].id),
  branch_sub: { id: BRANCH_SUBS[index].id, name: BRANCH_SUBS[index].name },
});

const application = (over: Partial<LoanApplicationRecord> = {}): LoanApplicationRecord => ({
  id: String(ID), source: 'manual', channel: 'walk_in', submitted_at: '2026-09-30 10:15:00', location: null,
  ...onBranch(0), status: 'interviewed', borrower_id: null, full_name: 'Maria Cruz Reyes', contact_no: '09170000041',
  amount_applied: '20000.00', purpose: 'Tuition', intake_flags: [], created_at: '2026-09-30 10:15:00',
  details: DETAILS, form_answers: [], exact_time: false, ...over,
});

/** getLoanApplication answers with this application, or with whatever body is given. */
function stubApplication(backend: FakeBackend, answer: LoanApplicationRecord | GraphqlBody | (() => GraphqlBody) = application()): void {
  backend.extraGraphql.set('getLoanApplication', () => {
    if (typeof answer === 'function') return answer();
    return 'id' in answer ? { data: { getLoanApplication: answer } } : answer;
  });
}

/** saveBorrower answers with this result. */
const stubSave = (backend: FakeBackend, success: boolean, message: string): void => {
  backend.extraGraphql.set('saveBorrower', () => ({ data: { saveBorrower: { success, message } } }));
};

/**
 * /applications/<id> is another page's, and answered here: a bare page, for the router to
 * land on. Next asks for it as a client navigation first and falls back to loading it.
 */
async function answerApplicationPage(page: Page): Promise<void> {
  await page.route(
    (url) => url.origin === APP && url.pathname === `/applications/${ID}`,
    (route) => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><head><title>Application</title></head><body><h1>Application page (stub)</h1></body></html>',
    }),
  );
}

/** Every page path the app asks the server for (a client navigation fetches the page it goes to), and every saveBorrower query. */
function watch(page: Page): { paths: string[]; saveQueries: string[] } {
  const seen = { paths: [] as string[], saveQueries: [] as string[] };
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === APP) seen.paths.push(url.pathname);
    if (request.method() === 'POST' && url.pathname === '/fuerte-api') {
      const { query = '' } = request.postDataJSON() ?? {};
      if (/saveBorrower\s*\(/.test(query)) seen.saveQueries.push(query);
    }
  });
  return seen;
}

const formOf = (page: Page): Locator => page.locator('form:has(input[name="firstname"])');

/** Open New Borrower with this query and wait for the form, its picklists and, when there is one, the banner. */
async function open(page: Page, query: string): Promise<Locator> {
  // The dev server compiles a route on its first visit.
  await page.goto(`/borrowers/new${query}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const form = formOf(page);
  await expect(form.locator('input[name="firstname"]')).toBeVisible({ timeout: 90_000 });
  await expect(selectControl(form, 'chief_id')).toBeVisible();
  return form;
}

const openConversion = (page: Page): Promise<Locator> => open(page, `?application=${ID}`);

/** The Chief, Office, Area and Sub Area an application usually lacks, picked as staff do. */
async function addWhatIsMissing(form: Locator, backend: FakeBackend): Promise<void> {
  await pick(form, 'chief_id', 'E2E Chief Two');
  await pick(form, 'company_borrower_id', 'E2E Company One');
  await pick(form, 'area_id', AREA_WITH_SUB_AREAS);
  await expect.poll(() => backend.calls('getOneSubArea').length).toBeGreaterThan(0);
  await pick(form, 'sub_area_id', 'E2E Sub-area Two');
}

const text = (form: Locator, name: string): Locator => form.locator(`input[name="${name}"]`);

/** The card New Borrower shows in place of the form, by its heading. */
const card = (page: Page, title: string): Locator => page.getByRole('region', { name: title, exact: true });

/** One focus the page made: what took it, the words of the alert it sits in (if any), and whether it is in the form. */
interface FocusEntry {
  tag: string;
  role: string | null;
  text: string;
  alertText: string | null;
  inForm: boolean;
}

/**
 * Log every focus the page makes from now on (focusin bubbles, so one listener sees them all),
 * to be read back with focusLog. Call it once per page, after it has loaded.
 */
async function trackFocus(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { e2eFocus: FocusEntry[] };
    w.e2eFocus = [];
    document.addEventListener('focusin', (event) => {
      const el = event.target as HTMLElement;
      w.e2eFocus.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
        alertText: el.closest('[role="alert"]')?.querySelector('p')?.textContent ?? null,
        inForm: el.closest('form') !== null,
      });
    }, true);
  });
}

const focusLog = (page: Page): Promise<FocusEntry[]> =>
  page.evaluate(() => (window as unknown as { e2eFocus: FocusEntry[] }).e2eFocus);

// ---------------------------------------------------------------------------
// 1. The banner, and the form prefilled
// ---------------------------------------------------------------------------

test('1. the banner says where the form came from, and the form starts from the application', async ({ page, backend }) => {
  // A user with two branches, home on the first, and an application on the second: the branch picker shows it.
  stubApplication(backend, application(onBranch(1)));
  await signedInAs(page, backend, [9101, 9102], 9101);
  const form = await openConversion(page);

  const banner = page.getByRole('note');
  await expect(banner).toHaveCount(1);
  await expect(banner.locator('p')).toHaveText(BANNER);
  const way = banner.getByRole('link', { name: `View application ${NUMBER}`, exact: true });
  await expect(way).toHaveAttribute('href', `/applications/${ID}`);
  // Opening the page does not move focus: only a Retry does (8b).
  await expect(banner).not.toBeFocused();

  // It asked for exactly this application (twice in dev: React mounts effects twice).
  const asked = backend.calls('getLoanApplication');
  expect(asked.length).toBeGreaterThan(0);
  for (const call of asked) expect(call.variables).toEqual({ id: ID });

  // Names, mobile, amount, purpose, the rest of the Details, and the references.
  // The applicant's names come in CAPITALS (Fuerte files its borrowers so), the rest as stored.
  await expect(text(form, 'firstname')).toHaveValue('MARIA');
  await expect(text(form, 'middlename')).toHaveValue('CRUZ');
  await expect(text(form, 'lastname')).toHaveValue('REYES');
  await expect(text(form, 'contact_no')).toHaveValue('09170000041');
  await expect(text(form, 'email')).toHaveValue('e2e.maria@example.test');
  await expect(text(form, 'amount_applied')).toHaveValue(/^20,000(\.00)?$/);
  await expect(text(form, 'purpose')).toHaveValue('Tuition');
  await expect(text(form, 'residence_address')).toHaveValue('21 Sample Street, Sample City');
  await expect(form.locator('select[name="gender"]')).toHaveValue('Female');
  await expect(form.locator('select[name="civil_status"]')).toHaveValue('Single');
  await expect(text(form, 'station')).toHaveValue('Sample Elementary School');
  await expect(text(form, 'monthly_gross')).toHaveValue(/^28,000(\.00)?$/);
  await expect(text(form, 'employer')).toHaveValue('E2E Employer');
  const references = DETAILS.references!;
  for (let row = 0; row < references.length; row += 1) {
    await expect(text(form, `reference.${row}.name`)).toHaveValue(references[row].name!);
    await expect(text(form, `reference.${row}.contact_no`)).toHaveValue(references[row].contact_no!);
  }
  await expect(text(form, 'reference.2.occupation')).toHaveValue('Co-worker');
  // The branch is the application's, not the user's home branch.
  await expect(form.getByTestId('borrower-branch-picker')).toBeVisible();
  await expect.poll(() => selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch B');

  // What the banner says is left to add is left: no Chief, Office, Area or Sub Area, and no photo.
  for (const field of ['chief_id', 'company_borrower_id', 'area_id', 'sub_area_id']) {
    expect(await selectedText(form, field), field).toBe('');
  }
  await expect(form.locator('input#photo')).toHaveValue('');
  // Still a New Borrower: the same headings, and nothing saved yet.
  await expect(form.getByRole('heading', { name: 'Check for Existing Borrower', exact: true })).toBeVisible();
  await expect(page.getByText('Draft borrower.')).toBeVisible();
  expect(backend.calls('saveBorrower')).toHaveLength(0);
});

// The application page's Create as borrower is a client-side link, not a page load: the URL
// must already be the new one when New Borrower mounts and reads it.
test('1a. names stored in another case come into the form in capitals, and the borrower is saved in capitals', async ({ page, backend }) => {
  // Married, so the spouse's section shows and its name can be looked at.
  const spouse = {
    work_address: null, occupation: 'Teacher', fullname: 'Pedro dela Cruz', company: null, dept_branch: null,
    length_of_service: null, salary: null, company_contact_person: null, contact_no: '09170000009',
  };
  stubApplication(backend, application({
    full_name: 'maria dela cruz reyes',
    details: {
      ...DETAILS,
      info: { ...DETAILS.info!, firstname: 'maria', middlename: 'dela Cruz', lastname: 'reyes' },
      detail: { ...DETAILS.detail!, civil_status: 'Married' },
      spouse,
    },
  }));
  stubSave(backend, false, 'E2E stub: nothing is saved.');
  await signedInAs(page, backend, [9101]);
  const form = await openConversion(page);

  await expect(text(form, 'firstname')).toHaveValue('MARIA');
  await expect(text(form, 'middlename')).toHaveValue('DELA CRUZ');
  await expect(text(form, 'lastname')).toHaveValue('REYES');
  // Only the applicant's names: the spouse's and the references' keep the case they were stored in.
  await expect(text(form, 'fullname')).toHaveValue('Pedro dela Cruz');
  await expect(text(form, 'reference.0.name')).toHaveValue('E2E Reference One');

  // Back to Single, which needs no spouse details for the save to go through (New Borrower requires them when Married).
  await form.locator('select[name="civil_status"]').selectOption('Single');
  await addWhatIsMissing(form, backend);
  await saveButton(form).click();

  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  expect(backend.calls('saveBorrower')[0].variables.inputBorrInfo).toMatchObject({ firstname: 'MARIA', middlename: 'DELA CRUZ', lastname: 'REYES' });
  expect(backend.calls('saveBorrower')[0].variables.inputBorrReference).toMatchObject({ reference: [{ name: 'E2E Reference One' }, expect.anything(), expect.anything()] });
});

test('1b. arriving by a client-side navigation, as the application page\'s button does, reads the parameter too', async ({ page, backend }) => {
  stubApplication(backend);
  backend.extraGraphql.set('getBorrowers', () => ({
    data: {
      getBorrowers: {
        data: [],
        paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false, count: 0, perPage: 10 },
      },
    },
  }));
  await signedInAs(page, backend, [9101]);
  await page.goto('/borrowers', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('heading', { name: 'Borrowers', exact: true, level: 2 })).toBeVisible({ timeout: 90_000 });

  // Next's router, as the debugging hook exposes it; the marker proves nothing reloaded.
  await page.evaluate((href) => {
    const w = window as unknown as { e2eStayed?: boolean; next: { router: { push: (url: string) => void } } };
    w.e2eStayed = true;
    w.next.router.push(href);
  }, `/borrowers/new?application=${ID}`);

  await expect(page.getByRole('note').locator('p')).toHaveText(BANNER, { timeout: 90_000 });
  await expect(text(formOf(page), 'firstname')).toHaveValue('MARIA');
  expect(await page.evaluate(() => (window as unknown as { e2eStayed?: boolean }).e2eStayed)).toBe(true);
  await expect(page).toHaveURL(`${APP}/borrowers/new?application=${ID}`);
});

// ---------------------------------------------------------------------------
// 2. Save
// ---------------------------------------------------------------------------

test('2. Save posts the application and its branch through its own mutation, and lands on the application', async ({ page, backend }) => {
  stubApplication(backend);
  stubSave(backend, true, SAVED);
  await answerApplicationPage(page);
  await signedInAs(page, backend, [9101]);
  const seen = watch(page);
  const form = await openConversion(page);

  // One branch, which has no picker on a plain New Borrower: converting shows one, locked to the application's branch.
  await expect(form.getByTestId('borrower-branch-picker')).toBeVisible();
  await expect.poll(() => selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch A');
  await expect(form.getByRole('combobox', { name: 'Branch', exact: true })).toBeVisible();
  await addWhatIsMissing(form, backend);
  seen.paths.length = 0; // only what the save itself asks for
  await saveButton(form).click();

  // (The page moves on once the save succeeds, so nothing here reads the form again.)
  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  expect(backend.graphql.map((call) => call.field).slice(-2)).toEqual(['checkBorrowerDuplicate', 'saveBorrower']);
  // The duplicate check runs on the application's branch.
  expect(backend.calls('checkBorrowerDuplicate')).toHaveLength(1);
  expect(backend.calls('checkBorrowerDuplicate')[0].variables).toMatchObject({ firstname: 'MARIA', lastname: 'REYES', branch_sub_id: '9101' });

  const posted = backend.calls('saveBorrower')[0].variables;
  // The operation's own variables, and the one more: application_id, as the Int it is.
  expect(Object.keys(posted).sort()).toEqual([
    'application_id', 'inputBorrCompInfo', 'inputBorrDetail', 'inputBorrInfo', 'inputBorrReference', 'inputBorrSpouseDetail', 'inputBorrWorkBg',
  ]);
  expect(posted.application_id).toBe(ID);
  const info = posted.inputBorrInfo as Record<string, unknown>;
  expect(info.branch_sub_id).toBe('9101');
  // The application's id must never ride along as the borrower's: that would turn the create into an update.
  expect('id' in info, 'inputBorrInfo.id would make this an update of borrower 7').toBe(false);
  expect(info).toMatchObject({ firstname: 'MARIA', middlename: 'CRUZ', lastname: 'REYES', purpose: 'Tuition', chief_id: '9202', user_id: 90001 });
  expect(posted.inputBorrDetail).toMatchObject({ contact_no: '09170000041', email: 'e2e.maria@example.test', dob: '1990-01-15', age: 36 });
  expect(posted.inputBorrWorkBg).toMatchObject({ company_borrower_id: '9301', area_id: '9401', sub_area_id: '9502' });
  expect(posted.inputBorrReference).toEqual({ reference: DETAILS.references!.map((reference) => ({ ...reference })) });

  // Its own operation: the one with the argument, not the plain one.
  expect(seen.saveQueries).toHaveLength(1);
  expect(seen.saveQueries[0]).toContain('mutation SaveBorrowerFromApplication(');
  expect(seen.saveQueries[0]).toContain('$application_id: Int!');

  // On the application, and never on the way through the list: BorrowerDetails also closes
  // the form after a save, and that exit must agree with the save's own.
  await expect(page).toHaveURL(`${APP}/applications/${ID}`, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Application page (stub)' })).toBeVisible();
  expect(seen.paths.filter((path) => path === '/borrowers'), 'the list was asked for after a conversion').toEqual([]);
});

// ---------------------------------------------------------------------------
// 3. What the application already holds (borrower-details-switches.spec.ts, retired)
// ---------------------------------------------------------------------------

test('3. a Chief, Office, Area and Sub Area the application holds show, the sub-areas load, and Save sends them without an id', async ({ page, backend }) => {
  stubApplication(backend, application({ details: DETAILS_WITH_PICKS }));
  stubSave(backend, false, 'E2E stub: nothing is saved.');
  await signedInAs(page, backend, [9101]);
  const form = await openConversion(page);

  await expect.poll(() => selectedText(form, 'chief_id')).toBe('E2E Chief One');
  await expect.poll(() => selectedText(form, 'company_borrower_id')).toBe('E2E Company Two');
  await expect.poll(() => selectedText(form, 'area_id')).toBe(AREA_WITH_SUB_AREAS);
  // The starting Area comes with its sub-areas, as picking it would bring them.
  await expect.poll(() => selectedText(form, 'sub_area_id')).toBe('E2E Sub-area Two');
  const asked = backend.calls('getOneSubArea');
  expect(asked.length).toBeGreaterThan(0);
  for (const call of asked) expect(call.variables).toEqual({ area_id: 9401 });
  // Untouched defaults stay beside them: Own residency, and the two reference rows the application
  // does not reach keep their Positions and are otherwise empty.
  await expect(form.locator('select[name="is_rent"]')).toHaveValue('0');
  await expect(text(form, 'reference.0.name')).toHaveValue('E2E Reference One');
  await expect(text(form, 'reference.1.occupation')).toHaveValue('Administrative Officer/Master Teacher/Head Teacher');
  await expect(text(form, 'reference.2.occupation')).toHaveValue('Co-worker');
  for (const row of [1, 2]) {
    await expect(text(form, `reference.${row}.name`)).toHaveValue('');
    await expect(text(form, `reference.${row}.contact_no`)).toHaveValue('');
  }
  // References need a name and a number each: type the two it lacks.
  await text(form, 'reference.1.name').fill('E2E Reference Two');
  await text(form, 'reference.1.contact_no').fill('09170000022');
  await text(form, 'reference.2.name').fill('E2E Reference Three');
  await text(form, 'reference.2.contact_no').fill('09170000023');

  await saveButton(form).click();

  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  expect(await fieldErrors(form)).toEqual({});
  const posted = backend.calls('saveBorrower')[0].variables;
  const info = posted.inputBorrInfo as Record<string, unknown>;
  expect(info).toMatchObject({ chief_id: '9201', is_rent: 0 });
  expect('id' in info, 'an id would turn the create into an update').toBe(false);
  expect(posted.inputBorrWorkBg).toMatchObject({ company_borrower_id: '9302', area_id: '9401', sub_area_id: '9502' });
  expect(posted.inputBorrReference).toEqual({ reference: DETAILS.references!.map((reference) => ({ ...reference })) });
  expect(posted.application_id).toBe(ID);
});

// ---------------------------------------------------------------------------
// 4. The branch
// ---------------------------------------------------------------------------

// The Branch picker is given the application's branch alone, so for everyone it shows that
// branch and cannot be pointed at another: a user with two branches, who would be offered both
// on a plain New Borrower, and a user with one, who would have no picker at all.
const BRANCH_CASES = [
  {
    name: 'a user with two branches, home on the first: the picker offers only the application\'s, the second',
    assigned: [9101, 9102], application: 1, branch: 'E2E Sub-branch B', sent: '9102',
  },
  {
    name: 'a user with one branch, the application on another: a picker with only the application\'s, and that is what is sent',
    assigned: [9101], application: 2, branch: 'E2E Sub-branch C', sent: '9103',
  },
] as const;

for (const branch of BRANCH_CASES) {
  test(`4. the application's branch wins over the user's home branch: ${branch.name}`, async ({ page, backend }) => {
    stubApplication(backend, application(onBranch(branch.application)));
    stubSave(backend, false, 'E2E stub: nothing is saved.');
    await signedInAs(page, backend, [...branch.assigned], 9101);
    const form = await openConversion(page);

    await expect(form.getByTestId('borrower-branch-picker')).toBeVisible();
    await expect.poll(() => selectedText(form, 'branch_sub_id')).toBe(branch.branch);
    expect(await optionsOf(form, 'branch_sub_id')).toEqual([branch.branch]);
    await addWhatIsMissing(form, backend);
    await saveButton(form).click();

    await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
    expect((backend.calls('saveBorrower')[0].variables.inputBorrInfo as Record<string, unknown>).branch_sub_id).toBe(branch.sent);
    expect(backend.calls('checkBorrowerDuplicate')[0].variables).toMatchObject({ branch_sub_id: branch.sent });
  });
}

test('4b. a user with two branches is offered only the application\'s in the picker, and cannot point it elsewhere', async ({ page, backend }) => {
  stubApplication(backend, application(onBranch(1)));
  stubSave(backend, false, 'E2E stub: nothing is saved.');
  await signedInAs(page, backend, [9101, 9102], 9101);
  const form = await openConversion(page);
  const picker = form.getByTestId('borrower-branch-picker');

  // A plain New Borrower offers this user both of their branches, the home branch first.
  await expect.poll(() => selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch B');
  const offered = await optionsOf(form, 'branch_sub_id');
  expect(offered).toEqual(['E2E Sub-branch B']);
  expect(offered, 'the home branch is offered').not.toContain('E2E Sub-branch A');

  // Choosing the one it offers changes nothing, there is no way to clear it, and typing another
  // branch's name finds nothing to choose.
  await pick(form, 'branch_sub_id', 'E2E Sub-branch B');
  expect(await selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch B');
  await expect(picker.locator('.react-select__clear-indicator')).toHaveCount(0);
  await selectControl(form, 'branch_sub_id').click();
  await page.keyboard.type('Sub-branch A');
  await expect(form.locator('.react-select__option')).toHaveCount(0);
  await expect(picker.locator('.react-select__menu-notice--no-options')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch B');

  // And what is saved is still the application's.
  await addWhatIsMissing(form, backend);
  await saveButton(form).click();
  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  expect((backend.calls('saveBorrower')[0].variables.inputBorrInfo as Record<string, unknown>).branch_sub_id).toBe('9102');
});

test('4c. the Branch picker has an accessible name in both variants: locked while converting, and on a plain New Borrower', async ({ page, backend }) => {
  stubApplication(backend, application(onBranch(1)));
  await signedInAs(page, backend, [9101, 9102], 9101);

  // Converting: the locked picker. (A user with one branch has one now too: test 2 names it.)
  const converting = await openConversion(page);
  await expect(converting.getByRole('combobox', { name: 'Branch', exact: true })).toBeVisible();

  // A plain New Borrower for a user with two branches: the same name, as the visible label says.
  const plain = await open(page, '');
  await expect(plain.getByRole('combobox', { name: 'Branch', exact: true })).toBeVisible();
  await expect(plain.getByRole('combobox', { name: 'Branch', exact: true })).toHaveCount(1);
});

// ---------------------------------------------------------------------------
// 5. A refused save
// ---------------------------------------------------------------------------

test('5. a refused save shows the server\'s message, and the form stays as it was', async ({ page, backend }) => {
  const refusal = 'Set this application to Interviewed first.';
  stubApplication(backend);
  stubSave(backend, false, refusal);
  await answerApplicationPage(page);
  await signedInAs(page, backend, [9101]);
  const seen = watch(page);
  const form = await openConversion(page);

  await addWhatIsMissing(form, backend);
  seen.paths.length = 0;
  await saveButton(form).click();

  await expect(page.getByRole('alert').filter({ hasText: refusal })).toBeVisible({ timeout: 30_000 });
  expect(backend.calls('saveBorrower')).toHaveLength(1);
  expect(backend.calls('saveBorrower')[0].variables.application_id).toBe(ID);
  // Still here, with everything typed and picked, and the button ready to try again.
  await expect(page).toHaveURL(`${APP}/borrowers/new?application=${ID}`);
  await expect(text(form, 'firstname')).toHaveValue('MARIA');
  expect(await selectedText(form, 'chief_id')).toBe('E2E Chief Two');
  expect(await selectedText(form, 'sub_area_id')).toBe('E2E Sub-area Two');
  await expect(saveButton(form)).toBeEnabled();
  await expect(page.getByRole('note')).toBeVisible();
  expect(seen.paths.filter((path) => path === '/borrowers' || path === `/applications/${ID}`), 'a refused save went somewhere').toEqual([]);
});

// ---------------------------------------------------------------------------
// 6. Back
// ---------------------------------------------------------------------------

test('6. Back returns to the application, not the list', async ({ page, backend }) => {
  stubApplication(backend);
  await answerApplicationPage(page);
  await signedInAs(page, backend, [9101]);
  const seen = watch(page);
  const form = await openConversion(page);

  seen.paths.length = 0;
  await form.getByRole('button', { name: 'Back', exact: true }).click();

  await expect(page).toHaveURL(`${APP}/applications/${ID}`, { timeout: 30_000 });
  expect(seen.paths.filter((path) => path === '/borrowers')).toEqual([]);
  expect(backend.calls('saveBorrower')).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// 7. An application that cannot become a borrower yet
// ---------------------------------------------------------------------------

const NOT_READY = [
  { name: 'for interview', over: { status: 'for_interview' }, title: 'Set this application to Interviewed first' },
  { name: 'declined', over: { status: 'declined' }, title: 'Set this application to Interviewed first' },
  { name: 'interviewed, with no branch', over: { branch_sub_id: null, branch_sub: null }, title: 'Assign a branch to this application first' },
  { name: 'already a borrower', over: { status: 'borrower_created', borrower_id: 4321 }, title: 'This application is already a borrower' },
] as const;

for (const notReady of NOT_READY) {
  test(`7. ${notReady.name}: a card says why, links to the application, and there is no form`, async ({ page, backend }) => {
    stubApplication(backend, application(notReady.over as Partial<LoanApplicationRecord>));
    await signedInAs(page, backend, [9101]);
    await page.goto(`/borrowers/new?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

    const stop = card(page, notReady.title);
    await expect(stop).toBeVisible({ timeout: 90_000 });
    await expect(stop.getByRole('heading', { name: notReady.title, exact: true })).toBeVisible();
    await expect(stop).toContainText(`Application ${NUMBER}`);
    await expect(stop.getByRole('link', { name: `Open application ${NUMBER}`, exact: true })).toHaveAttribute('href', `/applications/${ID}`);
    // Opening the page does not move focus: only a Retry does (8d).
    await expect(stop).not.toBeFocused();
    // No form, no banner, nothing to save.
    await expect(formOf(page)).toHaveCount(0);
    await expect(page.getByRole('note')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
    expect(backend.calls('saveBorrower')).toHaveLength(0);
    expect(backend.calls('checkBorrowerDuplicate')).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// 8. Not found, and a load that fails
// ---------------------------------------------------------------------------

test('8. an application that is not found gets a card, with a way back to Applications and no form', async ({ page, backend }) => {
  stubApplication(backend, { data: { getLoanApplication: null }, errors: [{ message: 'Application not found.' }] });
  await signedInAs(page, backend, [9101]);
  await page.goto(`/borrowers/new?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const stop = card(page, 'Application not found');
  await expect(stop).toBeVisible({ timeout: 90_000 });
  await expect(stop).toContainText(`Application ${NUMBER}`);
  await expect(stop.getByRole('link', { name: 'Back to Applications', exact: true })).toHaveAttribute('href', '/applications');
  // Opening the page does not move focus: only a Retry does (8d).
  await expect(stop).not.toBeFocused();
  await expect(formOf(page)).toHaveCount(0);
  await expect(page.getByRole('note')).toHaveCount(0);
  expect(backend.calls('saveBorrower')).toHaveLength(0);
});

test('8b. a load that fails says so, with Retry and a way back to the application beside it, and Retry opens the form', async ({ page, backend }) => {
  let broken = true;
  stubApplication(backend, () => (broken
    ? { errors: [{ message: 'The server hit a snag.' }] }
    : { data: { getLoanApplication: application() } }));
  await signedInAs(page, backend, [9101]);
  await page.goto(`/borrowers/new?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const alert = page.getByRole('alert').filter({ hasText: 'The server hit a snag.' });
  await expect(alert).toBeVisible({ timeout: 90_000 });
  await expect(formOf(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Application not found' })).toHaveCount(0);
  // Beside Retry, in the same alert: the way back to the application.
  await expect(alert.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(alert.getByRole('link', { name: `Open application ${NUMBER}`, exact: true })).toHaveAttribute('href', `/applications/${ID}`);

  broken = false;
  await alert.getByRole('button', { name: 'Retry', exact: true }).click();

  await expect(page.getByRole('note').locator('p')).toHaveText(BANNER, { timeout: 30_000 });
  await expect(text(formOf(page), 'firstname')).toHaveValue('MARIA');
  await expect(alert).toHaveCount(0);
  // The Retry button the keyboard was on is gone: focus goes to the banner, not to the body.
  await expect(page.getByRole('note')).toBeFocused();

  // It took the focus once, as it appeared. What the user does next is theirs: typing, picking an Area
  // (which loads its sub-areas) and typing again never sends focus back to the banner.
  const form = formOf(page);
  await trackFocus(page);
  const purpose = text(form, 'purpose');
  await purpose.click();
  await page.keyboard.press('End'); // a click puts the caret where it lands, not at the end
  await purpose.pressSequentially(' fees');
  await expect(purpose).toHaveValue('Tuition fees');
  await expect(page.getByRole('note')).not.toBeFocused();
  await pick(form, 'area_id', AREA_WITH_SUB_AREAS);
  await expect.poll(() => backend.calls('getOneSubArea').length).toBeGreaterThan(0);
  const station = text(form, 'station');
  await station.click();
  await page.keyboard.press('End');
  await station.pressSequentially(' Annex');
  await expect(station).toHaveValue('Sample Elementary School Annex');
  await expect(station).toBeFocused();
  await expect(page.getByRole('note')).not.toBeFocused();
  const log = await focusLog(page);
  expect(log.filter((entry) => entry.role === 'note'), 'focus went back to the banner').toEqual([]);
  expect(log.filter((entry) => !entry.inForm), 'focus left the form').toEqual([]);
});

test('8c. a first failed load leaves focus alone; a Retry that fails again focuses the new alert\'s Retry, never the old alert', async ({ page, backend }) => {
  let reply: GraphqlBody = { errors: [{ message: 'The server hit a snag.' }] };
  stubApplication(backend, () => reply);
  await signedInAs(page, backend, [9101]);
  await page.goto(`/borrowers/new?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  // A first failure is no reason to move focus.
  const first = page.getByRole('alert').filter({ hasText: 'The server hit a snag.' });
  await expect(first).toBeVisible({ timeout: 90_000 });
  await expect(first).not.toBeFocused();
  await expect(first.getByRole('button', { name: 'Retry', exact: true })).not.toBeFocused();

  // Retry fails again, with a new alert (its words differ, to tell it from the first). The click is
  // sent without focusing the button, as a screen reader's virtual cursor does it, so that every focus
  // in the log is one the page made on its own.
  await trackFocus(page);
  reply = { errors: [{ message: 'The server is still not answering.' }] };
  await first.getByRole('button', { name: 'Retry', exact: true }).dispatchEvent('click');
  const second = page.getByRole('alert').filter({ hasText: 'The server is still not answering.' });
  await expect(second.getByRole('button', { name: 'Retry', exact: true })).toBeFocused({ timeout: 30_000 });
  await expect(first).toHaveCount(0);

  // Every focus the page made, from the click to now, is the new alert's Retry, and nothing else. The old
  // alert is still on screen for one render after the click and must not take the focus (a screen reader
  // could read the stale error); the new alert is not focused itself either, as it is announced as it
  // appears (role="alert") and would be read twice.
  const log = await focusLog(page);
  expect(log.filter((entry) => entry.alertText === 'The server hit a snag.'), 'the old alert took focus').toEqual([]);
  expect(log.filter((entry) => entry.role === 'alert'), 'an alert itself took focus').toEqual([]);
  expect(log).toEqual([expect.objectContaining({ tag: 'button', text: 'Retry', alertText: 'The server is still not answering.' })]);

  // The keyboard user is on Retry already: Enter retries, and it loads. The banner takes the focus (8b).
  reply = { data: { getLoanApplication: application() } };
  await page.keyboard.press('Enter');
  await expect(page.getByRole('note')).toBeFocused({ timeout: 30_000 });
  await expect(second).toHaveCount(0);
});

// A Retry can end in a card too: the application turns out converted, or without a branch, or not found.
const RETRIED_INTO_A_CARD = [
  ...NOT_READY.filter((c) => c.name === 'already a borrower' || c.name === 'interviewed, with no branch').map((c) => ({
    name: c.name,
    title: c.title,
    answer: (): GraphqlBody => ({ data: { getLoanApplication: application(c.over as Partial<LoanApplicationRecord>) } }),
  })),
  {
    name: 'not found',
    title: 'Application not found',
    answer: (): GraphqlBody => ({ data: { getLoanApplication: null }, errors: [{ message: 'Application not found.' }] }),
  },
];

for (const outcome of RETRIED_INTO_A_CARD) {
  test(`8d. a Retry that finds the application ${outcome.name} focuses that card, as a first load into it does not`, async ({ page, backend }) => {
    let reply: GraphqlBody = { errors: [{ message: 'The server hit a snag.' }] };
    stubApplication(backend, () => reply);
    await signedInAs(page, backend, [9101]);
    await page.goto(`/borrowers/new?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const alert = page.getByRole('alert').filter({ hasText: 'The server hit a snag.' });
    await expect(alert).toBeVisible({ timeout: 90_000 });

    // The Retry button the keyboard was on goes with the alert: the card the Retry finds takes the focus,
    // and the old alert, still there for a render after the click (sent without focusing the button, as a
    // screen reader's virtual cursor does), never does.
    await trackFocus(page);
    reply = outcome.answer();
    await alert.getByRole('button', { name: 'Retry', exact: true }).dispatchEvent('click');
    const stop = card(page, outcome.title);
    await expect(stop).toBeFocused({ timeout: 30_000 });
    await expect(alert).toHaveCount(0);
    await expect(formOf(page)).toHaveCount(0);
    const log = await focusLog(page);
    expect(log.filter((entry) => entry.alertText === 'The server hit a snag.'), 'the old alert took focus').toEqual([]);
    expect(log).toEqual([expect.objectContaining({ tag: 'section' })]);
    // And Tab goes on to the card's own link.
    await page.keyboard.press('Tab');
    await expect(stop.getByRole('link')).toBeFocused();
  });
}

// ---------------------------------------------------------------------------
// 9. An unusable ?application=
// ---------------------------------------------------------------------------

/** What a person would type into a blank form to match DETAILS. */
const TYPED: Record<string, string> = {
  firstname: 'Maria', lastname: 'Reyes', contact_no: '09170000041', amount_applied: '20000', purpose: 'Tuition',
  terms_of_payment: '12 months', other_source_of_inc: 'Sari-sari store', residence_address: '21 Sample Street, Sample City',
  est_monthly_fam_inc: '25000', employment_position: 'Teacher I', dob: '1990-01-15', place_of_birth: 'Sample City', age: '36',
  employment_number: 'E2E-0041', station: 'Sample Elementary School', term_in_service: '8 years', division: 'Sample Division',
  monthly_gross: '28000', monthly_net: '21000', office_address: '12 Sample Avenue, Sample City',
  'reference.0.name': 'E2E Reference One', 'reference.0.contact_no': '09170000021',
  'reference.1.name': 'E2E Reference Two', 'reference.1.contact_no': '09170000022',
  'reference.2.name': 'E2E Reference Three', 'reference.2.contact_no': '09170000023',
  employer: 'E2E Employer', company_salary: '28000', contract_duration: 'Permanent',
};

test('9. a ?application= that is no id is ignored: a blank New Borrower, and the plain save', async ({ page, backend }) => {
  stubApplication(backend);
  stubSave(backend, false, 'E2E stub: nothing is saved.');
  await signedInAs(page, backend, [9101]);
  const seen = watch(page);

  for (const query of ['?application=abc', '?application=0', '?application=-3', '?application=7abc', '?application=']) {
    const form = await open(page, query);
    await expect(page.getByRole('note'), query).toHaveCount(0);
    await expect(text(form, 'firstname'), query).toHaveValue('');
    await expect(text(form, 'amount_applied'), query).toHaveValue('');
  }
  expect(backend.calls('getLoanApplication'), 'an unusable id was looked up').toHaveLength(0);

  // Saving it posts the plain mutation, with no application.
  const form = formOf(page);
  for (const [name, value] of Object.entries(TYPED)) await text(form, name).fill(value);
  await form.locator('select[name="gender"]').selectOption('Female');
  await form.locator('select[name="civil_status"]').selectOption('Single');
  await form.locator('select[name="employment_status"]').selectOption('Permanent');
  await addWhatIsMissing(form, backend);
  await saveButton(form).click();

  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  expect(Object.keys(backend.calls('saveBorrower')[0].variables).sort()).toEqual([
    'inputBorrCompInfo', 'inputBorrDetail', 'inputBorrInfo', 'inputBorrReference', 'inputBorrSpouseDetail', 'inputBorrWorkBg',
  ]);
  expect('branch_sub_id' in (backend.calls('saveBorrower')[0].variables.inputBorrInfo as object)).toBe(false);
  expect(seen.saveQueries).toHaveLength(1);
  expect(seen.saveQueries[0]).toContain('mutation SaveBorrower(');
  expect(seen.saveQueries[0]).not.toContain('application_id');
});

// ---------------------------------------------------------------------------
// 10. Phones
// ---------------------------------------------------------------------------

test('10. at 360px the banner scrolls nothing sideways, and its link is 48px', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  stubApplication(backend);
  await signedInAs(page, backend, [9101]);
  await openConversion(page);

  const banner = page.getByRole('note');
  await expect(banner).toBeVisible();
  expect(await sidewaysScroll(page), 'the banner scrolled the page sideways at 360px').toBeLessThanOrEqual(0);
  const link = await banner.getByRole('link').boundingBox();
  expect(link!.height, 'the banner link is shorter than 48px').toBeGreaterThanOrEqual(48);
  // The whole banner sits inside the screen.
  const box = await banner.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
});

test('10b. at 360px a card scrolls nothing sideways, and its link is 48px', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  stubApplication(backend, application({ status: 'for_interview' }));
  await signedInAs(page, backend, [9101]);
  await page.goto(`/borrowers/new?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const stop = card(page, 'Set this application to Interviewed first');
  await expect(stop).toBeVisible({ timeout: 90_000 });
  expect(await sidewaysScroll(page), 'the card scrolled the page sideways at 360px').toBeLessThanOrEqual(0);
  const link = await stop.getByRole('link').boundingBox();
  expect(link!.height, 'the card link is shorter than 48px').toBeGreaterThanOrEqual(48);
  const box = await stop.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
});

test('10c. at 360px the failed-load alert scrolls nothing sideways, and Retry and its link are 48px', async ({ page, backend }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  stubApplication(backend, { errors: [{ message: 'The server hit a snag.' }] });
  await signedInAs(page, backend, [9101]);
  await page.goto(`/borrowers/new?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const alert = page.getByRole('alert').filter({ hasText: 'The server hit a snag.' });
  await expect(alert).toBeVisible({ timeout: 90_000 });
  expect(await sidewaysScroll(page), 'the alert scrolled the page sideways at 360px').toBeLessThanOrEqual(0);
  const controls = {
    retry: await alert.getByRole('button', { name: 'Retry', exact: true }).boundingBox(),
    link: await alert.getByRole('link').boundingBox(),
  };
  expect(controls.retry!.height, 'Retry is shorter than 48px').toBeGreaterThanOrEqual(48);
  expect(controls.link!.height, 'the link is shorter than 48px').toBeGreaterThanOrEqual(48);
  const box = await alert.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
});

// ---------------------------------------------------------------------------
// 11. An existing borrower
// ---------------------------------------------------------------------------

const BORROWER_ID = '12';
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** A fictional existing borrower, as getBorrower returns it: every group present, the spouse's empty. */
const BORROWER = {
  id: BORROWER_ID, payer_standing: null, user_id: 90001, chief_id: 9201, amount_applied: '15000.00', purpose: 'Store capital',
  firstname: 'Juana', middlename: 'Santos', lastname: 'Dela Cruz', terms_of_payment: '12 months',
  residence_address: '11 Sample Street, Sample City', is_rent: false, other_source_of_inc: 'Sari-sari store',
  est_monthly_fam_inc: '25000.00', employment_position: 'Teacher I', gender: 'Female', photo: 'e2e/juana.png', is_deleted: 0,
  chief: { id: '9201', name: 'E2E Chief One' },
  borrower_details: {
    id: '1', dob: '1990-01-15', place_of_birth: 'Sample City', age: 36, email: 'e2e.juana@example.test',
    contact_no: '09170000011', civil_status: 'Single',
  },
  borrower_spouse_details: {
    work_address: '', occupation: '', fullname: '', company: '', dept_branch: '', length_of_service: '', salary: '',
    company_contact_person: '', contact_no: '',
  },
  borrower_work_background: {
    id: '1', company_borrower_id: 9301, employment_number: 'E2E-0011', area_id: '9401', sub_area_id: '9502',
    station: 'Sample Elementary School', term_in_service: '8 years', employment_status: 'Permanent',
    division: 'Sample Division', monthly_gross: '28000.00', monthly_net: '21000.00', office_address: '12 Sample Avenue, Sample City',
    area: { id: '9401', name: AREA_WITH_SUB_AREAS, branch_sub_id: 9101, branch_sub: { id: '9101', branch_id: 91, name: 'E2E Sub-branch A' } },
  },
  borrower_company_info: { id: '1', employer: 'E2E Employer', salary: '28000.00', contract_duration: 'Permanent' },
  borrower_reference: [
    { id: '1', occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000021' },
    { id: '2', occupation: 'Administrative Officer/Master Teacher/Head Teacher', name: 'E2E Reference Two', contact_no: '09170000022' },
    { id: '3', occupation: 'Co-worker', name: 'E2E Reference Three', contact_no: '09170000023' },
  ],
  user: { id: 90001, name: 'E2E Admin', branchSub: { id: '9101', name: 'E2E Sub-branch A', branch_id: 91 } },
  branch_sub: { name: 'E2E Sub-branch A', branch: { name: 'E2E Branch' } },
};

test('11. on an existing borrower the parameter is ignored: its own page, no lookup, no banner, and the plain update', async ({ page, backend }) => {
  stubApplication(backend); // would answer if asked: the test asserts it is not
  backend.extraGraphql.set('getBorrower', () => ({ data: { getBorrower: BORROWER } }));
  stubSave(backend, false, 'E2E stub: nothing is saved.');
  // The borrower's photo is read from the backend's storage.
  await page.route('**/storage/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG }));
  await signedInAs(page, backend, [9101]);
  const seen = watch(page);
  await page.goto(`/borrowers/${BORROWER_ID}?application=${ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const form = formOf(page);
  await expect(text(form, 'firstname')).toHaveValue('Juana', { timeout: 90_000 });

  // The borrower's own page: asked for by its id, titled by its name, with nothing of an application on it.
  await expect(page.getByRole('heading', { name: 'Borrower: Dela Cruz, Juana', level: 2 })).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);
  await expect(page.getByText('Draft borrower.')).toHaveCount(0);
  expect(backend.calls('getBorrower').length).toBeGreaterThan(0);
  for (const call of backend.calls('getBorrower')) expect(call.variables).toEqual({ id: BORROWER_ID });
  expect(backend.calls('getLoanApplication'), 'the parameter was looked up').toHaveLength(0);

  // Saving it is the plain update of that borrower: its id, the plain mutation, and no application.
  await expect.poll(() => selectedText(form, 'company_borrower_id')).toBe('E2E Company One');
  await expect.poll(() => selectedText(form, 'sub_area_id')).toBe('E2E Sub-area Two');
  await saveButton(form).click();
  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
  const posted = backend.calls('saveBorrower')[0].variables;
  expect(Object.keys(posted).sort()).toEqual([
    'inputBorrCompInfo', 'inputBorrDetail', 'inputBorrInfo', 'inputBorrReference', 'inputBorrSpouseDetail', 'inputBorrWorkBg',
  ]);
  expect((posted.inputBorrInfo as Record<string, unknown>).id).toBe(BORROWER_ID);
  expect(seen.saveQueries).toHaveLength(1);
  expect(seen.saveQueries[0]).toContain('mutation SaveBorrower(');
  expect(seen.saveQueries[0]).not.toContain('application_id');
  expect(backend.calls('getLoanApplication'), 'the parameter was looked up').toHaveLength(0);
});
