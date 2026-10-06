/**
 * toApplicationInput (src/utils/applicationForm.ts): the New application form's values
 * -> createLoanApplication's input; hasBlankBasic, the check before posting; and, at the
 * end of the file, the two mappers an application's own page uses: fromApplicationRecord
 * (a saved application -> the form's starting values) and toApplicationUpdateInput (the
 * form's values -> updateLoanApplication's input).
 * No browser. Fictional values only.
 *
 * The values are what BorrowerDetails hands its onSubmitBorrower at run time: a number
 * field holds its displayed text once it loses focus ("15,000"), a select holds a
 * string, a picked Chief or Office a number, and a blank Age is NaN (onSubmit's parseInt).
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/26-new-application/application-form.spec.ts --reporter=line
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  APPLICATION_REQUIRED_FIELDS, CHANNELS, CHANNEL_LABELS, DATE_APPLIED_FROM, REFERENCE_POSITIONS, canCorrectDateApplied,
  dateAppliedBounds, fromApplicationRecord, hasBlankBasic, submittedDay, toApplicationInput, toApplicationUpdateInput,
} from '../../../src/utils/applicationForm';
import type { LoanApplicationDetails, LoanApplicationRecord, LoanApplicationReference } from '../../../src/utils/DataTypes';

/** BorrowerDetails' defaultValues as its onSubmit hands them over when nothing was touched. */
const FORM_DEFAULTS = {
  reference: [
    { occupation: 'Supervisor/Princpal', name: '', contact_no: '' },
    { occupation: 'Administrative Officer/Master Teacher/Head Teacher', name: '', contact_no: '' },
    { occupation: 'Co-worker', name: '', contact_no: '' },
  ],
  chief_id: 0, amount_applied: 0, purpose: '', firstname: '', middlename: '', lastname: '',
  terms_of_payment: '', residence_address: '', is_rent: 0, other_source_of_inc: '', est_monthly_fam_inc: '',
  employment_position: '', gender: '', user_id: 0, dob: '', place_of_birth: '', age: NaN, email: '', contact_no: '',
  civil_status: '', work_address: '', occupation: '', fullname: '', company: '', dept_branch: '',
  length_of_service: '', salary: '', company_contact_person: '', spouse_contact_no: '', company_borrower_id: null,
  employment_number: '', area_id: '', sub_area_id: '', station: '', term_in_service: '', employment_status: '',
  division: '', monthly_gross: 0, monthly_net: 0, office_address: '', employer: '', company_salary: '',
  contract_duration: '', photo: '',
};

/** The basics as the form holds them after typing. */
const BASICS = {
  firstname: 'Juana',
  lastname: 'Dela Cruz',
  contact_no: '09170000011',
  amount_applied: '15,000',
  purpose: 'Store capital',
};

const BASICS_INPUT = {
  channel: 'facebook',
  branch_sub_id: 9102,
  info: { firstname: 'JUANA', lastname: 'DELA CRUZ', amount_applied: '15000', purpose: 'Store capital' },
  detail: { contact_no: '09170000011' },
};

test('the constants: four channels with their labels, and only the basics required', () => {
  expect(CHANNELS).toEqual(['google_form', 'facebook', 'walk_in', 'phone']);
  expect(CHANNELS.map((channel) => CHANNEL_LABELS[channel])).toEqual(['Google Form', 'Facebook Messenger', 'Walk-in', 'Tawag o Text']);
  expect(Array.from(APPLICATION_REQUIRED_FIELDS).sort()).toEqual(['amount_applied', 'branch_sub_id', 'contact_no', 'firstname', 'lastname', 'purpose']);
});

test('basics only: the basics, the channel and the branch, and nothing else', () => {
  expect(toApplicationInput(BASICS, 'facebook', '9102')).toEqual(BASICS_INPUT);
});

test("the form's untouched defaults are all left out, and so are photo, id and user_id", () => {
  const values = { ...FORM_DEFAULTS, ...BASICS, id: '70001', photo: 'data:image/png;base64,AAAA', user_id: 90001, branch_sub_id: '9102', channel: 'facebook' };

  expect(toApplicationInput(values, 'facebook', '9102')).toEqual(BASICS_INPUT);
  // A company picked and then cleared is 0, not null; an age typed and cleared is NaN.
  expect(toApplicationInput({ ...values, company_borrower_id: 0 }, 'facebook', 9102)).toEqual(BASICS_INPUT);
});

