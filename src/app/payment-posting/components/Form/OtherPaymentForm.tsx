import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { OtherCollectionFormValues } from '@/utils/DataTypes';
import { formatToTwoDecimalPlaces, parseNumericInput as num } from '@/utils/helper';
import { Save, RotateCw } from 'react-feather';
import PesoSign from '@/components/PesoSign';
import moment from 'moment';
import FormInput from '@/components/FormInput';
interface OMProps {
  selectedMoSchedOthPay: any;
  selectedUdiSched: any;
  setSelectedMoSchedOthPay: (data: any) => void;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
}

/**
 * Suggested interest for a period: proportional to the principal applied to it,
 * capped at the remaining UDI. A cash Collection is taken net of bank charge
 * (matches the Process Payment form); Advanced Payment / Payment UA/SP are gross.
 * Overpaying via Collection earns the full remaining UDI. Returns 0 for a
 * fully-paid period or any non-finite result. Pure — easy to reason about/test.
 */
function suggestInterest(
  collection: number,
  advanced: number,
  paymentUaSp: number,
  bankCharge: number,
  remainingDue: number,
  remainingUdi: number,
): number {
  if (remainingDue <= 0) return 0;
  if (collection > remainingDue) return remainingUdi;
  const principalNet = collection > 0 ? Math.max(0, collection - bankCharge) : advanced + paymentUaSp;
  let interest = remainingUdi * (principalNet / remainingDue);
  if (!isFinite(interest) || isNaN(interest) || interest < 0) interest = 0;
  if (interest > remainingUdi) interest = remainingUdi;
  return interest;
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
  // True once the operator hand-edits the Interest field — stops the auto-suggestion
  // from clobbering their value (reset when a payment box or the schedule changes).
  const interestTouched = useRef(false);

  const handleDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    const numericValue = value.replace(/,/g, '');
    const formattedValue = formatToTwoDecimalPlaces(numericValue);
    const incoming = parseFloat(numericValue) || 0;

    // Pull live values for every field the cascade depends on — preferring the
    // field being typed over react-hook-form's (possibly stale) watch().
    const remainingDue = Number(selectedMoSchedOthPay?.amount) || 0;
    const remainingUdi = Number(selectedUdiSched?.amount) || 0;
    const collection = type === 'collection' ? incoming : num(watch('collection'));
    const bankCharge = type === 'bank_charge' ? incoming : num(watch('bank_charge'));
    const paymentUaSp = type === 'payment_ua_sp' ? incoming : num(watch('payment_ua_sp'));
    const advanced = type === 'advanced_payment' ? incoming : num(watch('advanced_payment'));

    // AP Refund: the CHANGE returned when a cash Collection exceeds the remaining
    // due — only the EXCESS over the due (matches the Process Payment form), net of
    // any bank charge, never negative. (Previously refunded the whole collection,
    // which cancelled the credit and over-stated the OB.)
    if (collection > remainingDue) {
      const refund = collection - remainingDue - bankCharge;
      setValue('ap_refund', (isFinite(refund) && refund > 0 ? refund : 0).toFixed(2));
    } else {
      setValue('ap_refund', '0.00');
    }

    // One-box rule: when one of the three payment boxes is filled, clear the
    // other two so the same money can never be booked twice (the fields are also
    // disabled in the UI — this is the belt-and-suspenders for the value).
    // Editing a payment box also re-engages the interest auto-suggestion.
    if ((PRINCIPAL_FIELDS as readonly string[]).includes(type)) {
      interestTouched.current = false;
      if (incoming > 0) {
        (PRINCIPAL_FIELDS as readonly string[])
          .filter((f) => f !== type)
          .forEach((f) => setValue(f as keyof OtherCollectionFormValues, '0.00'));
      }
    }

    // Interest suggestion (see suggestInterest): computes for a plain Collection
    // AND for an advance-only entry (Collection 0). NOT recomputed once the
    // operator hand-edits Interest (interestTouched); only the payment boxes /
    // bank charge drive it. The field stays editable (office decision 2026-06-26).
    if (INTEREST_DRIVERS.includes(type) && !interestTouched.current) {
      setValue('interest', suggestInterest(collection, advanced, paymentUaSp, bankCharge, remainingDue, remainingUdi).toFixed(2));
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
    // New schedule/payment entry — re-enable the interest auto-suggestion.
    interestTouched.current = false;
  }, [selectedMoSchedOthPay, selectedUdiSched]);

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Other Payment
            </h3>
          </div>
          <div className="p-7">
            <div className="space-y-1">

            {/* Due Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                Due Date:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white text-center 2xl:text-left text-xs sm:text-sm">
                {moment(selectedMoSchedOthPay?.due_date).format('YYYY-MM-DD')}
              </div>
            </div>

            {/* Remaining Due */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                Remaining Due:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white text-center 2xl:text-left text-xs sm:text-sm">
                {Number(selectedMoSchedOthPay?.amount).toFixed(2)}
              </div>
            </div>

            {/* Bank Charges */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                AP Refund
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className={`block p-2 border w-full text-center border-stroke dark:border-strokedark bg-white dark:bg-form-input text-black dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
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

            {/* Interest — auto-calculated from the payment box above, but editable.
                Placed at the bottom (office decision 2026-06-26) so operators never
                need to enter a Collection just to make interest appear: entering
                Advanced Payment / Payment UA/SP (Collection 0) still fills it, and it
                can be typed over by hand. */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                Interest
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className={`block p-2 border w-full text-center border-stroke dark:border-strokedark bg-white dark:bg-form-input text-black dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
                  type="text"
                  inputMode="decimal"
                  id="udi"
                  placeholder="0.00"
                  value={watch('interest') ?? ''}
                  onChange={(e) => { interestTouched.current = true; setValue('interest', e.target.value.replace(/[^0-9.]/g, '')); }}
                />
              </div>
            </div>

            {/* Collection Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                Collection Date
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className={`block p-2 border w-full text-center border-stroke dark:border-strokedark bg-white dark:bg-form-input text-black dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
                  type="date"
                  id="collection_date"
                  placeholder="mm/dd/YYYY"
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
              <div className="2xl:w-3/5 px-2 py-2 sm:px-4 sm:py-2 text-gray-900">
                <button
                  className={`w-full 2xl:w-auto 2xl:float-right flex justify-center items-center focus:outline-none text-white bg-gradient-to-r from-sky-500 to-indigo-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 ${paymentLoading ? 'opacity-70' : ''}`}
                  type="submit"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <span className="mr-1">
                        <RotateCw size={17} className="animate-spin" />
                      </span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-1">
                        <Save size={17} />
                      </span>
                      <span>Pay Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
          </div>

        </form>
      </div>
    </>
  );
};

export default PaymentCollectionForm;