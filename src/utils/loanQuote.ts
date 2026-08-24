/**
 * Loan Calculator — quote derivation helpers.
 *
 * SCOPE: this module derives NOTHING about pricing. Every peso figure the
 * borrower is shown (deductions, PN, proceeds, add-on) comes verbatim from the
 * backend `processALoan(process_type: "Compute")` response, so the quote can
 * never disagree with the loan that is eventually booked.
 *
 * The ONE formula reproduced here is `LoanMutation::saveLoanSchedule`'s
 * per-installment split, in fuerte-backend/app/GraphQL/Mutations/Loans/LoanMutation.php
 * (search for `$pnTotal = bcadd` inside saveLoanSchedule):
 *
 *   pnTotal    = pn_amount + addon_amount            // bcadd(.., 2)
 *   perAmount  = pnTotal / dateCount                 // bcdiv(.., 2)  -> TRUNCATES
 *   lastAmount = pnTotal - perAmount * (count - 1)   // absorbs the cent remainder
 *
 * It is reproduced (rather than fetched) because the server exposes no schedule
 * preview: due dates are generated client-side and posted to the server as
 * `selectedDate`, so no endpoint can return a schedule for an unsaved loan.
 *
 * CRITICAL — bcdiv TRUNCATES toward zero, it does not round. Decimal.js defaults
 * to ROUND_HALF_UP, so every division here passes ROUND_DOWN explicitly. Using
 * the default would put the quote a centavo above the schedule that gets written.
 *
 * WHY NOT `monthly_amort`: the Compute response carries a `monthly_amort` field,
 * but it divides `pn` alone (excluding `addon_amount`) by `loan_product.terms`
 * (not by the number of due dates). On a twice-a-month product the real
 * installment is about half of it, and on the 128 live products with
 * `addon_terms > 0` it omits the add-on entirely. It must never be shown to a
 * borrower as "your payment". See deriveInstallments() instead.
 */

import Decimal from 'decimal.js';
import {
  generateMonthlySchedule,
  generateSemiMonthlySchedule,
  generateThriceMonthlySchedule,
  generateWeeklySchedule,
  generateTwiceMonthOtherWeekSchedule,
} from '@/utils/effectivityDateUtils';

// The bundled @types/decimal.js is outdated and does not expose the instance
// type; alias it the same way src/utils/financial.ts does.
type DecimalType = InstanceType<typeof Decimal>;

/** Payment cadences offered by the calculator, mirroring SetEffectivityMaturity. */
export type Cadence =
  | 'once_a_month'
  | 'twice_a_month'
  | 'twice_a_month_other_week'
  | 'thrice_a_month'
  | 'weekly';

export const CADENCE_OPTIONS: ReadonlyArray<{ value: Cadence; label: string }> = [
  { value: 'once_a_month', label: 'Once a month' },
  { value: 'twice_a_month', label: 'Twice a month (cutoff)' },
  { value: 'twice_a_month_other_week', label: 'Twice a month (other week)' },
  { value: 'thrice_a_month', label: 'Thrice a month' },
  { value: 'weekly', label: 'Weekly' },
] as const;

/** Deduction amounts as returned by Compute (all peso strings). */
export interface ComputeDeductions {
  udi: string;
  processing: string;
  agent_fee: string;
  collection: string;
  insurance: string;
  insurance_fee: string;
  notarial: string;
}

/**
 * Percentage rates behind the deductions.
 *
 * NOTE: only FIVE members — `notarial` and `insurance_fee` are flat peso
 * charges with no rate (graphql/loans.graphql DeductionDetailsRate). A UI that
 * assumes a rate for every deduction row prints "undefined%".
 */
export interface ComputeDeductionRates {
  udi: string;
  processing: string;
  agent_fee: string;
  collection: string;
  insurance: string;
}

/**
 * The full `processALoan(process_type: "Compute")` payload.
 *
 * Every field is nullable in the schema. On the happy path the resolver never
 * sets `success`/`loan_id`/`message`, so they come back null — test
 * `success === false` for failure, never `success === true` for success.
 */
