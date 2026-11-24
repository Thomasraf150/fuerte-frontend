import { MIN_BUSINESS_DATE, maxBusinessDate } from '@/constants/dateBounds';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { OtherCollectionFormValues } from '@/utils/DataTypes';
import { formatToTwoDecimalPlaces, parseNumericInput as num, formatNumberComma } from '@/utils/helper';
import { interestAsPosted, interestBelowSuggestion, otherPaymentRefund, suggestInterest } from '@/utils/paymentSplit';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { Save, RotateCw } from 'react-feather';
import PesoSign from '@/components/PesoSign';
import moment from 'moment';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import { Card, CardHeader, CardBody } from '@/components/Card';
interface OMProps {
  selectedMoSchedOthPay: any;
  selectedUdiSched: any;
  setSelectedMoSchedOthPay: (data: any) => void;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
}


const PaymentCollectionForm: React.FC<OMProps> = ({ selectedMoSchedOthPay, setSelectedMoSchedOthPay, selectedUdiSched, onSubmitOthCollectionPayment, paymentLoading }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OtherCollectionFormValues>();

  // Heidi's rule (2026-06-26): a payment is recorded in EXACTLY ONE of
  // Collection / Advanced Payment / Payment UA/SP — never two at once. Booking
  // the same money in two boxes is what understated the renewal OBs
  // (e.g. FB BAL-00000947 / SAUCELO). As soon as one of the three carries a
  // value, the other two are locked (disabled + shown as 0.00) so the duplicate
  // can never be created at the source.
  const PRINCIPAL_FIELDS = ['collection', 'advanced_payment', 'payment_ua_sp'] as const;
  // Fields whose value changes the interest suggestion (bank charge reduces the
  // net collection). Penalty UA/SP and Commission never affect interest.
  const INTEREST_DRIVERS = ['collection', 'advanced_payment', 'payment_ua_sp', 'bank_charge'];
  const collectionVal = num(watch('collection'));
  const advancedVal = num(watch('advanced_payment'));
  const paymentUaSpVal = num(watch('payment_ua_sp'));
  const activePrincipal =
    collectionVal > 0 ? 'collection'
      : advancedVal > 0 ? 'advanced_payment'
        : paymentUaSpVal > 0 ? 'payment_ua_sp'
          : null;
  const isLocked = (field: string): boolean => activePrincipal !== null && activePrincipal !== field;
  // Shown under the Pay Now button if the operator tries to save with none of the
  // three payment boxes filled.
  const [principalError, setPrincipalError] = useState<string>('');
  const handleDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    const numericValue = value.replace(/,/g, '');
    const formattedValue = formatToTwoDecimalPlaces(numericValue);
    const incoming = parseFloat(numericValue) || 0;

    // Pull live values for every field the cascade depends on — preferring the
    // field being typed over react-hook-form's (possibly stale) watch().
    // Exact decimals (utils/paymentSplit): the server books the AP Refund and Interest as sent.
    const live = (field: keyof OtherCollectionFormValues) => (type === field ? numericValue : watch(field));
    const amounts = {
      collection: live('collection'),
      bankCharge: live('bank_charge'),
      paymentUaSp: live('payment_ua_sp'),
      advanced: live('advanced_payment'),
      remainingDue: selectedMoSchedOthPay?.amount,
      remainingUdi: selectedUdiSched?.amount,
    };

    // AP Refund: the CHANGE returned when a cash Collection exceeds the remaining
    // due — only the EXCESS over the due (matches the Process Payment form), net of
    // any bank charge, never negative. (Previously refunded the whole collection,
    // which cancelled the credit and over-stated the OB.)
    setValue('ap_refund', otherPaymentRefund(amounts));

    // One-box rule: when one of the three payment boxes is filled, clear the
    // other two so the same money can never be booked twice (the fields are also
    // disabled in the UI — this is the belt-and-suspenders for the value).
    if ((PRINCIPAL_FIELDS as readonly string[]).includes(type)) {
      if (incoming > 0) {
        (PRINCIPAL_FIELDS as readonly string[])
          .filter((f) => f !== type)
          .forEach((f) => setValue(f as keyof OtherCollectionFormValues, '0.00'));
      }
    }

    // Interest (see suggestInterest): computed for a plain Collection AND for an
    // advance-only entry (Collection 0); only the payment boxes / bank charge drive it.
    // Not editable (Heidi, 2026-11-21): staff enter only what the client paid, and the
    // server refuses a posting that clears the installment without its full interest.
    if (INTEREST_DRIVERS.includes(type)) {
      setValue('interest', suggestInterest(amounts));
    }

    setValue(type, formattedValue);
  };

  const handleDate = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    setValue(type, value);
  };

  const onSubmit = async (data: OtherCollectionFormValues) => {
    // A payment must go into exactly one of the three boxes; block an empty save.
    const totalPrincipal = num(data.collection) + num(data.advanced_payment) + num(data.payment_ua_sp);
    if (totalPrincipal <= 0) {
      setPrincipalError('Enter the payment in Collection, Advanced Payment, or Payment UA/SP.');
      return;
    }
    // Defense-in-depth: the UI lock already prevents this, but never let two boxes through.
    const nonZeroBoxes = [data.collection, data.advanced_payment, data.payment_ua_sp].filter((v) => num(v) > 0).length;
    if (nonZeroBoxes > 1) {
      setPrincipalError('Record the payment in only ONE of Collection, Advanced Payment, or Payment UA/SP.');
      return;
    }
    setPrincipalError('');

    // Interest below the suggestion (empty counts as 0): ask before posting. The box stays
    // editable, but a full payment was once booked with it emptied, ₱0 instead of ₱140
    // (CRJ-FBBAT-0005960-26). Opens on Back, so Enter, Enter during fast entry posts nothing.
    const suggested = suggestInterest({
      collection: data.collection, advanced: data.advanced_payment, paymentUaSp: data.payment_ua_sp,
      bankCharge: data.bank_charge, remainingDue: selectedMoSchedOthPay?.amount, remainingUdi: selectedUdiSched?.amount,
    });
    if (interestBelowSuggestion(data.interest, suggested)) {
      const typed = formatNumberComma(num(interestAsPosted(data.interest)));
      const confirmed = await showConfirmationModal(
        'Interest below what is due',
        `Interest ₱${typed} is below the ₱${formatNumberComma(num(suggested))} due for this payment.`,
        `Post ₱${typed} interest`,
        true,
        false,
        { focusCancel: true, returnFocus: false },
      );
      if (!confirmed) {
        document.getElementById('udi')?.focus();
        return;
      }
      console.info('[OtherPayment] interest below the suggestion, confirmed', { loan_schedule_id: data.loan_schedule_id, suggested, typed: data.interest ?? '' });
    }

    const result = await onSubmitOthCollectionPayment(data, selectedMoSchedOthPay?.loan_id) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result.success) {
      setSelectedMoSchedOthPay('');
    }
    // Form stays open on errors for user to fix and retry
  }

  useEffect(() => {
    setValue('loan_schedule_id', selectedMoSchedOthPay?.id);
    setValue('loan_udi_schedule_id', selectedUdiSched?.id);
  }, [selectedMoSchedOthPay, selectedUdiSched]);

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader title="Other Payment" />
          <CardBody>
            <div className="space-y-1">

            {/* Due Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Due Date:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white text-center 2xl:text-left text-xs sm:text-sm">
                {moment(selectedMoSchedOthPay?.due_date).format('YYYY-MM-DD')}
              </div>
            </div>

            {/* Remaining Due */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Remaining Due:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white text-center 2xl:text-left text-xs sm:text-sm">
                {formatNumberComma(Number(selectedMoSchedOthPay?.amount))}
              </div>
            </div>

            {/* Bank Charges */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Bank Charges
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="bank_charge"
                  type="text"
                  icon={PesoSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('bank_charge')}
                  onChange={(e: any) => { return handleDecimal(e, 'bank_charge'); }}
                  className="text-center"
                />
              </div>
            </div>

            {/* Collection */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Collection
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="collection"
                  type="text"
                  icon={PesoSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('collection')}
                  onChange={(e: any) => { return handleDecimal(e, 'collection'); }}
                  disabled={isLocked('collection')}
                  value={isLocked('collection') ? '0.00' : undefined}
                  className={`text-center ${isLocked('collection') ? 'opacity-40' : ''}`}
                />
              </div>
            </div>

            {/* Payment UA/SP */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Payment UA/SP
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="payment_ua_sp"
                  type="text"
                  icon={PesoSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('payment_ua_sp')}
                  onChange={(e: any) => { return handleDecimal(e, 'payment_ua_sp'); }}
                  disabled={isLocked('payment_ua_sp')}
                  value={isLocked('payment_ua_sp') ? '0.00' : undefined}
                  className={`text-center ${isLocked('payment_ua_sp') ? 'opacity-40' : ''}`}
                />
              </div>
            </div>

            {/* Penalty UA/SP */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Penalty UA/SP
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="penalty_ua_sp"
                  type="text"
                  icon={PesoSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('penalty_ua_sp')}
                  onChange={(e: any) => { return handleDecimal(e, 'penalty_ua_sp'); }}
                  className="text-center"
                />
              </div>
            </div>

            {/* Advanced Payment */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Advanced Payment
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="advanced_payment"
                  type="text"
                  icon={PesoSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('advanced_payment')}
                  onChange={(e: any) => { return handleDecimal(e, 'advanced_payment'); }}
                  disabled={isLocked('advanced_payment')}
                  value={isLocked('advanced_payment') ? '0.00' : undefined}
                  className={`text-center ${isLocked('advanced_payment') ? 'opacity-40' : ''}`}
                />
              </div>
            </div>

            {/* AP Refund */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                AP Refund
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  // Filled by the system: styled like Interest (claude-docs/form-standardization.md).
                  className="pointer-events-none h-12 md:h-11 w-full cursor-default select-none rounded-lg border border-dashed border-field bg-whiten px-4 text-center text-sm font-semibold text-black focus:outline-none dark:border-field-dark dark:bg-meta-4 dark:text-white"
                  tabIndex={-1}
                  type="text"
                  id="ap_refund"
                  placeholder="0.00"
                  readOnly={true}
                  {...register('ap_refund')}
                />
              </div>
            </div>

            {/* Commission */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Commission
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="commission_fee"
                  type="text"
                  icon={PesoSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('commission_fee')}
                  className="text-center"
                />
              </div>
            </div>

            {/* Interest — calculated from the payment box above and read-only (Heidi,
                2026-11-21), like the Process Payment form. Placed at the bottom (office
                decision 2026-06-26): entering Advanced Payment / Payment UA/SP
                (Collection 0) still fills it. */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <label htmlFor="udi" className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Interest
              </label>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  // Worked out by the system: no click, no tab stop, no caret (Raf 2026-11-24).
                  className="pointer-events-none h-12 md:h-11 w-full cursor-default select-none rounded-lg border border-dashed border-field bg-whiten px-4 text-center text-sm font-semibold text-black focus:outline-none dark:border-field-dark dark:bg-meta-4 dark:text-white"
                  tabIndex={-1}
                  type="text"
                  id="udi"
                  placeholder="0.00"
                  readOnly={true}
                  value={watch('interest') ?? ''}
                />
              </div>
            </div>

            {/* Collection Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Collection Date
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-center text-sm text-black placeholder:text-body read-only:bg-whiten focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white dark:read-only:bg-meta-4"
                  type="date"
                  id="collection_date"
                  placeholder="mm/dd/YYYY"
                  // A real gate, not decoration: a native date input commits a
                  // zero-padded partial year on the first year keystroke (0026-01-15,
                  // reported as valid), and with min/max the browser blocks the submit
                  // before any request. This is the Cash Receipts path that produced 43
                  // of the 67 corrupt journal_dates.
                  min={MIN_BUSINESS_DATE}
                  max={maxBusinessDate()}
                  {...register('collection_date', { required: "Collection Date is required!" })}
                  onBlur={(e: any) => { return handleDate(e, 'collection_date'); }}
                />
                {errors.collection_date && (
                  <p className="mt-2 text-sm font-medium text-center" style={{ color: '#DC2626' }}>{errors.collection_date.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            {principalError && (
              <p className="px-2 sm:px-4 text-sm font-medium text-center" style={{ color: '#DC2626' }}>{principalError}</p>
            )}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2"></div>
              <div className="2xl:w-3/5 px-2 py-2 sm:px-4 sm:py-2 text-black dark:text-white">
                <Button
                  variant="primary"
                  className="w-full 2xl:w-auto 2xl:float-right"
                  type="submit"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <RotateCw size={17} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      <span>Pay Now</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
          </CardBody>

        </form>
      </Card>
    </>
  );
};

export default PaymentCollectionForm;