/**
 * Bounds for native <input type="date"> fields.
 *
 * WHY THIS EXISTS. Chrome's native date input commits a zero-padded partial
 * year the instant the FIRST year digit is typed — proven in a real browser on
 * the payment form, where `.value` went "" → 0002-01-15 → 0026-01-15, each step
 * firing `change` with `validity.valid === true`. Nothing on the client
 * normalised it, so the malformed date reached the GraphQL variables verbatim.
 *
 * That is how 82 acctg_entries rows, 273 loan_payments rows and 124
 * borrower_details rows came to hold years like 0005, 0026, 1970 and 2926. The
 * control case proves the mechanism: loans.released_date is the one business
 * date entered through react-datepicker rather than a native input, and it has
 * ZERO corrupt years.
 *
 * `min`/`max` are a real gate, not decoration: with min set, a malformed value
 * makes validity.rangeUnderflow true and the browser blocks the submit BEFORE
 * any network request. Verified, including that no form in this app sets
 * noValidate (zero occurrences repo-wide), so the native gate is live.
 *
 * The backend enforces the same window through @rules, and
 * AcctgEntry::MIN_PLAUSIBLE_JOURNAL_DATE is the authority. These constants are
 * the client half and must move with it.
 */

/**
 * Earliest date the business can have posted on. Measured: no legitimate
 * acctg_entries row predates 2022, and this rejects every truncated-year and
 * epoch pattern in the live data.
 *
 * Keep in sync with AcctgEntry::MIN_PLAUSIBLE_JOURNAL_DATE.
 */
export const MIN_BUSINESS_DATE = '2022-01-01';

/**
 * How far ahead a business date may sit. Measured across 59,768 healthy
 * entries: forward-dating reaches 314 days and nothing exceeds 365.
 *
 * Keep in sync with AcctgEntry::MAX_JOURNAL_DATE_FORWARD_DAYS.
 */
export const MAX_BUSINESS_DATE_FORWARD_DAYS = 365;

/** `yyyy-mm-dd` for a Date, which is the only format the input accepts. */
function toInputDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Latest date a business date may carry — today plus the measured forward
 * allowance. Computed per call rather than at module load so a long-lived tab
 * does not pin yesterday's bound.
 */
export function maxBusinessDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + MAX_BUSINESS_DATE_FORWARD_DAYS);
  return toInputDate(d);
}

/**
 * Latest date of birth: today. A borrower cannot be born in the future, and 18
 * of the 124 corrupt borrower_details.dob rows are dated 2026 with 14 more in
 * 2025 — i.e. infants — so an upper bound is clearly needed.
 *
 * Deliberately NOT a minimum lending age. Whether that is 18, 21, or differs
 * for a co-maker is a business rule that is not derivable from the code, and
 * guessing it would silently reject real borrowers. It belongs with the other
 * unanswered rules in claude-docs/open-questions-for-operations.md.
 */
export function maxDateOfBirth(): string {
  return toInputDate(new Date());
}

/** Floor for a date of birth. Generous on purpose — this is a typo guard. */
export const MIN_DATE_OF_BIRTH = '1900-01-01';

/**
 * Bounds for a date field that is PREFILLED from a stored record.
 *
 * A native min/max blocks the whole form, not just the field: the browser
 * refuses to submit, onSubmit never runs, no request is sent and react-hook-form
 * renders nothing (its errors only fire on the rules it owns). So bounding a
 * prefilled field punishes records that were already bad — 95 of 4,516
 * borrower_details rows hold a dob outside this window, and 2 of 2
 * borrower_comakers do. Before this helper, opening one of those borrowers and
 * changing only a phone number could not be saved: a native bubble appeared on
 * a birthdate the operator never touched, with nothing explaining it.
 *
 * This widens the window just far enough to admit the value already on the
 * record, so a stored bad date is never what stops an unrelated edit, while a
 * NEWLY typed year is still gated. Same principle as omitting journal_date when
 * cancelling a voucher: never refuse a write on a value the user did not enter.
 *
 * Repairing those 95 rows is a separate data question, not a form question.
 */
export function boundsAllowing(
  storedValue: string | null | undefined,
  min: string,
  max: string,
): { min: string; max: string } {
  const stored = (storedValue ?? '').slice(0, 10);
  // Lexicographic comparison is exact for yyyy-mm-dd, and safe for the
  // zero-padded years (0001-01-01) this is here to tolerate.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stored)) {
    return { min, max };
  }
  return {
    min: stored < min ? stored : min,
    max: stored > max ? stored : max,
  };
}
