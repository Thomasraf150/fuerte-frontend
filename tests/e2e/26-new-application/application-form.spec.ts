/**
 * toApplicationInput (src/utils/applicationForm.ts): the New application form's values
 * -> createLoanApplication's input; and hasBlankBasic, the check before posting.
 * No browser. Fictional values only.
 *
 * The values are what BorrowerDetails hands its onSubmitBorrower at run time: a number
 * field holds its displayed text once it loses focus ("15,000"), a select holds a
 * string, a picked Chief or Office a number, and a blank Age is NaN (onSubmit's parseInt).
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/26-new-application/application-form.spec.ts --reporter=line
 */
import { test, expect } from '@playwright/test';
import {
  APPLICATION_REQUIRED_FIELDS, CHANNELS, CHANNEL_LABELS, hasBlankBasic, toApplicationInput,
} from '../../../src/utils/applicationForm';

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
  info: { firstname: 'Juana', lastname: 'Dela Cruz', amount_applied: '15000', purpose: 'Store capital' },
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
      firstname: 'Juana',
      middlename: 'Santos',
      lastname: 'Dela Cruz',
      amount_applied: '15000',
      purpose: 'Store capital',
      chief_id: 9202,
      terms_of_payment: '12 months',
      residence_address: '11 Sample Street, Sample City',
      is_rent: 1,
      other_source_of_inc: 'Sari-sari store',
      est_monthly_fam_inc: '25,000',
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
      salary: '18,000',
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
