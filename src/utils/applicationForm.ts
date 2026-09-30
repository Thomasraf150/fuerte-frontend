/**
 * New application (/applications/new): the "Saan galing" choices, the fields the
 * form requires, and the mapper from the borrower Details form's values to
 * createLoanApplication's input (fuerte-backend/graphql/loanapplication.graphql,
 * LoanApplicationInput).
 *
 * Pure (no React, no network), so the Playwright runner tests it directly:
 * tests/e2e/26-new-application/application-form.spec.ts.
 */
import type { LoanApplicationChannel } from '@/utils/DataTypes';

/** Saan galing's four choices, in the order the form shows them. Keep in sync with LoanApplication::CHANNELS. */
export const CHANNELS = ['google_form', 'facebook', 'walk_in', 'phone'] as const satisfies readonly LoanApplicationChannel[];

export const CHANNEL_LABELS: Readonly<Record<LoanApplicationChannel, string>> = {
  google_form: 'Google Form',
  facebook: 'Facebook Messenger',
  walk_in: 'Walk-in',
  phone: 'Tawag o Text',
};

/** The same, short enough for the line under a name in the Applications list. */
export const CHANNEL_SHORT_LABELS: Readonly<Record<LoanApplicationChannel, string>> = {
  google_form: 'Google Form',
  facebook: 'Messenger',
  walk_in: 'Walk-in',
  phone: 'Tawag/Text',
};

/** The basics New application requires (BorrowerDetails' `requiredFields`). Saan galing is required by its own field. */
export const APPLICATION_REQUIRED_FIELDS: ReadonlySet<string> = new Set([
  'firstname',
  'lastname',
  'contact_no',
  'amount_applied',
  'purpose',
  'branch_sub_id',
]);

/**
 * What BorrowerDetails submits, by form field name. Loosely typed on purpose: the
 * form's values do not match BorrowerInfo at run time (a number field holds its
 * displayed text, a select holds a string), so every value is read as unknown.
 */
export type ApplicationFormValues = Readonly<Record<string, unknown>>;

type InputValue = string | number;

/** One group of the input: only the fields that were filled in. */
export type ApplicationInputGroup = Record<string, InputValue>;

/** createLoanApplication's `input`. */
export interface LoanApplicationInput {
  channel: LoanApplicationChannel;
  branch_sub_id: number;
  info: ApplicationInputGroup & { firstname: string; lastname: string; amount_applied: string; purpose: string };
  detail: ApplicationInputGroup & { contact_no: string };
  spouse?: ApplicationInputGroup;
  work?: ApplicationInputGroup;
  company?: ApplicationInputGroup;
  references?: ApplicationInputGroup[];
}

/** Reads one input field from the form's values; undefined means "not filled in". */
type Reader = (values: ApplicationFormValues) => InputValue | undefined;

/** Not filled in: blank, or the NaN BorrowerDetails makes of an empty Age. */
const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || Number.isNaN(value);

/**
 * An amount as plain digits. A number field keeps its displayed text once it loses
 * focus ("15,000"), and the server takes only /^\d+(\.\d{1,2})?$/.
 */
export const plainAmount = (value: unknown): string | undefined => {
  if (isBlank(value)) return undefined;
  const digits = String(value).replace(/[\s,]/g, '');
  return digits === '' ? undefined : digits;
};

/** Text as typed. */
const text = (field: string): Reader => (values) =>
  isBlank(values[field]) ? undefined : String(values[field]);

/** An amount; with zeroIsBlank, a 0 is the form's own default rather than an answer. */
const amount = (field: string, zeroIsBlank = false): Reader => (values) => {
  const digits = plainAmount(values[field]);
  return digits !== undefined && zeroIsBlank && Number(digits) === 0 ? undefined : digits;
};

/** A whole number, such as Age. The schema types these Int. */
const whole = (field: string): Reader => (values) => {
  const n = isBlank(values[field]) ? NaN : Number(values[field]);
  return Number.isInteger(n) ? n : undefined;
};

/** The id of a picked Chief, Office, Area or Sub Area. The form's 0, null and '' mean none was picked. */
const pickedId = (field: string): Reader => (values) => {
  const id = Number(values[field]);
  return !isBlank(values[field]) && Number.isInteger(id) && id > 0 ? id : undefined;
};

/** Own (0) or Rent (1). The form starts on Own, so the choice only counts beside an address. */
const residency: Reader = (values) =>
  isBlank(values.residence_address) ? undefined : whole('is_rent')(values);

