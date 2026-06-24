import React, { useEffect } from 'react';
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

const PaymentCollectionForm: React.FC<OMProps> = ({ selectedMoSchedOthPay, setSelectedMoSchedOthPay, selectedUdiSched, onSubmitOthCollectionPayment, paymentLoading }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OtherCollectionFormValues>();

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
    const penaltyUaSp = type === 'penalty_ua_sp' ? incoming : num(watch('penalty_ua_sp'));
    const advanced = type === 'advanced_payment' ? incoming : num(watch('advanced_payment'));

    // AP Refund: only when collection exceeds remaining due. Stays 0 otherwise.
    if (collection > remainingDue) {
      const refund = collection - bankCharge - paymentUaSp - penaltyUaSp - advanced;
      setValue('ap_refund', (isFinite(refund) ? refund : 0).toFixed(2));
    } else {
      setValue('ap_refund', '0.00');
    }

    // Interest: proportional to the real cash applied to this period
    // (collection / remainingDue), capped at remainingUdi. Driven by Collection
    // ONLY (office decision 2026-06-24) so paying a schedule's interest no longer
    // requires also typing the amount into Advanced Payment — that coupling was
    // minting duplicate Collection+Advanced-Payment rows that understated the
    // renewal OB (loan FB BAL-00000947). Fully-paid period (remainingDue = 0) -> 0.
    let interest = 0;
    if (remainingDue > 0) {
      interest = remainingUdi * (collection / remainingDue);
      if (!isFinite(interest) || isNaN(interest) || interest < 0) interest = 0;
      if (interest > remainingUdi) interest = remainingUdi;
    }
    setValue('interest', interest.toFixed(2));

    setValue(type, formattedValue);
  };

  const handleDate = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    setValue(type, value);
  };

  const onSubmit = async (data: OtherCollectionFormValues) => {
    console.log(data, ' data');

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
                  register={register('bank_charge', { required: "Bank Charge is required!" })}
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
                  register={register('collection', { required: "Collection is required!" })}
                  onChange={(e: any) => { return handleDecimal(e, 'collection'); }}
                  className="text-center"
                />
              </div>
            </div>

            {/* Interest */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                Interest
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className={`block p-2 border w-full text-center border-stroke dark:border-strokedark bg-white dark:bg-form-input text-black dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
                  type="text"
                  id="udi"
                  placeholder="0.00"
                  readOnly={true}
                  value={`${Number(watch('interest') ?? 0).toFixed(2)}`}
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
                  className="text-center"
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
                  className="text-center"
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