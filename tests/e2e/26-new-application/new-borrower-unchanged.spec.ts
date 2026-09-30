/**
 * New Borrower, pinned: what /borrowers/new does today, so the switches the New
 * application page adds to BorrowerDetails.tsx can be proved to leave it alone.
 * Every expected value below was read off the unmodified form (2026-09-30); the
 * spec must pass unchanged before and after the switches go in.
 *
 *   1. Required fields: an empty Save flags exactly today's fields with today's
 *      messages, draws today's asterisks, and sends nothing. Married adds the
 *      spouse fields; an area without sub-areas makes Sub Area optional.
 *   2. The profile photo, the Check Borrower button and the heading
 *      "Check for Existing Borrower".
 *   3. The branch picker: only for a user assigned more than one sub-branch,
 *      offering those sub-branches, on the home branch when it is one of them.
 *   4. What Save posts: saveBorrower's variables (and the duplicate check before
 *      it) for a fixed fictional borrower.
 *   5. Civil status: its five choices, and leaving Married empties the spouse
 *      section (what 01-borrowers/create-borrower-civil-status.spec.ts checks
 *      against the live backend, here without it).
 *
 * Quirks of today's form that are pinned, not fixed:
 *   - chief_id and is_rent carry required rules that never fire: both default to 0,
 *     which react-hook-form does not count as empty.
 *   - The Company Information salary (company_salary) shows the SPOUSE salary's
 *     error, so it is flagged only when the spouse section is.
 *   - Number fields are stored as displayed on blur, so "15000" is posted as "15,000".
 *
 * NO CREDENTIALS AND NO BACKEND: see borrowerFormHarness.ts.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/26-new-application --reporter=line
 */
import type { Locator } from '@playwright/test';
import {
  AREA_WITH_SUB_AREAS,
  AREA_WITHOUT_SUB_AREAS,
  expect,
  fieldErrors,
  openNewBorrower,
  optionsOf,
  pick,
  requiredMarks,
  saveButton,
  selectedText,
  signedInAs,
  submitAndReadErrors,
  test,
} from './borrowerFormHarness';

test.setTimeout(180_000);

const ONE_BRANCH = [9101];
const TWO_BRANCHES = [9101, 9102];

// ---------------------------------------------------------------------------
// Today's required fields
// ---------------------------------------------------------------------------

const REQUIRED = 'This field is required';
const withMessage = (message: string, fields: string[]): Record<string, string> =>
  Object.fromEntries(fields.map((field) => [field, message]));

const SPOUSE_FIELDS = [
  'work_address', 'occupation', 'fullname', 'company', 'dept_branch',
  'length_of_service', 'salary', 'company_contact_person', 'spouse_contact_no',
];

/** The fields an empty Save flags (civil status not chosen), and each one's message. */
const EMPTY_FORM_ERRORS: Record<string, string> = {
  ...withMessage(REQUIRED, [
    'firstname', 'lastname', 'contact_no',
    'amount_applied', 'purpose', 'terms_of_payment', 'other_source_of_inc', 'residence_address',
    'est_monthly_fam_inc', 'employment_position',
    'dob', 'place_of_birth', 'age',
    'employment_number', 'station', 'term_in_service', 'division', 'monthly_gross', 'monthly_net', 'office_address',
    'reference.0.name', 'reference.0.contact_no',
    'reference.1.name', 'reference.1.contact_no',
    'reference.2.name', 'reference.2.contact_no',
    'employer', 'contract_duration',
  ]),
  gender: 'Gender is required',
  civil_status: 'Civil Status is required',
  company_borrower_id: 'Office is required',
  area_id: 'Area is required',
  sub_area_id: 'Sub Area is required',
  employment_status: 'Employee Status is required',
};

/** Married: civil status is answered, the nine spouse fields join, and so does company_salary (it shows the spouse salary's error). */
const MARRIED_ERRORS: Record<string, string> = {
  ...withoutKeys(EMPTY_FORM_ERRORS, ['civil_status']),
  ...withMessage(REQUIRED, [...SPOUSE_FIELDS, 'company_salary']),
};