test('the full form: every group, with the input names and Int fields as numbers', () => {
  const values = {
    ...FORM_DEFAULTS,
    ...BASICS,
    middlename: 'Santos',
    chief_id: 9202,
    terms_of_payment: '12 months',
    residence_address: '11 Sample Street, Sample City',
    is_rent: '1',
    other_source_of_inc: 'Sari-sari store',
    est_monthly_fam_inc: '25,000',
    employment_position: 'Teacher I',
    gender: 'Female',
    email: 'e2e.juana@example.test',
    dob: '1990-01-15',
    place_of_birth: 'Sample City',
    age: 36,
    civil_status: 'Married',
    work_address: '13 Sample Road, Sample City',
    occupation: 'Driver',
    fullname: 'Pedro Dela Cruz',
    company: 'E2E Transport',
    dept_branch: 'Sample Depot',
    length_of_service: '5 years',
    salary: '18,000',
    company_contact_person: 'E2E Dispatcher',
    spouse_contact_no: '09170000031',
    company_borrower_id: 9301,
    employment_number: 'E2E-0011',
    area_id: '9401',
    sub_area_id: '9502',
    station: 'Sample Elementary School',
    term_in_service: '8 years',
    employment_status: 'Permanent',
    division: 'Sample Division',
    monthly_gross: '28,000',
    monthly_net: '21,000.50',
    office_address: '12 Sample Avenue, Sample City',
    employer: 'E2E Employer',
    company_salary: '28,000',
    contract_duration: 'Permanent',
    reference: [
      { occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000021' },
      { occupation: 'Co-worker', name: 'E2E Reference Two', contact_no: '09170000022' },
    ],
  };

  expect(toApplicationInput(values, 'walk_in', '9101')).toEqual({
    channel: 'walk_in',
    branch_sub_id: 9101,
    info: {
      firstname: 'JUANA',
      middlename: 'SANTOS',
      lastname: 'DELA CRUZ',
      amount_applied: '15000',
      purpose: 'Store capital',
      chief_id: 9202,
      terms_of_payment: '12 months',
      residence_address: '11 Sample Street, Sample City',
      is_rent: 1,
      other_source_of_inc: 'Sari-sari store',
      est_monthly_fam_inc: '25000',
      employment_position: 'Teacher I',
      gender: 'Female',
    },
    detail: {
      contact_no: '09170000011',
      email: 'e2e.juana@example.test',
      dob: '1990-01-15',
      place_of_birth: 'Sample City',
      age: 36,
      civil_status: 'Married',
    },
    spouse: {
      work_address: '13 Sample Road, Sample City',
      occupation: 'Driver',
      fullname: 'Pedro Dela Cruz',
      company: 'E2E Transport',
      dept_branch: 'Sample Depot',
      length_of_service: '5 years',
      salary: '18000',
      company_contact_person: 'E2E Dispatcher',
      contact_no: '09170000031',
    },
    work: {
      company_borrower_id: 9301,
      employment_number: 'E2E-0011',
      area_id: 9401,
      sub_area_id: 9502,
      station: 'Sample Elementary School',
      term_in_service: '8 years',
      employment_status: 'Permanent',
      division: 'Sample Division',
      monthly_gross: '28000',
      monthly_net: '21000.50',
      office_address: '12 Sample Avenue, Sample City',
    },
    company: { employer: 'E2E Employer', salary: '28000', contract_duration: 'Permanent' },
    references: [
      { occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000021' },
      { occupation: 'Co-worker', name: 'E2E Reference Two', contact_no: '09170000022' },
    ],
  });
});

test('a reference row needs a name or a number: the prefilled position alone is dropped', () => {
  const values = {
    ...BASICS,
    reference: [
      { occupation: 'Supervisor/Princpal', name: '', contact_no: '' },
      { occupation: 'Co-worker', name: 'E2E Reference Two', contact_no: '' },
      { occupation: '', name: '', contact_no: '09170000023' },
      { occupation: '', name: '', contact_no: '' },
    ],
  };

  expect(toApplicationInput(values, 'phone', 9103).references).toEqual([
    { occupation: 'Co-worker', name: 'E2E Reference Two' },
    { contact_no: '09170000023' },
  ]);
  const onlyBlankRows = { ...BASICS, reference: FORM_DEFAULTS.reference };
  expect(toApplicationInput(onlyBlankRows, 'phone', 9103)).not.toHaveProperty('references');
});

test('amounts lose their commas and spaces: "15,000" becomes "15000", and amount_applied is always a string', () => {
  const read = (values: Record<string, unknown>) => toApplicationInput({ ...BASICS, ...values }, 'google_form', 9101);

  expect(read({}).info.amount_applied).toBe('15000');
  expect(read({ amount_applied: '1,234,567.50' }).info.amount_applied).toBe('1234567.50');
  expect(read({ amount_applied: ' 2 500 ' }).info.amount_applied).toBe('2500');
  expect(read({ amount_applied: 15000 }).info.amount_applied).toBe('15000');
  const groups = read({ monthly_gross: '28,000', monthly_net: '0', company_salary: '9,500.5' });
  expect(groups.work).toEqual({ monthly_gross: '28000' });
  expect(groups.company).toEqual({ salary: '9500.5' });
  expect(read({ monthly_net: '0' })).not.toHaveProperty('work');
});

test('Est. Monthly Family Income and the spouse salary lose thousands separators when they are a plain number; anything else stays as written', () => {
  // Both are TEXT on the server (max 50), and a number field hands over the text it SHOWS once it loses focus ("12,500").
  const values = (shown: string) => ({ ...BASICS, civil_status: 'Married', est_monthly_fam_inc: shown, salary: shown });
  const builds = [
    (shown: string) => toApplicationInput(values(shown), 'google_form', 9101),
    (shown: string) => toApplicationUpdateInput(values(shown), null),
  ];
  const PLAIN: [string, string][] = [
    ['12,500', '12500'], ['12,500.00', '12500.00'], ['1,234,567.5', '1234567.5'], ['12500', '12500'], [' 12,500 ', '12500'], ['-1,500', '-1500'],
  ];
  for (const [shown, sent] of PLAIN) {
    for (const build of builds) {
      expect(build(shown).info.est_monthly_fam_inc, `income ${JSON.stringify(shown)}`).toBe(sent);
      expect(build(shown).spouse?.salary, `salary ${JSON.stringify(shown)}`).toBe(sent);
    }
  }
  // Words, a comma that is no thousands separator, a currency sign, a range: as written.
  for (const written of ['about 30k', '12,5', '1,2345', '1,000,00', 'P12,500', '12,500 monthly', '15k-20k']) {
    for (const build of builds) {
      expect(build(written).info.est_monthly_fam_inc, `income ${written}`).toBe(written);
      expect(build(written).spouse?.salary, `salary ${written}`).toBe(written);
    }
  }
  expect(builds[0]('').info).not.toHaveProperty('est_monthly_fam_inc');
  expect(builds[0]('').spouse ?? {}).not.toHaveProperty('salary');
});

test("the applicant's first, middle and last name go in CAPITALS, in the create and the update; a spouse's and a reference's name keep their case", () => {
  const typed = {
    ...BASICS,
    firstname: 'jose maría',
    middlename: 'Muñoz',
    lastname: 'dela Peña',
    civil_status: 'Married',
    fullname: 'Pedro dela Cruz',
    reference: [{ occupation: 'Co-worker', name: 'Ana de los Santos', contact_no: '09170000021' }],
  };

  for (const info of [
    toApplicationInput(typed, 'walk_in', 9101).info,
    toApplicationUpdateInput(typed, null).info,
  ]) {
    // ñ and the accented vowels go to their capitals.
    expect(info).toMatchObject({ firstname: 'JOSE MARÍA', middlename: 'MUÑOZ', lastname: 'DELA PEÑA' });
  }
  const create = toApplicationInput(typed, 'walk_in', 9101);
  const update = toApplicationUpdateInput(typed, null);
  expect(create.spouse).toEqual({ fullname: 'Pedro dela Cruz' });
  expect(update.spouse).toEqual({ fullname: 'Pedro dela Cruz' });
  expect(create.references).toEqual([{ occupation: 'Co-worker', name: 'Ana de los Santos', contact_no: '09170000021' }]);
  expect(update.references).toEqual(create.references);
  // The rest of the basics are as typed.
  expect(create.info.purpose).toBe('Store capital');
});

test('a blank or missing name stays blank, and a blank middle name is left out, not sent as an empty string', () => {
  const noMiddle = toApplicationInput({ ...BASICS, middlename: '' }, 'walk_in', 9101);
  expect(noMiddle.info).not.toHaveProperty('middlename');
  expect(toApplicationInput({ ...BASICS, middlename: null }, 'walk_in', 9101).info).not.toHaveProperty('middlename');
  expect(toApplicationUpdateInput({ ...BASICS, middlename: undefined }, null).info).not.toHaveProperty('middlename');
  // The basics are always sent, as before; a blank one is stopped before posting (hasBlankBasic), not here.
  expect(toApplicationInput({ ...BASICS, firstname: '', lastname: undefined }, 'walk_in', 9101).info).toMatchObject({ firstname: '', lastname: '' });
  // Already in capitals: the same.
  expect(toApplicationInput({ ...BASICS, firstname: 'JUANA' }, 'walk_in', 9101).info.firstname).toBe('JUANA');
});

test("fromApplicationRecord brings the applicant's names back in capitals, whatever case they were stored in; nothing else changes case", () => {
  const stored: LoanApplicationRecord = {
    ...FULL_RECORD,
    details: {
      ...FULL_DETAILS,
      info: { ...FULL_DETAILS.info!, firstname: 'juana', middlename: 'Santos', lastname: 'dela Peña', purpose: 'Store capital', gender: 'Female' },
      spouse: { ...FULL_DETAILS.spouse!, fullname: 'Pedro dela Cruz' },
      references: [{ occupation: 'Co-worker', name: 'Ana de los Santos', contact_no: null }],
    },
  };

  const form = fromApplicationRecord(stored);

  expect(form).toMatchObject({ firstname: 'JUANA', middlename: 'SANTOS', lastname: 'DELA PEÑA' });
  expect(form).toMatchObject({ purpose: 'Store capital', gender: 'Female', fullname: 'Pedro dela Cruz' });
  expect(form.reference![0]).toEqual({ occupation: 'Co-worker', name: 'Ana de los Santos', contact_no: '' });
  // No middle name stored: none in the form (and so none sent).
  const noMiddle = fromApplicationRecord({ ...stored, details: { ...stored.details, info: { ...stored.details.info!, middlename: null } } });
  expect(noMiddle).not.toHaveProperty('middlename');
  // The form's names and the built input agree, so a page that has just loaded holds nothing unsaved (the baseline).
  const asLoaded = { ...FORM_DEFAULTS, ...form };
  expect(toApplicationUpdateInput(asLoaded, null).info).toMatchObject({ firstname: 'JUANA', middlename: 'SANTOS', lastname: 'DELA PEÑA' });
});

test('a blank Age (NaN) is dropped; a typed one is a number', () => {
  expect(toApplicationInput({ ...BASICS, age: NaN }, 'walk_in', 9101).detail).toEqual({ contact_no: '09170000011' });
  expect(toApplicationInput({ ...BASICS, age: 36 }, 'walk_in', 9101).detail).toEqual({ contact_no: '09170000011', age: 36 });
});

test('Type of Residency goes only beside an address, Own included', () => {
  expect(toApplicationInput({ ...BASICS, is_rent: '1' }, 'walk_in', 9101).info).not.toHaveProperty('is_rent');
  expect(toApplicationInput({ ...BASICS, residence_address: '11 Sample Street', is_rent: 0 }, 'walk_in', 9101).info)
    .toMatchObject({ residence_address: '11 Sample Street', is_rent: 0 });
});

test('a blank basic stays in the output, as the input type requires; the page stops it before posting', () => {
  expect(toApplicationInput({ contact_no: '' }, 'facebook', 9102)).toEqual({
    channel: 'facebook',
    branch_sub_id: 9102,
    info: { firstname: '', lastname: '', amount_applied: '', purpose: '' },
    detail: { contact_no: '' },
  });
});

test('hasBlankBasic: a basic of only spaces counts as blank; the other fields do not matter', () => {
  expect(hasBlankBasic(BASICS)).toBe(false);
  expect(hasBlankBasic({ ...FORM_DEFAULTS, ...BASICS })).toBe(false);
  for (const field of Object.keys(BASICS)) {
    expect(hasBlankBasic({ ...BASICS, [field]: '   ' }), `${field} of spaces`).toBe(true);
    expect(hasBlankBasic({ ...BASICS, [field]: undefined }), `${field} missing`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// A saved application back into the form (fromApplicationRecord), and out as an
// update (toApplicationUpdateInput)
// ---------------------------------------------------------------------------

/** Three stored references: a Position of the school's own wording, none at all, and a Position with only a number. */
const REFERENCES_AS_STORED: LoanApplicationReference[] = [
  { occupation: 'Kapitbahay', name: 'E2E Reference One', contact_no: '09170000021' },
  { occupation: null, name: 'E2E Reference Two', contact_no: null },
  { occupation: 'Co-worker', name: null, contact_no: '09170000023' },
];

/** What those come back as from an update: only the fields they have, in the order stored. */
const REFERENCES_AS_SENT = [
  { occupation: 'Kapitbahay', name: 'E2E Reference One', contact_no: '09170000021' },
  { name: 'E2E Reference Two' },
  { occupation: 'Co-worker', contact_no: '09170000023' },
];

/** A fictional saved application's stored form, every group filled in. Money is a string, as the server stores it. */
const FULL_DETAILS: LoanApplicationDetails = {
  info: {
    firstname: 'JUANA',
    middlename: 'SANTOS',
    lastname: 'DELA CRUZ',
    amount_applied: '15000.00',
    purpose: 'Store capital',
    chief_id: 9202,
    terms_of_payment: '12 months',
    residence_address: '11 Sample Street, Sample City',
    is_rent: 1,
    other_source_of_inc: 'Sari-sari store',
    est_monthly_fam_inc: '25000',
    employment_position: 'Teacher I',
    gender: 'Female',
  },
  detail: {
    contact_no: '09170000011',
    email: 'e2e.juana@example.test',
    dob: '1990-01-15',
    place_of_birth: 'Sample City',
    age: 36,
    civil_status: 'Married',
  },
  spouse: {
    work_address: '13 Sample Road, Sample City',
    occupation: 'Driver',
    fullname: 'Pedro Dela Cruz',
    company: 'E2E Transport',
    dept_branch: 'Sample Depot',
    length_of_service: '5 years',
    salary: '18000',
    company_contact_person: 'E2E Dispatcher',
    contact_no: '09170000031',
  },
  work: {
    company_borrower_id: 9301,
    employment_number: 'E2E-0011',
    area_id: 9401,
    sub_area_id: 9502,
    station: 'Sample Elementary School',
    term_in_service: '8 years',
    employment_status: 'Permanent',
    division: 'Sample Division',
    monthly_gross: '28000.00',
    monthly_net: '21000.50',
    office_address: '12 Sample Avenue, Sample City',
  },
  company: { employer: 'E2E Employer', salary: '28000.00', contract_duration: 'Permanent' },
  references: REFERENCES_AS_STORED,
};

/** The notes a person must never see turn into form fields: the upload's flags and the Google Form's answers. */
const INTAKE_FLAG = 'check amount: "15k" is not a plain number';
const FORM_ANSWER = 'E2E form answer that is not a form field';

const FULL_RECORD: LoanApplicationRecord = {
  id: '9001',
  source: 'google_form',
  channel: 'google_form',
  submitted_at: '2026-09-30 10:15:00',
  location: 'Sample Town',
  branch_sub_id: 9101,
  branch_sub: { id: '9101', name: 'E2E Sub-branch A' },
  status: 'for_interview',
  borrower_id: null,
  full_name: 'JUANA SANTOS DELA CRUZ',
  contact_no: '09170000011',
  amount_applied: '15000.00',
  purpose: 'Store capital',
  intake_flags: [INTAKE_FLAG],
  created_at: '2026-09-30 10:15:00',
  details: FULL_DETAILS,
  form_answers: [{ question: 'Anong trabaho po ninyo?', answer: FORM_ANSWER }],
  exact_time: false,
  can_edit: true,
  borrower_decision: null,
  outcome: 'for_interview',
  outcome_label: 'Waiting for interview',
  decline_reason: null,
  notes: [],
};

/** Every group null: what the server sends for an application with no stored form. */
const NO_GROUPS: LoanApplicationDetails = { info: null, detail: null, spouse: null, work: null, company: null, references: null };

/** An application with nothing stored but its list columns. */
const BARE_RECORD: LoanApplicationRecord = {
  ...FULL_RECORD,
  branch_sub_id: null,
  branch_sub: null,
  intake_flags: [],
  details: NO_GROUPS,
  form_answers: [],
};

/** `group` without its null fields: what an update sends back for a group read from the server. */
const withoutNulls = (group: object) => Object.fromEntries(Object.entries(group).filter(([, value]) => value !== null));

/** `group` with every field null: a group the server has nothing stored in. */
const allNull = <T extends object>(group: T): T => Object.fromEntries(Object.keys(group).map((key) => [key, null])) as T;

/**
 * The values BorrowerDetails holds as soon as it mounts with these starting values: its own
 * defaults with the starting values over them (`{ ...defaultValues, ...seed }`). Whatever the
 * mapper leaves out, the form's default stands.
 */
const asMounted = (record: LoanApplicationRecord) => ({ ...FORM_DEFAULTS, ...fromApplicationRecord(record) });

/** The paths in `value` that hold a zero, as a number or as text ("0", "0.00"): what a blank must never turn into. */
function zerosIn(value: unknown, where = 'update'): string[] {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, inner]) => zerosIn(inner, `${where}.${key}`));
  }
  const zero = value === 0 || (typeof value === 'string' && /^0+(\.0+)?$/.test(value));
  return zero ? [where] : [];
}

/** What a record's form holds in its reference rows. */
const referenceRows = (references: LoanApplicationReference[] | null) =>
  fromApplicationRecord({ ...FULL_RECORD, details: { ...FULL_DETAILS, references } }).reference!;

test("fromApplicationRecord: every field under the form's name and in the type the form keeps it in", () => {
  expect(fromApplicationRecord(FULL_RECORD)).toEqual({
    // info
    firstname: 'JUANA',
    middlename: 'SANTOS',
    lastname: 'DELA CRUZ',
    amount_applied: '15000.00',
    purpose: 'Store capital',
    chief_id: 9202,
    terms_of_payment: '12 months',
    residence_address: '11 Sample Street, Sample City',
    is_rent: 1,
    other_source_of_inc: 'Sari-sari store',
    est_monthly_fam_inc: '25000',
    employment_position: 'Teacher I',
    gender: 'Female',
    // detail
    contact_no: '09170000011',
    email: 'e2e.juana@example.test',
    dob: '1990-01-15',
    place_of_birth: 'Sample City',
    age: 36,
    civil_status: 'Married',
    // spouse: the number is the form's spouse_contact_no
    work_address: '13 Sample Road, Sample City',
    occupation: 'Driver',
    fullname: 'Pedro Dela Cruz',
    company: 'E2E Transport',
    dept_branch: 'Sample Depot',
    length_of_service: '5 years',
    salary: '18000',
    company_contact_person: 'E2E Dispatcher',
    spouse_contact_no: '09170000031',
    // work: the Office is a number, Area and Sub Area are the text their pickers hold
    company_borrower_id: 9301,
    employment_number: 'E2E-0011',
    area_id: '9401',
    sub_area_id: '9502',
    station: 'Sample Elementary School',
    term_in_service: '8 years',
    employment_status: 'Permanent',
    division: 'Sample Division',
    monthly_gross: '28000.00',
    monthly_net: '21000.50',
    office_address: '12 Sample Avenue, Sample City',
    // company: the salary is the form's company_salary
    employer: 'E2E Employer',
    company_salary: '28000.00',
    contract_duration: 'Permanent',
    // references -> reference, a blank field as the empty text the form expects
    reference: [
      { occupation: 'Kapitbahay', name: 'E2E Reference One', contact_no: '09170000021' },
      { occupation: '', name: 'E2E Reference Two', contact_no: '' },
      { occupation: 'Co-worker', name: '', contact_no: '09170000023' },
    ],
    // the branch picker holds the id as text
    branch_sub_id: '9101',
  });
});

test('money stays a string all the way into the form, and Own or Rent is a number', () => {
  const form = fromApplicationRecord(FULL_RECORD);
  // BorrowerInfo types these number; the form holds the text it shows, and a float would lose the cents.
  expect(form).toMatchObject({ amount_applied: '15000.00', monthly_gross: '28000.00', monthly_net: '21000.50', company_salary: '28000.00' });
  for (const field of ['amount_applied', 'monthly_gross', 'monthly_net', 'company_salary'] as const) {
    expect(typeof form[field], field).toBe('string');
  }

  expect(form.is_rent).toBe(1);
  const own = fromApplicationRecord({ ...FULL_RECORD, details: { ...FULL_DETAILS, info: { ...FULL_DETAILS.info!, is_rent: 0 } } });
  expect(own.is_rent).toBe(0);
});

test('round trip: a saved application through the form and back gives the same groups', () => {
  const form = asMounted(FULL_RECORD);
  const update = toApplicationUpdateInput(form, String(form.branch_sub_id));

  expect(update).toEqual({
    branch_sub_id: 9101,
    info: FULL_DETAILS.info,
    detail: FULL_DETAILS.detail,
    spouse: FULL_DETAILS.spouse,
    work: FULL_DETAILS.work,
    company: FULL_DETAILS.company,
    references: REFERENCES_AS_SENT,
  });
});

test('round trip: a value stored with separators ("25,000") comes back as plain digits, as the form would hand it', () => {
  const stored = {
    ...FULL_RECORD,
    details: {
      ...FULL_DETAILS,
      info: { ...FULL_DETAILS.info!, est_monthly_fam_inc: '25,000' },
      spouse: { ...FULL_DETAILS.spouse!, salary: '18,000' },
    },
  };
  const update = toApplicationUpdateInput(asMounted(stored), null);

  expect(update.info.est_monthly_fam_inc).toBe('25000');
  expect(update.spouse?.salary).toBe('18000');
});

test('round trip: null fields come back absent, a null work, company or references comes back empty, and spouse stays out', () => {
  const details: LoanApplicationDetails = {
    info: {
      ...FULL_DETAILS.info!,
      middlename: null, chief_id: null, terms_of_payment: null, residence_address: null, is_rent: null,
      other_source_of_inc: null, est_monthly_fam_inc: null, gender: null,
    },
    detail: { contact_no: '09170000011', email: null, dob: null, place_of_birth: null, age: null, civil_status: null },
    spouse: null,
    work: { ...FULL_DETAILS.work!, company_borrower_id: null, area_id: null, sub_area_id: null, monthly_net: null },
    company: null,
    references: [],
  };
  const form = asMounted({ ...FULL_RECORD, details });
  const update = toApplicationUpdateInput(form, null);

  // company and references were not stored, and are sent empty (the server then keeps nothing of them).
  // spouse was not stored either, and civil status is not Married or Live-in: it is left out.
  expect(update).toEqual({
    info: withoutNulls(details.info!),
    detail: { contact_no: '09170000011' },
    work: withoutNulls(details.work!),
    company: {},
    references: [],
  });
  expect(update).not.toHaveProperty('spouse');
  expect(update).not.toHaveProperty('branch_sub_id');
});

test("a record with null groups, or no details at all, maps without errors to the form's own defaults", () => {
  // The schema never sends details as null; the mapper copes if one ever does.
  const noDetails = null as unknown as LoanApplicationDetails;
  for (const details of [NO_GROUPS, noDetails]) {
    const record = { ...BARE_RECORD, details };
    // Nothing stored: no Chief, no amount, and the three preset reference rows as the form starts them.
    expect(fromApplicationRecord(record)).toEqual({ chief_id: 0, amount_applied: '', reference: FORM_DEFAULTS.reference });
    // The update is built from the form's values with its defaults under them (asMounted), as on the page.
    expect(toApplicationUpdateInput(asMounted(record), null)).toEqual({
      info: { firstname: '', lastname: '', amount_applied: '', purpose: '' },
      detail: { contact_no: '' },
      work: {},
      company: {},
      references: [],
    });
  }
});

/*
 * What the form holds when the mapper leaves a field out. BorrowerDetails starts from
 * { ...defaultValues, ...initialValues }, so a field with nothing stored keeps the form's
 * default; a default that looks empty on screen can still be posted.
 */

test("an application with no amount posts no amount and no invented zero, once merged over the form's defaults", () => {
  // Every Google Form import flagged "check amount" stores none. The form's default for the amount
  // is 0: an empty-looking box that posts "0", which the update refuses (min:0.01) although a blank
  // amount may be saved.
  const imported: LoanApplicationRecord = {
    ...BARE_RECORD,
    amount_applied: null,
    intake_flags: [INTAKE_FLAG],
    details: {
      ...NO_GROUPS,
      info: { ...allNull(FULL_DETAILS.info!), firstname: 'Juana', lastname: 'Dela Cruz', purpose: 'Store capital' },
      detail: { ...allNull(FULL_DETAILS.detail!), contact_no: '09170000011' },
      work: { ...allNull(FULL_DETAILS.work!), station: 'Sample Elementary School' },
    },
  };

  const update = toApplicationUpdateInput(asMounted(imported), null);

  // Blank, which the server reads as no amount: not "0", and not anything else.
  expect(update.info.amount_applied ?? '', 'a blank amount went as something else').toBe('');
  // Nor did any other default turn into a zero: Monthly Gross and Net start at 0, the Chief at 0, and so on.
  expect(zerosIn(update), 'a default was posted as a zero').toEqual([]);
  // What was stored still comes back, and nothing is invented beside it.
  expect(update.info).toEqual({ firstname: 'JUANA', lastname: 'DELA CRUZ', amount_applied: '', purpose: 'Store capital' });
  expect(update.detail).toEqual({ contact_no: '09170000011' });
  expect(update.work).toEqual({ station: 'Sample Elementary School' });
});

test("the form's defaults in this spec are BorrowerDetails' own defaultValues (age aside: onSubmit makes it a number)", () => {
  // The tests above merge over FORM_DEFAULTS, a copy of BorrowerDetails' defaultValues: fail here if the form's change.
  const source = fs.readFileSync(path.join(__dirname, '../../../src/app/borrowers/components/TabForm/BorrowerDetails.tsx'), 'utf8');
  const start = source.indexOf('const defaultValues: any = {');
  expect(start, 'BorrowerDetails no longer declares its defaultValues this way').toBeGreaterThan(-1);

  // The object literal, found by matching its braces; it holds only strings, numbers, null, arrays and objects.
  const open = source.indexOf('{', start);
  let depth = 0;
  let close = -1;
  for (let at = open; at < source.length && close < 0; at += 1) {
    if (source[at] === '{') depth += 1;
    if (source[at] === '}') depth -= 1;
    if (depth === 0) close = at;
  }
  const actual = new Function(`return (${source.slice(open, close + 1)});`)() as Record<string, unknown>;

  expect({ ...actual, age: NaN }).toEqual(FORM_DEFAULTS);
});

test('references: each keeps its order and its own Position; the preset rows fill only what is left', () => {
  const presets = FORM_DEFAULTS.reference;

  expect(referenceRows(null)).toEqual(presets);
  expect(referenceRows([])).toEqual(presets);

  // One stored, with no Position: it is not given a preset one, so saving does not invent it.
  const one = [{ occupation: null, name: 'E2E Reference One', contact_no: '09170000021' }];
  const withOne = referenceRows(one);
  expect(withOne).toEqual([{ occupation: '', name: 'E2E Reference One', contact_no: '09170000021' }, presets[1], presets[2]]);
  const sentOne = toApplicationUpdateInput({ ...BASICS, reference: withOne }, null);
  expect(sentOne.references).toEqual([{ name: 'E2E Reference One', contact_no: '09170000021' }]);

  // Four stored: four rows, and no preset row left over.
  const four = [1, 2, 3, 4].map((n) => ({ occupation: `Kakilala ${n}`, name: `E2E Reference ${n}`, contact_no: `0917000002${n}` }));
  expect(referenceRows(four)).toHaveLength(4);
  expect(referenceRows(four).map((row) => row.name)).toEqual(four.map((reference) => reference.name));

  // Stored in the other order from the presets': saved back in the order stored.
  const swapped = [
    { occupation: 'Co-worker', name: 'E2E Reference Two', contact_no: '09170000022' },
    { occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000021' },
  ];
  const sentSwapped = toApplicationUpdateInput({ ...BASICS, reference: referenceRows(swapped) }, null);
  expect(sentSwapped.references).toEqual(swapped);
});

test('intake_flags and the Google Form answers never reach the form or the update', () => {
  const form = fromApplicationRecord(FULL_RECORD);
  const update = toApplicationUpdateInput(form, '9101');

  for (const [name, value] of [['form', form], ['update', update]] as const) {
    expect(value, name).not.toHaveProperty('intake_flags');
    expect(value, name).not.toHaveProperty('form_answers');
    expect(JSON.stringify(value), name).not.toContain(INTAKE_FLAG);
    expect(JSON.stringify(value), name).not.toContain(FORM_ANSWER);
  }
  // Nor does a stray key in the values the page holds.
  expect(toApplicationUpdateInput({ ...BASICS, intake_flags: [INTAKE_FLAG] }, null)).not.toHaveProperty('intake_flags');
});

test('toApplicationUpdateInput cleans as toApplicationInput does (the sections aside), and has no channel', () => {
  // Every section filled and Married: the update has exactly the groups the create has.
  const form = fromApplicationRecord(FULL_RECORD);
  const { channel, ...create } = toApplicationInput(form, 'walk_in', '9101');

  expect(channel).toBe('walk_in');
  const update = toApplicationUpdateInput(form, '9101');
  expect(update).not.toHaveProperty('channel');
  expect(update).toEqual(create);

  // Blanks, NaN and the form's own defaults are dropped, and so are photo, id and user_id.
  const untouched = { ...FORM_DEFAULTS, ...BASICS, id: '70001', photo: 'data:image/png;base64,AAAA', user_id: 90001 };
  expect(toApplicationUpdateInput(untouched, '9102')).toEqual({
    branch_sub_id: 9102,
    info: { firstname: 'JUANA', lastname: 'DELA CRUZ', amount_applied: '15000', purpose: 'Store capital' },
    detail: { contact_no: '09170000011' },
    // What the create would leave out, the update sends empty.
    work: {},
    company: {},
    references: [],
  });
});

test('create is unchanged: an empty section is left out, and a filled spouse is sent whatever the civil status', () => {
  expect(toApplicationInput({ ...FORM_DEFAULTS, ...BASICS }, 'walk_in', 9101)).toEqual({
    channel: 'walk_in',
    branch_sub_id: 9101,
    info: { firstname: 'JUANA', lastname: 'DELA CRUZ', amount_applied: '15000', purpose: 'Store capital' },
    detail: { contact_no: '09170000011' },
  });
  const single = toApplicationInput({ ...BASICS, civil_status: 'Single', fullname: 'Pedro Dela Cruz' }, 'walk_in', 9101);
  expect(single.spouse).toEqual({ fullname: 'Pedro Dela Cruz' });
});

// ---------------------------------------------------------------------------
// What the update sends for each section. The server KEEPS a section the input leaves out
// and CLEARS one sent empty, so an emptied section is sent empty: except spouse, which the
// form hides (and wipes) unless the civil status is Married or Live-in.
// ---------------------------------------------------------------------------

test('an emptied references list is sent as [], so the server clears it', () => {
  const sent = (reference: unknown) => toApplicationUpdateInput({ ...BASICS, reference }, null).references;

  // Every reference cleared: the three preset rows keep only their Positions, which are no reference.
  expect(sent(FORM_DEFAULTS.reference)).toEqual([]);
  // Every row removed, or the rows not there at all.
  expect(sent([])).toEqual([]);
  expect(toApplicationUpdateInput(BASICS, null).references).toEqual([]);
  // One left: sent as it is.
  expect(sent([{ occupation: '', name: 'E2E Reference One', contact_no: '' }])).toEqual([{ name: 'E2E Reference One' }]);
});

test('an empty work or company section is sent as {}, so the server clears it', () => {
  // The form's own defaults (no Office or Area, Monthly Gross and Net 0, no company salary) are no answer.
  const emptied = toApplicationUpdateInput({ ...FORM_DEFAULTS, ...BASICS }, null);
  expect(emptied.work).toEqual({});
  expect(emptied.company).toEqual({});

  // With something in them, they are sent as filled.
  const filled = toApplicationUpdateInput({ ...BASICS, station: 'Sample Elementary School', employer: 'E2E Employer' }, null);
  expect(filled.work).toEqual({ station: 'Sample Elementary School' });
  expect(filled.company).toEqual({ employer: 'E2E Employer' });
});

test('a civil status that is not Married or Live-in leaves spouse out, whatever the spouse fields hold', () => {
  // The form wipes the spouse fields when it hides them; a value that is still there is not an answer.
  const spouseFields = { fullname: 'Pedro Dela Cruz', spouse_contact_no: '09170000031' };

  for (const civilStatus of ['Single', 'Widowed', 'Separated', '', undefined, null]) {
    const update = toApplicationUpdateInput({ ...BASICS, civil_status: civilStatus, ...spouseFields }, null);
    expect(update, `civil status ${JSON.stringify(civilStatus)}`).not.toHaveProperty('spouse');
    // The rest of the update is still whole.
    expect(update.info).toBeDefined();
    expect(update.detail).toBeDefined();
    expect(update.work).toEqual({});
  }
});

test('with civil status Married or Live-in, spouse is sent even when empty, so the server clears it', () => {
  // Any case, and spaces around it: the form's own test (requiresSpouse).
  for (const civilStatus of ['Married', 'Live-in', 'married', ' LIVE-IN ']) {
    const emptied = toApplicationUpdateInput({ ...FORM_DEFAULTS, ...BASICS, civil_status: civilStatus }, null);
    expect(emptied.spouse, `civil status ${JSON.stringify(civilStatus)}`).toEqual({});
  }

  // With something in it, sent as filled.
  const filled = toApplicationUpdateInput({ ...BASICS, civil_status: 'Married', fullname: 'Pedro Dela Cruz', spouse_contact_no: '09170000031' }, null);
  expect(filled.spouse).toEqual({ fullname: 'Pedro Dela Cruz', contact_no: '09170000031' });
});

test("the civil statuses that show the spouse section are the borrower form's own", () => {
  // The mapper keeps its own copy of BorrowerDetails' requiresSpouse list: fail here if the form changes it.
  const source = fs.readFileSync(path.join(__dirname, '../../../src/app/borrowers/components/TabForm/BorrowerDetails.tsx'), 'utf8');
  expect(source).toContain("['married', 'live-in'].includes(");
});

test('the update has a branch only when one is given as a whole number above 0', () => {
  const read = (branchSubId: string | null) => toApplicationUpdateInput(BASICS, branchSubId);

  expect(read('9102').branch_sub_id).toBe(9102);
  for (const none of [null, '', '  ', '0', '-3', '1.5', 'abc']) {
    expect(read(none), `branch ${JSON.stringify(none)}`).not.toHaveProperty('branch_sub_id');
  }
});

test('the update carries the day applied only when it reads as a Y-m-d day, and the create never does', () => {
  const read = (submittedOn: string | null) => toApplicationUpdateInput(BASICS, null, submittedOn);

  expect(read('2026-09-14').submitted_on).toBe('2026-09-14');
  // Nothing, or something a date input cannot hold: nothing is sent (the server would refuse a malformed day).
  for (const none of [null, '', ' ', '14/09/2026', '2026-9-4', '2026-09-14 10:00:00', 'abc', '2026-09-14T00:00']) {
    expect(read(none), `day ${JSON.stringify(none)}`).not.toHaveProperty('submitted_on');
  }
  // Without the argument, as every earlier caller has it: nothing.
  expect(toApplicationUpdateInput(BASICS, '9102')).not.toHaveProperty('submitted_on');
  // A new application takes the day it is typed in: its input has no such field.
  expect(toApplicationInput({ ...BASICS, submitted_on: '2026-09-14' }, 'walk_in', 9101)).not.toHaveProperty('submitted_on');
  // The branch and the day are independent.
  expect(toApplicationUpdateInput(BASICS, '9102', '2026-09-14')).toMatchObject({ branch_sub_id: 9102, submitted_on: '2026-09-14' });
});

test('submittedDay is the Y-m-d of the server\'s Manila wall clock, or nothing', () => {
  expect(submittedDay('2026-10-04 14:45:58')).toBe('2026-10-04');
  expect(submittedDay('2026-10-01 00:00:00')).toBe('2026-10-01');
  expect(submittedDay('2026-10-04')).toBe('2026-10-04');
  for (const none of [null, undefined, '', '10/4/2026', 'yesterday', '2026-10']) {
    expect(submittedDay(none), `${JSON.stringify(none)}`).toBe('');
  }
});

test('the date input\'s bounds are 2020-01-01 to today, widened to a day the application already holds', () => {
  const today = '2026-10-04';
  expect(DATE_APPLIED_FROM).toBe('2020-01-01');
  expect(dateAppliedBounds('2026-09-21', today)).toEqual({ min: '2020-01-01', max: today });
  expect(dateAppliedBounds('2020-01-01', today)).toEqual({ min: '2020-01-01', max: today });
  expect(dateAppliedBounds(today, today)).toEqual({ min: '2020-01-01', max: today });
  expect(dateAppliedBounds('', today)).toEqual({ min: '2020-01-01', max: today });
  // A day outside them that is already stored must not stop the form from being saved: the bound moves out to it.
  expect(dateAppliedBounds('2019-05-03', today)).toEqual({ min: '2019-05-03', max: today });
  expect(dateAppliedBounds('2026-10-05', today)).toEqual({ min: '2020-01-01', max: '2026-10-05' });
});

test('who is offered the Date applied field: Owner, Admin and Call Center, for a Google Form row without an exact time that is not a borrower', () => {
  const pasted = { channel: 'google_form', exact_time: false, status: 'for_interview', borrower_id: null, branch_sub_id: 9101 } as const;

  expect(canCorrectDateApplied(pasted, true)).toBe(true);
  // Branch staff: never.
  expect(canCorrectDateApplied(pasted, false)).toBe(false);
  // Google gave the exact time, or the row did not come from the Google Form at all.
  expect(canCorrectDateApplied({ ...pasted, exact_time: true }, true)).toBe(false);
  for (const channel of ['facebook', 'walk_in', 'phone', null] as const) {
    expect(canCorrectDateApplied({ ...pasted, channel }, true), String(channel)).toBe(false);
  }
  // A borrower is a record: by its status, or by a borrower linked whatever the status says.
  expect(canCorrectDateApplied({ ...pasted, status: 'borrower_created' }, true)).toBe(false);
  expect(canCorrectDateApplied({ ...pasted, borrower_id: 77 }, true)).toBe(false);
  // Interviewed, declined, with or without a branch: still offered (it has nothing to do with the interview).
  expect(canCorrectDateApplied({ ...pasted, status: 'interviewed' }, true)).toBe(true);
  expect(canCorrectDateApplied({ ...pasted, status: 'declined', branch_sub_id: null }, true)).toBe(true);
  // An answer from a server that does not know the flag reads as exact: nothing is offered that it would refuse.
  const { exact_time: _unknown, ...withoutFlag } = pasted;
  expect(canCorrectDateApplied(withoutFlag as unknown as typeof pasted, true)).toBe(false);
});

test("the preset Positions are the borrower form's own, in its order", () => {
  expect([...REFERENCE_POSITIONS]).toEqual(FORM_DEFAULTS.reference.map((row) => row.occupation));

  // The mapper keeps its own copy of BorrowerDetails' three starting rows: fail here if the form changes them.
  const source = fs.readFileSync(path.join(__dirname, '../../../src/app/borrowers/components/TabForm/BorrowerDetails.tsx'), 'utf8');
  const at = REFERENCE_POSITIONS.map((position) => source.indexOf(`occupation: '${position}'`));
  expect(at.every((index) => index >= 0), 'a preset Position is missing from BorrowerDetails').toBe(true);
  expect(at, 'the presets are in another order in BorrowerDetails').toEqual([...at].sort((a, b) => a - b));
});