export interface ComputeResponse {
  deductions: ComputeDeductions | null;
  deduction_rate: ComputeDeductionRates | null;
  total_deductions: string | null;
  loan_proceeds: string | null;
  terms: string | null;
  pn: string | null;
  monthly_amort: string | null;
  ob: string | null;
  rebates: string | null;
  penalty: string | null;
  addon_terms: string | null;
  addon_udi_rate: string | null;
  addon_amount: string | null;
  addon_udi: string | null;
  addon_total: string | null;
  new_loan_proceeds: string | null;
  success: boolean | null;
  loan_id: string | null;
  message: string | null;
}

/** One row of the previewed amortization schedule. */
export interface ScheduleRow {
  /** 1-based installment number. */
  index: number;
  /** Due date, 'MM/dd/yyyy' — the same format saveLoanSchedule consumes. */
  dueDate: string;
  /** Amount due, 2dp string. */
  amount: string;
  /** Interest (UDI) portion of the installment, 2dp string. */
  interest: string;
}

/** Parse a possibly-null peso string into a Decimal, never NaN. */
function toDecimal(value: string | null | undefined): DecimalType {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  const cleaned = String(value).replace(/,/g, '').trim();
  try {
    const d = new Decimal(cleaned);
    return d.isFinite() ? d : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
}

/**
 * Truncate toward zero at 2dp — the JS equivalent of PHP's `bcdiv($a, $b, 2)`.
 * ROUND_DOWN (not ROUND_HALF_UP, not Math.floor which breaks on negatives).
 */
function truncate2(value: DecimalType): DecimalType {
  return value.toDecimalPlaces(2, Decimal.ROUND_DOWN);
}

/**
 * Total the borrower repays = `pn` + `addon_amount`.
 *
 * This is the exact figure saveLoanSchedule divides (its `$pnTotal = bcadd(...)`),
 * NOT `pn` alone — the add-on months are repaid too.
 */
export function totalPayable(comp: ComputeResponse): string {
  return toDecimal(comp.pn).plus(toDecimal(comp.addon_amount)).toFixed(2);
}

/**
 * Split a total across `count` installments the way the backend will.
 *
 * Every row but the last is the truncated quotient; the last row absorbs the
 * cent remainder so the rows sum to the total exactly.
 *
 * @param total 2dp peso string
 * @param count number of installments (must be >= 1)
 * @returns array of 2dp peso strings, length `count`, summing exactly to `total`
 */
export function deriveInstallments(total: string, count: number): string[] {
  if (!Number.isFinite(count) || count < 1) return [];

  const totalDec = toDecimal(total);
  const per = truncate2(totalDec.dividedBy(count));

  if (count === 1) return [totalDec.toFixed(2)];

  const head = new Array(count - 1).fill(per.toFixed(2));
  const last = totalDec.minus(per.times(count - 1));
  return [...head, last.toFixed(2)];
}

/**
 * Build the previewed schedule from server totals plus locally generated dates.
 *
 * @param dates due dates in 'MM/dd/yyyy'
 * @param comp the Compute response (source of every peso figure)
 */
export function buildSchedule(dates: string[], comp: ComputeResponse): ScheduleRow[] {
  if (dates.length === 0) return [];

  const amounts = deriveInstallments(totalPayable(comp), dates.length);
  // The UDI schedule is split by the same rule over the UDI deduction alone
  // (saveLoanSchedule's `$perMonthUdi = bcdiv($udiTotal, ...)`).
  const interests = deriveInstallments(comp.deductions?.udi ?? '0', dates.length);

  return dates.map((dueDate, i) => ({
    index: i + 1,
    dueDate,
    amount: amounts[i] ?? '0.00',
    interest: interests[i] ?? '0.00',
  }));
}

/** Options describing where the due dates fall. */
export interface CadenceConfig {
  cadence: Cadence;
  /** Reference date the first due date is snapped forward from. */
  refDate: Date;
  /** Fixed day for monthly / other-week cadences. */
  dayOfMonth: number;
  /** Cutoff pair for twice-a-month. */
  day1: number;
  day2: number;
  /** Cutoff triple for thrice-a-month. */
  thriceDays: [number, number, number];
  /** 0 = Sunday … 6 = Saturday, for weekly. */
  weekday: number;
}

/**
 * Generate the due dates for a term, matching the cadence multipliers the
 * release screens already use (TwiceAMonth ×2, ThriceAMonth ×3, weekly ×4).
 *
 * @param termMonths product `terms` + `addon_terms` — the add-on months are
 *   folded into the main count, as every non-manual release tab does.
 */
export function generateDueDates(termMonths: number, cfg: CadenceConfig): string[] {
  if (!Number.isFinite(termMonths) || termMonths < 1) return [];

  // An Invalid Date here is not theoretical: `<input type="date">` emits '' the
  // moment the operator clears or partially edits the field, and
  // `new Date('T00:00:00')` is Invalid Date. date-fns `format()` throws
  // RangeError on it, and because this runs inside a render-phase useMemo — and
  // the app has NO error boundary anywhere — the throw unmounts the entire
  // layout: a white screen in front of the borrower, mid-quote. Degrade to an
  // empty schedule instead; it repopulates as soon as the date is valid again.
  if (!(cfg.refDate instanceof Date) || Number.isNaN(cfg.refDate.getTime())) return [];

  switch (cfg.cadence) {
    case 'twice_a_month':
      return generateSemiMonthlySchedule(cfg.refDate, cfg.day1, cfg.day2, termMonths);
    case 'twice_a_month_other_week':
      return generateTwiceMonthOtherWeekSchedule(cfg.refDate, cfg.dayOfMonth, termMonths);
    case 'thrice_a_month':
      return generateThriceMonthlySchedule(
        cfg.refDate,
        cfg.thriceDays[0],
        cfg.thriceDays[1],
        cfg.thriceDays[2],
        termMonths,
      );
    case 'weekly':
      // 4 weeks per month, matching DayOfTheWeek.tsx — a 12-month weekly loan
      // yields 48 installments, so the preview ends ~a month before the
      // calendar anniversary. Surfaced in the UI as an indicative date.
      return generateWeeklySchedule(cfg.refDate, cfg.weekday, termMonths * 4);
    case 'once_a_month':
    default:
      return generateMonthlySchedule(cfg.refDate, cfg.dayOfMonth, termMonths);
  }
}

/**
 * Strip grouping commas and reject anything non-numeric.
 *
 * `loan_amount` reaches the resolver as an unvalidated GraphQL String with no
 * `@rules`, and PHP casts "50,000.00" to 50.0 with only a warning — pricing the
 * whole loan against fifty pesos. This is the only guard.
 */
export function sanitizeAmount(raw: unknown): string {
  const cleaned = String(raw ?? '').replace(/,/g, '').trim();
  if (cleaned === '' || !/^\d*\.?\d*$/.test(cleaned)) return '';
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? cleaned : '';
}

/* ------------------------------------------------------------------ *
 * Manual rate card
 *
 * For quoting a product the office has not set up yet — the operator types
 * the rates and the SERVER still does the pricing (a `manual_product` on
 * LoanComputationInput makes the resolver synthesise an unsaved LoanProducts
 * and run the identical arithmetic). No pricing formula is duplicated here.
 * ------------------------------------------------------------------ */

/** Operator-typed rate card. All numeric fields are raw input strings. */
export interface ManualProduct {
  terms: string;
  udi: string;
  processing: string;
  agent_fee: string;
  collection: string;
  insurance: string;
  insurance_fee: string;
  notarial: string;
  /** 1 = fees deducted from the payout; 0 = fees added on top of the note. */
  base_deduction: number;
  addon_terms: string;
  addon_udi_rate: string;
}

export const EMPTY_MANUAL_PRODUCT: ManualProduct = {
  terms: '',
  udi: '',
  processing: '',
  agent_fee: '',
  collection: '',
  insurance: '',
  insurance_fee: '',
  notarial: '',
  base_deduction: 1,
  addon_terms: '',
  addon_udi_rate: '',
};

/** Percentage inputs and their ceiling — mirrors MANUAL_MAX_RATE server-side. */
const MANUAL_RATE_FIELDS: ReadonlyArray<[keyof ManualProduct, string]> = [
  ['udi', 'U.D.I'],
  ['processing', 'processing fee'],
  ['agent_fee', 'agent fee'],
  ['collection', 'collection fee'],
  ['insurance', 'insurance'],
  ['addon_udi_rate', 'add-on U.D.I'],
];

const MANUAL_FEE_FIELDS: ReadonlyArray<[keyof ManualProduct, string]> = [
  ['insurance_fee', 'insurance fee'],
  ['notarial', 'notarial fee'],
];

const MAX_RATE = 1000;
// The one field that sets the ROW COUNT. Real catalogue max is 60 terms + 36
// add-on; a 5-digit typo would mount tens of thousands of un-virtualised rows.
const MAX_TERMS = 360;
const MAX_FEE = 10000000;

/** True for '', or a non-negative number within `max`. Commas are not allowed. */
function isBlankOrBounded(raw: string, max: number): boolean {
  const value = (raw ?? '').trim();
  if (value === '') return true;
  if (!/^\d*\.?\d*$/.test(value)) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max;
}

/**
 * Validate a manual rate card, mirroring the server's guard so the operator
 * gets the error instantly instead of after a round-trip.
 *
 * Returns an error message, or null when the card is usable.
 */
export function validateManualProduct(manual: ManualProduct): string | null {
  const terms = Number((manual.terms ?? '').trim());
  if (!Number.isInteger(terms) || terms < 1) {
    return 'Enter the number of terms (a whole number, at least 1).';
  }
  if (terms > MAX_TERMS) {
    return `Terms cannot exceed ${MAX_TERMS} months.`;
  }

  for (const [field, label] of MANUAL_RATE_FIELDS) {
    if (!isBlankOrBounded(String(manual[field] ?? ''), MAX_RATE)) {
      return `The ${label} must be a number between 0 and ${MAX_RATE}%.`;
    }
  }

  for (const [field, label] of MANUAL_FEE_FIELDS) {
    if (!isBlankOrBounded(String(manual[field] ?? ''), MAX_FEE)) {
      return `The ${label} must be a peso amount of 0 or more.`;
    }
  }

  const addonTerms = (manual.addon_terms ?? '').trim();
  if (addonTerms !== '' && !/^\d+$/.test(addonTerms)) {
    return 'Add-on terms must be a whole number of months (or left blank).';
  }
  if (addonTerms !== '' && Number(addonTerms) > MAX_TERMS) {
    return `Add-on terms cannot exceed ${MAX_TERMS} months.`;
  }

  return null;
}

/** Shape the rate card for the `manual_product` GraphQL input. */
export function toManualProductInput(manual: ManualProduct): Record<string, unknown> {
  const num = (raw: string): string => {
    const value = (raw ?? '').trim();
    return value === '' ? '0' : value;
  };

  return {
    terms: Number((manual.terms ?? '').trim()),
    udi: num(manual.udi),
    processing: num(manual.processing),
    agent_fee: num(manual.agent_fee),
    collection: num(manual.collection),
    insurance: num(manual.insurance),
    insurance_fee: num(manual.insurance_fee),
    notarial: num(manual.notarial),
    base_deduction: manual.base_deduction === 1 ? 1 : 0,
    addon_terms: Number((manual.addon_terms ?? '').trim() || '0'),
    addon_udi_rate: num(manual.addon_udi_rate),
  };
}

/**
 * Coerce a user's branch_sub_id into a value safe to put in a GraphQL `String!`.
 *
 * NEVER returns an empty string. Laravel's global ConvertEmptyStringsToNull
 * middleware (fuerte-backend/app/Http/Kernel.php:23) rewrites "" to null on the
 * way in — BEFORE Lighthouse validates the variables — so an empty string is
 * rejected as `got invalid value null at "input.branch_sub_id"`.
 *
 * This is not hypothetical: OWNER users have `branch_sub_id = null` in the
 * database (they are the cross-branch role and have no home branch), so every
 * Owner quote hit that error until this guard was added.
 *
 * "0" is safe because the Compute path never reads branch_sub_id — it is used
 * only by process_type "Create" (LoanMutation.php, `case 'Create'`).
 */
export function branchSubIdForCompute(value: unknown): string {
  if (value === null || value === undefined) return '0';
  const asString = String(value).trim();
  return asString === '' ? '0' : asString;
}