/** The fields whose label carries the red asterisk on a fresh form. */
const REQUIRED_MARKS = [
  'age', 'amount_applied', 'area_id', 'chief_id', 'civil_status', 'company_borrower_id', 'company_salary',
  'contact_no', 'contract_duration', 'division', 'dob', 'employer', 'employment_number', 'employment_position',
  'employment_status', 'est_monthly_fam_inc', 'firstname', 'gender', 'lastname', 'monthly_gross', 'monthly_net',
  'office_address', 'other_source_of_inc', 'place_of_birth', 'purpose',
  'reference.0.contact_no', 'reference.0.name', 'reference.0.occupation',
  'reference.1.contact_no', 'reference.1.name', 'reference.1.occupation',
  'reference.2.contact_no', 'reference.2.name', 'reference.2.occupation',
  'residence_address', 'station', 'sub_area_id', 'term_in_service', 'terms_of_payment',
];

function withoutKeys(errors: Record<string, string>, keys: string[]): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => !keys.includes(key)));
}

const sorted = (list: string[]): string[] => [...list].sort();

// ---------------------------------------------------------------------------
// A fixed fictional borrower
// ---------------------------------------------------------------------------

const BLANK_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** Typed into the text inputs, by field name. */
const TYPED: Record<string, string> = {
  firstname: 'Juana',
  middlename: 'Santos',
  lastname: 'Dela Cruz',
  contact_no: '09170000011',
  email: 'e2e.juana@example.test',
  amount_applied: '15000',
  purpose: 'Store capital',
  terms_of_payment: '12 months',
  other_source_of_inc: 'Sari-sari store',
  residence_address: '11 Sample Street, Sample City',
  est_monthly_fam_inc: '25000',
  employment_position: 'Teacher I',
  dob: '1990-01-15',
  place_of_birth: 'Sample City',
  age: '36',
  employment_number: 'E2E-0011',
  station: 'Sample Elementary School',
  term_in_service: '8 years',
  division: 'Sample Division',
  monthly_gross: '28000',
  monthly_net: '21000',
  office_address: '12 Sample Avenue, Sample City',
  'reference.0.name': 'E2E Reference One',
  'reference.0.contact_no': '09170000021',
  'reference.1.name': 'E2E Reference Two',
  'reference.1.contact_no': '09170000022',
  'reference.2.name': 'E2E Reference Three',
  'reference.2.contact_no': '09170000023',
  employer: 'E2E Employer',
  company_salary: '28000',
  contract_duration: 'Permanent',
};

const SPOUSE_TYPED: Record<string, string> = {
  work_address: '13 Sample Road, Sample City',
  occupation: 'Driver',
  fullname: 'Pedro Dela Cruz',
  company: 'E2E Transport',
  dept_branch: 'Sample Depot',
  length_of_service: '5 years',
  salary: '18000',
  company_contact_person: 'E2E Dispatcher',
  spouse_contact_no: '09170000031',
};

async function typeAll(form: Locator, values: Record<string, string>): Promise<void> {
  for (const [name, value] of Object.entries(values)) {
    await form.locator(`input[name="${name}"]`).fill(value);
  }
}

const DUPLICATE_CHECK = {
  firstname: 'Juana',
  middlename: 'Santos',
  lastname: 'Dela Cruz',
  dob: '1990-01-15',
  email: 'e2e.juana@example.test',
  contact_no: '09170000011',
  excludeId: null,
};