/** Input field -> how it is read from the form. The basics are added separately (see toApplicationInput). */
const INFO: Record<string, Reader> = {
  middlename: text('middlename'),
  chief_id: pickedId('chief_id'),
  terms_of_payment: text('terms_of_payment'),
  residence_address: text('residence_address'),
  is_rent: residency,
  other_source_of_inc: text('other_source_of_inc'),
  est_monthly_fam_inc: text('est_monthly_fam_inc'),
  employment_position: text('employment_position'),
  gender: text('gender'),
};

const DETAIL: Record<string, Reader> = {
  email: text('email'),
  dob: text('dob'),
  place_of_birth: text('place_of_birth'),
  age: whole('age'),
  civil_status: text('civil_status'),
};

/** The form calls the spouse's number spouse_contact_no. */
const SPOUSE: Record<string, Reader> = {
  work_address: text('work_address'),
  occupation: text('occupation'),
  fullname: text('fullname'),
  company: text('company'),
  dept_branch: text('dept_branch'),
  length_of_service: text('length_of_service'),
  salary: text('salary'),
  company_contact_person: text('company_contact_person'),
  contact_no: text('spouse_contact_no'),
};

/** The form starts Monthly Gross and Monthly Net at 0. */
const WORK: Record<string, Reader> = {
  company_borrower_id: pickedId('company_borrower_id'),
  employment_number: text('employment_number'),
  area_id: pickedId('area_id'),
  sub_area_id: pickedId('sub_area_id'),
  station: text('station'),
  term_in_service: text('term_in_service'),
  employment_status: text('employment_status'),
  division: text('division'),
  monthly_gross: amount('monthly_gross', true),
  monthly_net: amount('monthly_net', true),
  office_address: text('office_address'),
};

/** The form calls the company salary company_salary. */
const COMPANY: Record<string, Reader> = {
  employer: text('employer'),
  salary: amount('company_salary'),
  contract_duration: text('contract_duration'),
};

const REFERENCE: Record<string, Reader> = {
  occupation: text('occupation'),
  name: text('name'),
  contact_no: text('contact_no'),
};

const OPTIONAL_GROUPS = [
  ['spouse', SPOUSE],
  ['work', WORK],
  ['company', COMPANY],
] as const;

/** The fields of one group that were filled in. */
function filled(readers: Record<string, Reader>, values: ApplicationFormValues): ApplicationInputGroup {
  const group: ApplicationInputGroup = {};
  for (const [field, read] of Object.entries(readers)) {
    const value = read(values);
    if (value !== undefined) group[field] = value;
  }
  return group;
}

/** Reference rows with a name or a number. The position is prefilled, so on its own it is no reference. */
function references(rows: unknown): ApplicationInputGroup[] {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => filled(REFERENCE, (row ?? {}) as ApplicationFormValues))
    .filter((row) => row.name !== undefined || row.contact_no !== undefined);
}

/** The basics the input cannot go without: the name, mobile, amount and purpose. */
const BASICS = ['firstname', 'lastname', 'contact_no', 'amount_applied', 'purpose'] as const;

/**
 * Whether a basic is blank once trimmed: only spaces pass react-hook-form's `required`.
 * Check this before posting. The backend's TrimStrings and ConvertEmptyStringsToNull
 * middleware turn a blank into null before Lighthouse reads it, so a blank basic comes
 * back as a GraphQL type error ("Variable "$input" got invalid value null"), not as
 * the field's own "required" message.
 */
export const hasBlankBasic = (values: ApplicationFormValues): boolean =>
  BASICS.some((field) => String(values[field] ?? '').trim() === '');

/**
 * createLoanApplication's input from the form's values. Whatever was not filled in
 * is left out: blanks, NaN, the form's own defaults (Chief 0, no Office, no Area,
 * Monthly Gross/Net 0, Own without an address) and the prefilled reference
 * positions; so is a group left with nothing. photo, id and user_id are never read.
 * The basics are always in the output, as the input type requires them; a blank one
 * must be stopped before posting (see hasBlankBasic).
 */
export function toApplicationInput(
  values: ApplicationFormValues,
  channel: LoanApplicationChannel,
  branchSubId: number | string,
): LoanApplicationInput {
  const input: LoanApplicationInput = {
    channel,
    branch_sub_id: Number(branchSubId),
    info: {
      firstname: String(values.firstname ?? ''),
      lastname: String(values.lastname ?? ''),
      amount_applied: plainAmount(values.amount_applied) ?? '',
      purpose: String(values.purpose ?? ''),
      ...filled(INFO, values),
    },
    detail: { contact_no: String(values.contact_no ?? ''), ...filled(DETAIL, values) },
  };
  for (const [key, readers] of OPTIONAL_GROUPS) {
    const group = filled(readers, values);
    if (Object.keys(group).length) input[key] = group;
  }
  const rows = references(values.reference);
  if (rows.length) input.references = rows;
  return input;
}
