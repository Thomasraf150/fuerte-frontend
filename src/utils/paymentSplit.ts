/**
 * Payment-posting split (AP Refund, UA/SP, suggested Interest) in exact decimals.
 *
 * The server books the Interest and AP Refund the form sends (PaymentPostingService), so
 * these figures must not go through JS floats: 1.005 is 1.00499999... as a float, and
 * float `toFixed(2)` then rounds it down. Same rule as the backend's App\Support\Money:
 * every amount rounds to the centavo, half up, once.
 */
import Decimal from 'decimal.js';
import { parseNumericInput } from './helper';

type Amount = string | number | null | undefined;
type DecimalValue = InstanceType<typeof Decimal>;

const ZERO = new Decimal(0);
/**
 * Read a typed or stored amount the way the forms always have (parseFloat: '5.' is 5, '' is 0),
 * then hold it exactly. A two-place amount survives the number step unchanged.
 */
const amount = (value: Amount): DecimalValue => new Decimal(parseNumericInput(value));
const toCentavo = (d: DecimalValue): string => d.toFixed(2, Decimal.ROUND_HALF_UP);

/** remainingUdi × principal / remainingDue, floored at 0, then capped at the remaining UDI (in that order). */
const proRataInterest = (principal: DecimalValue, due: DecimalValue, udi: DecimalValue): DecimalValue => {
  const interest = udi.times(principal).dividedBy(due);
  return Decimal.min(interest.isNegative() ? ZERO : interest, udi);
};

export interface CollectionSplitInput {
  collection: Amount;
  bankCharge: Amount;
  penalty: Amount;
  remainingDue: Amount;
  remainingUdi: Amount;
}

/**
 * Process Payment form. R-PAYMENT-SPLIT (regress/RULES.md): the bank charge and the penalty
 * come off the cash first; the net pays the installment. Above the remaining due, the excess
 * is an AP Refund and the full remaining UDI is interest; at or below it, the shortfall is
 * UA/SP and interest is pro rata.
 */
export function collectionSplit(input: CollectionSplitInput): { ap_refund: string; ua_sp: string; interest: string } {
  const due = amount(input.remainingDue);
  const udi = Decimal.max(ZERO, amount(input.remainingUdi));
  const net = amount(input.collection)
    .minus(amount(input.bankCharge))
    .minus(amount(input.penalty));

  if (net.greaterThan(due)) {
    return { ap_refund: toCentavo(net.minus(due)), ua_sp: '0.00', interest: toCentavo(udi) };
  }
  const interest = due.greaterThan(0) ? proRataInterest(net, due, udi) : ZERO;
  return { ap_refund: '0.00', ua_sp: toCentavo(due.minus(net).abs()), interest: toCentavo(interest) };
}

export interface OtherPaymentInput {
  collection: Amount;
  advanced: Amount;
  paymentUaSp: Amount;
  bankCharge: Amount;
  remainingDue: Amount;
  remainingUdi: Amount;
}

/**
 * Other Payment form. Suggested interest: proportional to the principal applied, capped at the
 * remaining UDI. A cash Collection counts net of bank charge; Advanced Payment / Payment UA/SP
 * count gross. Overpaying via Collection earns the full remaining UDI. 0.00 for a paid period.
 */
export function suggestInterest(input: OtherPaymentInput): string {
  const due = amount(input.remainingDue);
  const udi = amount(input.remainingUdi);
  const collection = amount(input.collection);
  if (!due.greaterThan(0)) return '0.00';
  if (collection.greaterThan(due)) return toCentavo(udi);
  const principal = collection.greaterThan(0)
    ? Decimal.max(ZERO, collection.minus(amount(input.bankCharge)))
    : amount(input.advanced).plus(amount(input.paymentUaSp));
  return toCentavo(proRataInterest(principal, due, udi));
}

/**
 * Other Payment form, before posting: true when the Interest typed (empty counts as 0) is below
 * the suggestion. A full ₱2,190 payment was booked with its Interest box emptied, so ₱0 instead of
 * ₱140 (CRJ-FBBAT-0005960-26, 2026-10-26); the form now asks first. Exact decimals, no floats.
 */
export function interestBelowSuggestion(typed: Amount, suggested: Amount): boolean {
  return new Decimal(interestAsPosted(typed)).lessThan(amount(suggested));
}

/**
 * The Interest box as the server will book it: PaymentPostingService::normalizeAmount keeps a plain
 * number and books anything else as 0. parseFloat would read "140..00" as 140 while the server books
 * 0, so the check and the dialog read the box this way instead. Unrounded, as typed.
 */
export function interestAsPosted(typed: Amount): string {
  const text = String(typed ?? '').replace(/,/g, '').trim();
  return /^(\d+\.?\d*|\.\d+)$/.test(text) ? new Decimal(text).toString() : '0';
}

/** Other Payment form: the change returned when a cash Collection exceeds the due, net of bank charge. */
export function otherPaymentRefund(input: Pick<OtherPaymentInput, 'collection' | 'bankCharge' | 'remainingDue'>): string {
  const collection = amount(input.collection);
  const due = amount(input.remainingDue);
  if (!collection.greaterThan(due)) return '0.00';
  const refund = collection.minus(due).minus(amount(input.bankCharge));
  return toCentavo(Decimal.max(ZERO, refund));
}