const REFERENCES = {
  reference: [
    { occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000021' },
    { occupation: 'Administrative Officer/Master Teacher/Head Teacher', name: 'E2E Reference Two', contact_no: '09170000022' },
    { occupation: 'Co-worker', name: 'E2E Reference Three', contact_no: '09170000023' },
  ],
};

/** saveBorrower's variables apart from the parts each case sets. */
const saveVariables = (parts: {
  info: Record<string, unknown>;
  civilStatus: string;
  spouse: Record<string, string>;
  workBackground: Record<string, unknown>;
}) => ({
  inputBorrInfo: {
    amount_applied: '15,000',
    purpose: 'Store capital',
    firstname: 'Juana',
    middlename: 'Santos',
    lastname: 'Dela Cruz',
    terms_of_payment: '12 months',
    residence_address: '11 Sample Street, Sample City',
    other_source_of_inc: 'Sari-sari store',
    est_monthly_fam_inc: '25,000',
    employment_position: 'Teacher I',
    gender: 'Female',
    user_id: 90001,
    ...parts.info,
  },
  inputBorrDetail: {
    dob: '1990-01-15',
    place_of_birth: 'Sample City',
    age: 36,
    email: 'e2e.juana@example.test',
    contact_no: '09170000011',
    civil_status: parts.civilStatus,
  },
  inputBorrSpouseDetail: parts.spouse,
  inputBorrWorkBg: {
    employment_number: 'E2E-0011',
    station: 'Sample Elementary School',
    term_in_service: '8 years',
    division: 'Sample Division',
    monthly_gross: '28,000',
    monthly_net: '21,000',
    office_address: '12 Sample Avenue, Sample City',
    ...parts.workBackground,
  },
  inputBorrReference: REFERENCES,
  inputBorrCompInfo: { employer: 'E2E Employer', salary: '28,000', contract_duration: 'Permanent' },
});

// ---------------------------------------------------------------------------
// 1. Required fields
// ---------------------------------------------------------------------------

test.describe('1. Required fields', () => {
  test('an empty Save flags exactly today\'s fields and messages, and sends nothing', async ({ page, backend }) => {
    await signedInAs(page, backend, ONE_BRANCH);
    const form = await openNewBorrower(page);

    expect(await requiredMarks(form)).toEqual(sorted(REQUIRED_MARKS));
    expect(await submitAndReadErrors(form)).toEqual(EMPTY_FORM_ERRORS);
    expect(backend.calls('checkBorrowerDuplicate')).toHaveLength(0);
    expect(backend.calls('saveBorrower')).toHaveLength(0);
  });

  test('Married adds the nine spouse fields', async ({ page, backend }) => {
    await signedInAs(page, backend, ONE_BRANCH);
    const form = await openNewBorrower(page);

    await form.locator('select[name="civil_status"]').selectOption('Married');

    expect(await requiredMarks(form)).toEqual(sorted([...REQUIRED_MARKS, ...SPOUSE_FIELDS]));
    expect(await submitAndReadErrors(form)).toEqual(MARRIED_ERRORS);
  });

  test('Sub Area is required under an area with sub-areas, and optional under one without', async ({ page, backend }) => {
    await signedInAs(page, backend, ONE_BRANCH);
    const form = await openNewBorrower(page);

    await pick(form, 'area_id', AREA_WITH_SUB_AREAS);
    await expect.poll(() => backend.calls('getOneSubArea').length).toBe(1);
    expect(await optionsOf(form, 'sub_area_id')).toEqual(['E2E Sub-area One', 'E2E Sub-area Two']);
    expect(await requiredMarks(form)).toEqual(sorted(REQUIRED_MARKS));
    expect(await submitAndReadErrors(form)).toEqual(withoutKeys(EMPTY_FORM_ERRORS, ['area_id']));

    await pick(form, 'area_id', AREA_WITHOUT_SUB_AREAS);
    await expect.poll(() => backend.calls('getOneSubArea').length).toBe(2);
    await expect.poll(() => requiredMarks(form)).toEqual(sorted(REQUIRED_MARKS.filter((field) => field !== 'sub_area_id')));
    expect(await submitAndReadErrors(form)).toEqual(withoutKeys(EMPTY_FORM_ERRORS, ['area_id', 'sub_area_id']));
  });
});

// ---------------------------------------------------------------------------
// 2. Photo, Check Borrower, heading
// ---------------------------------------------------------------------------

test('2. the photo picker and Check Borrower show, under "Check for Existing Borrower"', async ({ page, backend }) => {
  await signedInAs(page, backend, ONE_BRANCH);
  const form = await openNewBorrower(page);

  await expect(form.getByRole('img', { name: 'profile' })).toBeVisible();
  await expect(form.locator('label[for="photo"]')).toBeVisible();
  await expect(form.locator('input#photo[type="file"]')).toHaveCount(1);
  await expect(form.getByRole('button', { name: 'Check Borrower', exact: true })).toBeVisible();
  await expect(form.getByRole('heading', { name: 'Check for Existing Borrower', exact: true })).toBeVisible();
  await expect(form.getByRole('heading', { name: 'Name & Contact' })).toHaveCount(0);
  expect(await form.locator('h3').allTextContents()).toEqual([
    'Check for Existing Borrower',
    'Borrower Information',
    'Borrower Details',
    'Work Background',
    'References',
    'Company Information',
  ]);
});

// ---------------------------------------------------------------------------
// 3. Branch picker
// ---------------------------------------------------------------------------

test.describe('3. Branch picker', () => {
  test('a user assigned one sub-branch gets no picker', async ({ page, backend }) => {
    await signedInAs(page, backend, ONE_BRANCH);
    const form = await openNewBorrower(page);

    await expect(form.getByTestId('borrower-branch-picker')).toHaveCount(0);
  });

  test('a user assigned two gets a picker of those two, on the home branch', async ({ page, backend }) => {
    await signedInAs(page, backend, TWO_BRANCHES);
    const form = await openNewBorrower(page);

    await expect(form.getByTestId('borrower-branch-picker')).toBeVisible();
    await expect.poll(() => selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch A');
    expect(await optionsOf(form, 'branch_sub_id')).toEqual(['E2E Sub-branch A', 'E2E Sub-branch B']);
    // Already on the home branch, so an empty Save does not flag it; it has no asterisk either.
    expect(await submitAndReadErrors(form)).toEqual(EMPTY_FORM_ERRORS);
    expect(await requiredMarks(form)).toEqual(sorted(REQUIRED_MARKS));
  });

  test('when the home branch is not among them, the picker starts empty and Save asks for it', async ({ page, backend }) => {
    await signedInAs(page, backend, TWO_BRANCHES, 9103);
    const form = await openNewBorrower(page);

    await expect(form.getByTestId('borrower-branch-picker')).toBeVisible();
    expect(await selectedText(form, 'branch_sub_id')).toBe('');
    expect(await submitAndReadErrors(form)).toEqual({ branch_sub_id: 'Branch is required', ...EMPTY_FORM_ERRORS });
  });
});

// ---------------------------------------------------------------------------
// 4. What Save posts
// ---------------------------------------------------------------------------

test.describe('4. Save payload', () => {
  test('one branch, Single, with a photo: the duplicate check, then saveBorrower as today', async ({ page, backend }) => {
    await signedInAs(page, backend, ONE_BRANCH);
    const form = await openNewBorrower(page);

    await form.locator('input#photo').setInputFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(BLANK_PNG_BASE64, 'base64'),
    });
    await typeAll(form, TYPED);
    await form.locator('select[name="gender"]').selectOption('Female');
    await form.locator('select[name="civil_status"]').selectOption('Single');
    await form.locator('select[name="employment_status"]').selectOption('Permanent');
    await pick(form, 'chief_id', 'E2E Chief Two');
    await pick(form, 'company_borrower_id', 'E2E Company One');
    await pick(form, 'area_id', AREA_WITH_SUB_AREAS);
    await expect.poll(() => backend.calls('getOneSubArea').length).toBe(1);
    await pick(form, 'sub_area_id', 'E2E Sub-area Two');
    await saveButton(form).click();

    await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
    expect(await fieldErrors(form)).toEqual({});
    expect(backend.graphql.map((call) => call.field).slice(-2)).toEqual(['checkBorrowerDuplicate', 'saveBorrower']);
    expect(backend.calls('checkBorrowerDuplicate').map((call) => call.variables)).toEqual([
      { ...DUPLICATE_CHECK, branch_sub_id: 9101 },
    ]);
    expect(backend.calls('saveBorrower')[0].variables).toEqual(saveVariables({
      info: { chief_id: '9202', is_rent: 0, photo: `data:image/png;base64,${BLANK_PNG_BASE64}` },
      civilStatus: 'Single',
      spouse: {
        work_address: '', occupation: '', fullname: '', company: '', dept_branch: '',
        length_of_service: '', salary: '', company_contact_person: '', contact_no: '',
      },
      workBackground: { company_borrower_id: '9301', area_id: '9401', sub_area_id: '9502', employment_status: 'Permanent' },
    }));
  });

  test('two branches, Married, Rent, second branch picked: the duplicate check, then saveBorrower as today', async ({ page, backend }) => {
    await signedInAs(page, backend, TWO_BRANCHES);
    const form = await openNewBorrower(page);

    await typeAll(form, TYPED);
    await form.locator('select[name="is_rent"]').selectOption('1');
    await form.locator('select[name="gender"]').selectOption('Female');
    await form.locator('select[name="civil_status"]').selectOption('Married');
    await typeAll(form, SPOUSE_TYPED);
    await form.locator('select[name="employment_status"]').selectOption('Contractual');
    await pick(form, 'branch_sub_id', 'E2E Sub-branch B');
    await pick(form, 'chief_id', 'E2E Chief One');
    await pick(form, 'company_borrower_id', 'E2E Company Two');
    await pick(form, 'area_id', AREA_WITHOUT_SUB_AREAS);
    await expect.poll(() => backend.calls('getOneSubArea').length).toBe(1);
    await saveButton(form).click();

    await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
    expect(await fieldErrors(form)).toEqual({});
    expect(backend.graphql.map((call) => call.field).slice(-2)).toEqual(['checkBorrowerDuplicate', 'saveBorrower']);
    expect(backend.calls('checkBorrowerDuplicate').map((call) => call.variables)).toEqual([
      { ...DUPLICATE_CHECK, branch_sub_id: '9102' },
    ]);
    expect(backend.calls('saveBorrower')[0].variables).toEqual(saveVariables({
      info: { chief_id: '9201', is_rent: 1, photo: '', branch_sub_id: '9102' },
      civilStatus: 'Married',
      spouse: {
        work_address: '13 Sample Road, Sample City', occupation: 'Driver', fullname: 'Pedro Dela Cruz',
        company: 'E2E Transport', dept_branch: 'Sample Depot', length_of_service: '5 years', salary: '18,000',
        company_contact_person: 'E2E Dispatcher', contact_no: '09170000031',
      },
      workBackground: { company_borrower_id: '9302', area_id: '9402', sub_area_id: null, employment_status: 'Contractual' },
    }));
  });
});

