import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { BorrLoanRowData, OtherCollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus, formatToTwoDecimalPlaces } from '@/utils/helper';
import { Printer, CreditCard, Save, RotateCw, DollarSign } from 'react-feather';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import moment from 'moment';
import { toast } from "react-toastify";
import FormInput from '@/components/FormInput';
interface OMProps {
  selectedMoSchedOthPay: any;
  selectedUdiSched: any;
  setSelectedMoSchedOthPay: (data: any) => void;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
}

const PaymentCollectionForm: React.FC<OMProps> = ({ selectedMoSchedOthPay, setSelectedMoSchedOthPay, selectedUdiSched, onSubmitOthCollectionPayment, paymentLoading }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<OtherCollectionFormValues>();
  const fnComputeUdi = (amountSched: any, udiSched: any) => {
    // if (amount !== '' && parseFloat(amount) > amountSched?.amount) {
    //   const computedUdi = String((parseFloat(udiSched?.amount)).toFixed(2));
    //   setValue('interest', computedUdi);
    // } else if(amount !== '' && parseFloat(amount) <= amountSched?.amount){

    // }
    // else {
    //   setValue('interest', "0.00");
    // }
    // if ((parseFloat(watch('advanced_payment')) || 0) > 0) {

      const computedUdi = String((Number(udiSched?.amount) * ((((parseFloat(watch('advanced_payment')?.replace(/,/g, '')) || 0 ) + (parseFloat(watch('payment_ua_sp')?.replace(/,/g, '')) || 0)) / Number(amountSched?.amount)) * 100 / 100)).toFixed(2));
      if (parseFloat(parseFloat(computedUdi).toFixed(2)) > parseFloat(parseFloat(selectedUdiSched?.amount).toFixed(2))) {
        toast.error("Your amount paying is exeeding a total remaining due. Please input a right remain amount");
        setTimeout(function(){
          setValue('payment_ua_sp', '0');
          setValue('advanced_payment', '0');
          // console.log(parseFloat(parseFloat(computedUdi).toFixed(2)), ' computedUdi')
          // console.log(parseFloat(parseFloat(selectedUdiSched?.amount).toFixed(2)), ' selectedUdiSched?.amount')
        }, 1000);
      } else {
        // setValue('interest', isNaN(Number(computedUdi)) ? "0.00" : computedUdi);
        setValue('interest', computedUdi);
      }
    // }
    // if ((parseFloat(watch('payment_ua_sp')) || 0) > 0) {
    //   const computedUdi = String((udiSched?.amount * (((parseFloat(watch('payment_ua_sp')) || 0) / amountSched?.amount) * 100 / 100)).toFixed(2));
    //   setValue('interest', computedUdi);
    // }
  }

  const handleDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    const numericValue = value.replace(/,/g, '');
    const formattedValue = formatToTwoDecimalPlaces(numericValue);
    if (type === 'collection') {
      if (parseFloat(numericValue) > selectedMoSchedOthPay?.amount) {
        setValue('ap_refund', String((parseFloat(numericValue) -
                              (parseFloat(watch('bank_charge')?.replace(/,/g, '')) || 0) -
                              (parseFloat(watch('payment_ua_sp')?.replace(/,/g, '')) || 0) -
                              (parseFloat(watch('penalty_ua_sp')?.replace(/,/g, '')) || 0) -
                              (parseFloat(watch('advanced_payment')?.replace(/,/g, '')) || 0)).toFixed(2)));
      } else {
        setValue('ap_refund', "0.00");
      }
      fnComputeUdi(selectedMoSchedOthPay, selectedUdiSched);
    }
    if (type === 'bank_charge') {
      if (parseFloat(watch('collection')?.replace(/,/g, '')) > selectedMoSchedOthPay?.amount) {
        setValue('ap_refund', String((parseFloat(watch('collection')?.replace(/,/g, '')) -
                              (parseFloat(numericValue) || 0) -
                              (parseFloat(watch('payment_ua_sp')?.replace(/,/g, '')) || 0) -
                              (parseFloat(watch('penalty_ua_sp')?.replace(/,/g, '')) || 0) -
                              (parseFloat(watch('advanced_payment')?.replace(/,/g, '')) || 0)).toFixed(2)));
      } else {
        setValue('ap_refund', "0.00");
      }
      fnComputeUdi(selectedMoSchedOthPay, selectedUdiSched);
    }
    if (type === 'payment_ua_sp') {
      setValue('ap_refund', String((parseFloat(watch('collection')?.replace(/,/g, '')) -
                            (parseFloat(numericValue) || 0) -
                            (parseFloat(watch('bank_charge')?.replace(/,/g, '')) || 0) -
                            (parseFloat(watch('penalty_ua_sp')?.replace(/,/g, '')) || 0) -
                            (parseFloat(watch('advanced_payment')?.replace(/,/g, '')) || 0)).toFixed(2)));
      fnComputeUdi(selectedMoSchedOthPay, selectedUdiSched);
    }
    if (type === 'penalty_ua_sp') {
      setValue('ap_refund', String((parseFloat(watch('collection')?.replace(/,/g, '')) -
                            (parseFloat(numericValue) || 0) -
                            (parseFloat(watch('bank_charge')?.replace(/,/g, '')) || 0) -
                            (parseFloat(watch('payment_ua_sp')?.replace(/,/g, '')) || 0) -
                            (parseFloat(watch('advanced_payment')?.replace(/,/g, '')) || 0)).toFixed(2)));
      fnComputeUdi(selectedMoSchedOthPay, selectedUdiSched);
    }
    if (type === 'advanced_payment') {
      setValue('ap_refund', String((parseFloat(watch('collection')?.replace(/,/g, '')) -
                            (parseFloat(numericValue) || 0) -
                            (parseFloat(watch('bank_charge')?.replace(/,/g, '')) || 0) -
                            (parseFloat(watch('payment_ua_sp')?.replace(/,/g, '')) || 0) -
                            (parseFloat(watch('penalty_ua_sp')?.replace(/,/g, '')) || 0)).toFixed(2)));
      fnComputeUdi(selectedMoSchedOthPay, selectedUdiSched);
    }

    setValue(type, formattedValue);
  };

  const handleDate = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    setValue(type, value);
  };

  const onSubmit = async (data: OtherCollectionFormValues) => {
    console.log(data, ' data');

    const result = await onSubmitOthCollectionPayment(data, selectedMoSchedOthPay?.loan_id);

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
      <div className="bg-gray-200 p-2 sm:p-4 rounded">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-2 py-2 sm:px-4 sm:py-4 border border-stroke bg-gradient-to-r from-cyan-500 to-blue-500 md:px-3 xl:px-6">
            <h5 className="text-m text-lime-50 dark:text-white">
              <span className="font-semibold">Other Payment</span>
            </h5>
          </div>
          <div className="space-y-1 bg-gray-100 border border-gray-300">

            {/* Due Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Due Date:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900 text-center 2xl:text-left text-xs sm:text-sm">
                {moment(selectedMoSchedOthPay?.due_date).format('YYYY-MM-DD')}
              </div>
            </div>

            {/* Remaining Due */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Remaining Due:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900 text-center 2xl:text-left text-xs sm:text-sm">
                {Number(selectedMoSchedOthPay?.amount).toFixed(2)}
              </div>
            </div>

            {/* Collection */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Collection
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <FormInput
                  label=""
                  id="collection"
                  type="text"
                  icon={DollarSign}
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Interest
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <input
                  className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Payment UA/SP
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <FormInput
                  label=""
                  id="payment_ua_sp"
                  type="text"
                  icon={DollarSign}
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Penalty UA/SP
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <FormInput
                  label=""
                  id="penalty_ua_sp"
                  type="text"
                  icon={DollarSign}
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Advanced Payment
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <FormInput
                  label=""
                  id="advanced_payment"
                  type="text"
                  icon={DollarSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('advanced_payment')}
                  onChange={(e: any) => { return handleDecimal(e, 'advanced_payment'); }}
                  className="text-center"
                />
              </div>
            </div>

            {/* Bank Charges */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Bank Charges
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <FormInput
                  label=""
                  id="bank_charge"
                  type="text"
                  icon={DollarSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('bank_charge', { required: "Bank Charge is required!" })}
                  onChange={(e: any) => { return handleDecimal(e, 'bank_charge'); }}
                  className="text-center"
                />
              </div>
            </div>

            {/* AP Refund */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                AP Refund
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <input
                  className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
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
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Commission
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <FormInput
                  label=""
                  id="commission_fee"
                  type="text"
                  icon={DollarSign}
                  formatType="number"
                  placeholder="0.00"
                  register={register('commission_fee')}
                  className="text-center"
                />
              </div>
            </div>

            {/* Collection Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-gray-700 bg-neutral-100 text-form-strokedark">
                Collection Date
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-gray-900">
                <input
                  className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
                  type="date"
                  id="collection_date"
                  placeholder="mm/dd/YYYY"
                  {...register('collection_date')}
                  onBlur={(e: any) => { return handleDate(e, 'collection_date'); }}
                />
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

        </form>
      </div>
    </>
  );
};

export default PaymentCollectionForm;