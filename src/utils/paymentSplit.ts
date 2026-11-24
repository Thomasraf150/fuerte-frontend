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

/**
 * Process Payment form (Heidi 2026-11-23, option B): the cash pays the installment first; a penalty
 * can be taken now only from the cash left after the bank charge and the remaining due. The rest of
 * the penalty is charged at the loan's last due. The server refuses a larger penalty
 * (PaymentPostingService::penaltyRefusal).
 */
export function penaltyAllowedNow(input: Pick<CollectionSplitInput, 'collection' | 'bankCharge' | 'remainingDue'>): string {
  const due = Decimal.max(ZERO, amount(input.remainingDue));
  const left = amount(input.collection).minus(amount(input.bankCharge)).minus(due);
  return toCentavo(Decimal.max(ZERO, left));
}

/** True when the typed penalty is more than penaltyAllowedNow() (exact decimals). */
export function penaltyAboveAllowed(penalty: Amount, allowed: Amount): boolean {
  return amount(penalty).greaterThan(amount(allowed));
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
 * Other Payment form. Interest (not editable, Heidi 2026-11-21/23): what the payment applies to the
 * installment (the payment box less the bank charge and the change returned) as a share of the
 * remaining due, times the remaining UDI; all of it once the installment is covered; 0.00 for a
 * paid period. The server requires exactly this figure (PaymentPostingService::interestFor).
 */
export function suggestInterest(input: OtherPaymentInput): string {
  const due = amount(input.remainingDue);
  const udi = Decimal.max(ZERO, amount(input.remainingUdi));
  if (!due.greaterThan(0)) return '0.00';
  const applied = amount(input.collection)
    .plus(amount(input.advanced))
    .plus(amount(input.paymentUaSp))
    .minus(amount(input.bankCharge))
    .minus(amount(otherPaymentRefund(input)));
  if (!applied.greaterThan(0)) return '0.00';
  if (!applied.lessThan(due)) return toCentavo(udi);
  return toCentavo(proRataInterest(applied, due, udi));
}

/** Other Payment form: the change returned when a cash Collection exceeds the due, net of bank charge. */
export function otherPaymentRefund(input: Pick<OtherPaymentInput, 'collection' | 'bankCharge' | 'remainingDue'>): string {
  const collection = amount(input.collection);
  const due = amount(input.remainingDue);
  if (!collection.greaterThan(due)) return '0.00';
  const refund = collection.minus(due).minus(amount(input.bankCharge));
  return toCentavo(Decimal.max(ZERO, refund));
}