// ---------------------------------------------------------------------------
// 5. Civil status
// ---------------------------------------------------------------------------

test('5. civil status offers five choices, and leaving Married empties the spouse section', async ({ page, backend }) => {
  await signedInAs(page, backend, ONE_BRANCH);
  const form = await openNewBorrower(page);
  const civilStatus = form.locator('select[name="civil_status"]');
  const spouseInputs = form.locator(SPOUSE_FIELDS.map((name) => `input[name="${name}"]`).join(', '));

  expect(await civilStatus.locator('option:not([hidden])').allTextContents()).toEqual([
    'Single', 'Married', 'Live-in', 'Widowed', 'Separated',
  ]);
  await expect(form.getByRole('heading', { name: 'Borrower Spouse Details' })).toHaveCount(0);
  await expect(spouseInputs).toHaveCount(0);

  await civilStatus.selectOption('Married');
  await expect(form.getByRole('heading', { name: 'Borrower Spouse Details' })).toBeVisible();
  await expect(spouseInputs).toHaveCount(SPOUSE_FIELDS.length);
  await typeAll(form, SPOUSE_TYPED);

  await civilStatus.selectOption('Single');
  await expect(spouseInputs).toHaveCount(0);
  await civilStatus.selectOption('Live-in');
  await expect(spouseInputs).toHaveCount(SPOUSE_FIELDS.length);
  for (const name of SPOUSE_FIELDS) {
    await expect(form.locator(`input[name="${name}"]`), `${name} kept a stale value`).toHaveValue('');
  }
});

