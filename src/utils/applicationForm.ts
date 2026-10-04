/**
 * New application (/applications/new) and an application's own page: the "Saan
 * galing" choices, the fields the form requires, and the mappers between the
 * borrower Details form's values and an application:
 *   - toApplicationInput: the form's values to createLoanApplication's input
 *     (fuerte-backend/graphql/loanapplication.graphql, LoanApplicationInput). The applicant's
 *     first, middle and last name go in CAPITALS (see capitals), here and in the update;
 *   - toApplicationUpdateInput: the same, to updateLoanApplication's input, except that a
 *     section emptied in the form is sent empty, so the server clears it, and that it can carry
 *     the day applied, corrected (submitted_on);
 *   - fromApplicationRecord: a saved application back to the form's starting values, the
 *     three names in capitals too, so a borrower made from the application is filed in capitals.
 *
 * Pure (no React, no network), so the Playwright runner tests it directly:
 * tests/e2e/26-new-application/application-form.spec.ts.
 */
import { notConvertibleReason } from './convertApplication';
import type {
  BorrowerInfo, LoanApplicationChannel, LoanApplicationInputGroup, LoanApplicationRecord,
  LoanApplicationReference, LoanApplicationUpdateInput, Reference,
} from '@/utils/DataTypes';

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
export type ApplicationInputGroup = LoanApplicationInputGroup;

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

/**
 * The applicant's names are filed in capitals, as Fuerte's borrowers are (4,535 of 4,604 first
 * names are all capitals). toUpperCase does not depend on the locale and turns "ñ" into "Ñ".
 * Only these three: a spouse's or a reference's name keeps its case. Blank stays blank.
 */
const capitals = (value: unknown): string => String(value ?? '').toUpperCase();

/** The middle name, in capitals; nothing when it is blank. */
const capsText = (field: string): Reader => (values) =>
  isBlank(values[field]) ? undefined : capitals(values[field]);

/** The form fields the applicant's names are typed in. */
const NAME_FIELDS: ReadonlySet<string> = new Set(['firstname', 'middlename', 'lastname']);

/** An amount; with zeroIsBlank, a 0 is the form's own default rather than an answer. */
const amount = (field: string, zeroIsBlank = false): Reader => (values) => {
  const digits = plainAmount(values[field]);
  return digits !== undefined && zeroIsBlank && Number(digits) === 0 ? undefined : digits;
};

/** A plain number written with thousands separators: "12,500", "1,234,567.89". */
const SEPARATED_NUMBER = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;

/**
 * Text as typed, except that a plain number written with thousands separators goes as plain
 * digits, as an amount does ("12,500" -> "12500"). Est. Monthly Family Income and the spouse's
 * salary are TEXT on the server (max 50), so words stay as written ("about 30k"); but their
 * fields show a number with separators, and react-hook-form takes the text a field SHOWS when
 * it loses focus. Read as plain text, tabbing through a stored "12500" would turn it into
 * "12,500": an edit nobody made, saved or flagged as unsaved.
 */