// ---------------------------------------------------------------------------
// 6. company_salary's own rule
// ---------------------------------------------------------------------------

// The Company Information salary shows the SPOUSE salary's error, so its own
// required rule never shows a message and tests 1 and 4 cannot see it. It
// still blocks Save: react-hook-form puts the cursor on it and posts nothing.
test('6. an empty Company Information salary blocks Save, without a message', async ({ page, backend }) => {
  await signedInAs(page, backend, ONE_BRANCH);
  const form = await openNewBorrower(page);

  await typeAll(form, Object.fromEntries(Object.entries(TYPED).filter(([name]) => name !== 'company_salary')));
  await form.locator('select[name="gender"]').selectOption('Female');
  await form.locator('select[name="civil_status"]').selectOption('Single');
  await form.locator('select[name="employment_status"]').selectOption('Permanent');
  await pick(form, 'chief_id', 'E2E Chief Two');
  await pick(form, 'company_borrower_id', 'E2E Company One');
  await pick(form, 'area_id', AREA_WITH_SUB_AREAS);
  await expect.poll(() => backend.calls('getOneSubArea').length).toBe(1);
  await pick(form, 'sub_area_id', 'E2E Sub-area Two');
  await saveButton(form).click();

  await expect(form.locator('input[name="company_salary"]')).toBeFocused();
  expect(await fieldErrors(form)).toEqual({});
  expect(backend.calls('checkBorrowerDuplicate')).toHaveLength(0);
  expect(backend.calls('saveBorrower')).toHaveLength(0);

  // It was the only thing missing: typed in, Save goes through.
  await form.locator('input[name="company_salary"]').fill('28000');
  await saveButton(form).click();
  await expect.poll(() => backend.calls('saveBorrower').length, { timeout: 30_000 }).toBe(1);
});