const figures = (field: string): Reader => (values) => {
  const shown = text(field)(values);
  if (shown === undefined) return undefined;
  const plain = String(shown).trim();
  return SEPARATED_NUMBER.test(plain) ? plain.replace(/,/g, '') : shown;
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
  middlename: capsText('middlename'),
  chief_id: pickedId('chief_id'),
  terms_of_payment: text('terms_of_payment'),
  residence_address: text('residence_address'),
  is_rent: residency,
  other_source_of_inc: text('other_source_of_inc'),
  est_monthly_fam_inc: figures('est_monthly_fam_inc'),
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
  salary: figures('salary'),
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

/** What the create and the update input share: the groups, cleaned. */
type ApplicationGroups = Omit<LoanApplicationInput, 'channel' | 'branch_sub_id'>;

/**
 * The input's groups from the form's values. Whatever was not filled in is left out:
 * blanks, NaN, the form's own defaults (Chief 0, no Office, no Area, Monthly Gross/Net
 * 0, Own without an address) and the prefilled reference positions; so is a group left
 * with nothing. photo, id and user_id are never read. The basics are always in the
 * output, as the create input requires them; a blank one must be stopped before
 * posting (see hasBlankBasic).
 */
function applicationGroups(values: ApplicationFormValues): ApplicationGroups {
  const groups: ApplicationGroups = {
    info: {
      firstname: capitals(values.firstname),
      lastname: capitals(values.lastname),
      amount_applied: plainAmount(values.amount_applied) ?? '',
      purpose: String(values.purpose ?? ''),
      ...filled(INFO, values),
    },
    detail: { contact_no: String(values.contact_no ?? ''), ...filled(DETAIL, values) },
  };
  for (const [key, readers] of OPTIONAL_GROUPS) {
    const group = filled(readers, values);
    if (Object.keys(group).length) groups[key] = group;
  }
  const rows = references(values.reference);
  if (rows.length) groups.references = rows;
  return groups;
}

/** createLoanApplication's input from the form's values (see applicationGroups for what is left out). */
export function toApplicationInput(
  values: ApplicationFormValues,
  channel: LoanApplicationChannel,
  branchSubId: number | string,
): LoanApplicationInput {
  return { channel, branch_sub_id: Number(branchSubId), ...applicationGroups(values) };
}

/**
 * The civil statuses with which BorrowerDetails shows its spouse section, in any case
 * (its `requiresSpouse`). Keep in sync with it.
 */
const SPOUSE_CIVIL_STATUSES: readonly string[] = ['married', 'live-in'];

/** Whether the form's spouse section is shown for these values. */
const showsSpouse = (values: ApplicationFormValues): boolean =>
  SPOUSE_CIVIL_STATUSES.includes(String(values.civil_status ?? '').trim().toLowerCase());

/** A day as `Y-m-d`, which is what a date input holds and the update takes. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The earliest day the date applied can be corrected to: the server's floor. */
export const DATE_APPLIED_FROM = '2020-01-01';

/** "2026-10-04 14:45:58" (the server's Manila wall clock) → "2026-10-04"; empty when there is no date. */
export const submittedDay = (submittedAt: string | null | undefined): string => {
  const day = String(submittedAt ?? '').slice(0, 10);
  return DAY.test(day) ? day : '';
};

/**
 * The bounds of the Date applied input: from 2020-01-01 to `today` (a Manila `Y-m-d`), widened to
 * admit the day the application already has. A native bound blocks the WHOLE form, not just the
 * field (see Date of Birth in BorrowerDetails), so an untouched date outside the range would make
 * the application unsaveable for any other edit.
 */
export function dateAppliedBounds(loadedDay: string, today: string): { min: string; max: string } {
  return {
    min: loadedDay && loadedDay < DATE_APPLIED_FROM ? loadedDay : DATE_APPLIED_FROM,
    max: loadedDay > today ? loadedDay : today,
  };
}

/**
 * Whether the page offers the Date applied field. Only Owner, Admin and Call Center (`mayAssign`,
 * useCanUpload's answer) may correct it, and only for a Google Form application whose time did not
 * come from Google's download (`exact_time` is false): a Sheet paste or a PDF knows the day at best.
 * A borrower is a record, not a form. The server checks all of it again. An answer without
 * `exact_time` is read as exact, so nothing is offered that the server would not take.
 */
export const canCorrectDateApplied = (
  record: Pick<LoanApplicationRecord, 'channel' | 'exact_time' | 'status' | 'borrower_id' | 'branch_sub_id'>,
  mayAssign: boolean,
): boolean =>
  mayAssign && record.channel === 'google_form' && record.exact_time === false && notConvertibleReason(record) !== 'converted';

/**
 * updateLoanApplication's input from the form's values: toApplicationInput's cleaning
 * (applicationGroups), without a channel, and with its own rule for the groups. The
 * server KEEPS a group the input leaves out and CLEARS one that is sent empty
 * (graphql/loanapplication.graphql, LoanApplicationUpdateInput), so:
 *   - info and detail are always sent;
 *   - work, company and references are always sent, empty ({} or []) when the form has
 *     nothing in them, so a section emptied in the form is cleared on the server;
 *   - spouse is sent, even as {}, only while the spouse section is shown (civil status
 *     Married or Live-in). Hidden, BorrowerDetails wipes any spouse values it was started
 *     with, so the form says nothing about what is stored: spouse is left out, and the
 *     stored one stays. This holds whatever the spouse fields hold.
 * The branch goes only when one is picked and reads as a whole number above 0, so an
 * empty picker never sends one. The day applied (`submittedOn`) goes only when it reads as a
 * `Y-m-d` day: the caller passes it only when the form changed it.
 */
export function toApplicationUpdateInput(
  values: ApplicationFormValues,
  branchSubId: string | null,
  submittedOn: string | null = null,
): LoanApplicationUpdateInput {
  const { spouse, ...groups } = applicationGroups(values);
  const input: LoanApplicationUpdateInput = {
    ...groups,
    work: groups.work ?? {},
    company: groups.company ?? {},
    references: groups.references ?? [],
  };
  if (showsSpouse(values)) input.spouse = spouse ?? {};
  const branch = Number(branchSubId);
  if (branchSubId && Number.isInteger(branch) && branch > 0) input.branch_sub_id = branch;
  if (submittedOn && DAY.test(submittedOn)) input.submitted_on = submittedOn;
  return input;
}

/*
 * The other way: a saved application as the borrower Details form's starting values
 * (BorrowerDetails' `initialValues`). It undoes toApplicationInput's renames
 * (spouse.contact_no -> spouse_contact_no, company.salary -> company_salary,
 * references -> reference), and a stored field goes back under the type the form
 * keeps it in. Fields with nothing stored are left out, so the form's own defaults
 * stand (BorrowerDetails starts from { ...defaultValues, ...initialValues }), except
 * where the default would post something the update refuses or invent an answer: the
 * amount, whose default 0 posts "0" (see fromApplicationRecord). The other numeric
 * defaults post nothing: the Chief 0, the Monthly Gross and Net 0 and Own without an
 * address are all dropped by the input builders.
 */

type StoredGroupName = 'info' | 'detail' | 'spouse' | 'work' | 'company';

/** The fields each stored group holds: everything toApplicationInput can send. */
const STORED_FIELDS: Record<StoredGroupName, readonly string[]> = {
  info: ['firstname', 'lastname', 'amount_applied', 'purpose', ...Object.keys(INFO)],
  detail: ['contact_no', ...Object.keys(DETAIL)],
  spouse: Object.keys(SPOUSE),
  work: Object.keys(WORK),
  company: Object.keys(COMPANY),
};

/** The form's name for a stored field, where it is not the field's own: the renames in SPOUSE and COMPANY, undone. */
const FORM_NAME: Readonly<Record<string, string>> = {
  'spouse.contact_no': 'spouse_contact_no',
  'company.salary': 'company_salary',
};

/**
 * The fields the form keeps as numbers: the Chief and Office picks, Own (0) or Rent
 * (1), and Age. Every other field it keeps as text, money included: an amount stays
 * the string it was stored as ("15000.00"), never a float.
 */
const FORM_NUMBERS: ReadonlySet<string> = new Set(['chief_id', 'company_borrower_id', 'is_rent', 'age']);

/** The form's three preset reference rows' Positions, in order (BorrowerDetails' defaultValues.reference). Keep in sync with it. */
export const REFERENCE_POSITIONS = [
  'Supervisor/Princpal',
  'Administrative Officer/Master Teacher/Head Teacher',
  'Co-worker',
] as const;

/** One stored value as the form holds it; undefined means nothing is stored. */
function formValue(field: string, stored: unknown): string | number | undefined {
  if (isBlank(stored)) return undefined;
  if (!FORM_NUMBERS.has(field)) return String(stored);
  const n = Number(stored);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * One stored group's fields under the form's names. The applicant's names come back in capitals
 * even when they were stored otherwise (the Google Form delivers whatever was typed), so the
 * form shows, and a borrower made from the application is saved with, what a save would store.
 */
function restoreGroup(group: StoredGroupName, stored: object | null | undefined): Record<string, string | number> {
  const stock = (stored ?? {}) as Record<string, unknown>;
  const form: Record<string, string | number> = {};
  for (const key of STORED_FIELDS[group]) {
    const field = FORM_NAME[`${group}.${key}`] ?? key;
    const value = formValue(field, stock[key]);
    if (value === undefined) continue;
    form[field] = group === 'info' && NAME_FIELDS.has(field) ? capitals(value) : value;
  }
  return form;
}

const referenceText = (value: unknown): string => (isBlank(value) ? '' : String(value));

/**
 * The form's reference rows. Each stored reference takes a row, in its stored order,
 * with the fields it has and no others: a reference stored without a Position is not
 * given a preset one, or saving would invent it. The preset rows the stored ones do
 * not reach stay as the form starts them, so there are always at least three rows.
 */
function restoreReferences(stored: readonly LoanApplicationReference[] | null | undefined): Reference[] {
  const rows: Reference[] = (stored ?? []).map((reference) => ({
    occupation: referenceText(reference.occupation),
    name: referenceText(reference.name),
    contact_no: referenceText(reference.contact_no),
  }));
  const presets: Reference[] = REFERENCE_POSITIONS.slice(rows.length).map((occupation) => ({
    occupation,
    name: '',
    contact_no: '',
  }));
  return [...rows, ...presets];
}

/**
 * The borrower Details form's starting values from a saved application. `intake_flags`
 * and the Google Form's answers are notes for staff, not form fields: never mapped.
 * Money stays a string although BorrowerInfo types it number: the form holds money as
 * the text it shows (see ApplicationFormValues).
 */
export function fromApplicationRecord(record: LoanApplicationRecord): Partial<BorrowerInfo> {
  const details = record.details as LoanApplicationRecord['details'] | null | undefined; // never null by the schema; read as if it could be
  const form: Record<string, unknown> = {
    chief_id: 0, // the form's own "no Chief picked"; a stored Chief replaces it
    // The form's default is the number 0: a box that looks empty but posts "0", which the update
    // refuses (min:0.01) although the amount may be blank. A stored amount replaces this.
    amount_applied: '',
    ...restoreGroup('info', details?.info),
    ...restoreGroup('detail', details?.detail),
    ...restoreGroup('spouse', details?.spouse),
    ...restoreGroup('work', details?.work),
    ...restoreGroup('company', details?.company),
    reference: restoreReferences(details?.references),
  };
  // The picker holds the branch's id as text, as its options do.
  if (!isBlank(record.branch_sub_id)) form.branch_sub_id = String(record.branch_sub_id);
  return form as Partial<BorrowerInfo>;
}
