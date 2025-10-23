import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { BorrLoanRowData, CollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus, formatToTwoDecimalPlaces } from '@/utils/helper';
import { Printer, CreditCard, Save, RotateCw } from 'react-feather';
import PesoSign from '@/components/PesoSign';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import moment from 'moment';
import FormInput from '@/components/FormInput';

interface OMProps {
  selectedMoSched: any;
  selectedUdiSched: any;
  setSelectedMoSched: (data: any) => void;
  onSubmitCollectionPayment: (d: CollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
}

const PaymentCollectionForm: React.FC<OMProps> = ({ selectedMoSched, setSelectedMoSched, selectedUdiSched, onSubmitCollectionPayment, paymentLoading }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<CollectionFormValues>();

  const handleDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    const numericValue = value.replace(/,/g, '');
    const formattedValue = formatToTwoDecimalPlaces(numericValue);
    if (type === 'collection') {
      if (parseFloat(numericValue) > selectedMoSched?.amount) {
        setValue('ap_refund', String(((parseFloat(numericValue) || 0) -
                              parseFloat(selectedMoSched?.amount) -
                              (parseFloat(watch('bank_charge')) || 0)).toFixed(2)))
      } else {
        setValue('ap_refund', "0.00");
      }
      if(selectedMoSched?.amount >= parseFloat(numericValue)){
        setValue('ua_sp', String((Math.abs(parseFloat(selectedMoSched?.amount) -
                          (parseFloat(numericValue) || 0) -
                          (parseFloat(watch('bank_charge')) || 0))).toFixed(2)));
      } else {
        setValue('ua_sp', "0.00");
      }
      if (numericValue !== '' && parseFloat(numericValue) > selectedMoSched?.amount) {
        const computedUdi = String((parseFloat(selectedUdiSched?.amount)).toFixed(2));
        setValue('interest', computedUdi);
      } else if(numericValue !== '' && parseFloat(numericValue) <= selectedMoSched?.amount){
        const computedUdi = String((selectedUdiSched?.amount * ((((parseFloat(numericValue) || 0) - (parseFloat(watch('bank_charge')) || 0)) / selectedMoSched?.amount) * 100 / 100)).toFixed(2));
        setValue('interest', computedUdi);
        console.log(computedUdi, ' computedUdi');
      }
      else {
        setValue('interest', "0.00");
      }
    }
    if (type === 'bank_charge') {
      if (parseFloat(watch('collection').replace(/,/g, '')) > selectedMoSched?.amount) {
        setValue('ap_refund', String((parseFloat(watch('collection')) -
                              parseFloat(selectedMoSched?.amount) -
                              (parseFloat(numericValue) || 0)).toFixed(2)))
      } else {
        setValue('ap_refund', "0.00");
      }
      if (parseFloat(watch('collection').replace(/,/g, '')) <= parseFloat(selectedMoSched?.amount)) {
        const col = (parseFloat(watch('collection').replace(/,/g, '')) || 0);
        const bc = col - (parseFloat(numericValue) || 0);
        setValue('ua_sp', String((Math.abs(parseFloat(selectedMoSched?.amount) - bc)).toFixed(2)));
      }
      if (value !== '' && (parseFloat(watch('collection')) || 0) > selectedMoSched?.amount) {
        const computedUdi = String((parseFloat(selectedUdiSched?.amount)).toFixed(2));
        setValue('interest', computedUdi);
      } else if(value !== '' && (parseFloat(watch('collection')) || 0) <= selectedMoSched?.amount){
        const computedUdi = String((selectedUdiSched?.amount * ((((parseFloat(watch('collection')) || 0) - (parseFloat(watch('bank_charge')) || 0)) / selectedMoSched?.amount) * 100 / 100)).toFixed(2));
        setValue('interest', computedUdi);
        console.log(computedUdi, ' computedUdi');
      }
    }
    setValue(type, formattedValue);
  };

  const handleDate = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    setValue(type, value);
  };

  const onSubmit = async (data: CollectionFormValues) => {
    console.log(data, ' data');

    const result = await onSubmitCollectionPayment(data, selectedMoSched?.loan_id);

    // Only close form on successful submission
    if (result.success) {
      setSelectedMoSched('');
    }
    // Form stays open on errors for user to fix and retry
  }

  useEffect(() => {
    setValue('loan_schedule_id', selectedMoSched?.id);
    setValue('loan_udi_schedule_id', selectedUdiSched?.id);
  }, [selectedMoSched, selectedUdiSched]);

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Process Payment
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
                {moment(selectedMoSched?.due_date).format('YYYY-MM-DD')}
              </div>
            </div>

            {/* Remaining Due */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                Remaining Due:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white text-center 2xl:text-left text-xs sm:text-sm">
                {Number(selectedMoSched?.amount).toFixed(2)}
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
                  register={register('collection', { required: "Collection is required!" })}
                  error={errors.collection?.message}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                  onChange={(e) => handleDecimal(e, 'collection')}
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

            {/* Penalty */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                Penalty
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="penalty"
                  type="text"
                  icon={PesoSign}
                  register={register('penalty')}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                  onChange={(e) => handleDecimal(e, 'penalty')}
                />
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
                  register={register('bank_charge', { required: "Bank Charge is required!" })}
                  error={errors.bank_charge?.message}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                  onChange={(e) => handleDecimal(e, 'bank_charge')}
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
                  register={register('commission_fee')}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                />
              </div>
            </div>

            {/* UA/SP */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">
                UA/SP
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className={`block p-2 border w-full text-center border-stroke dark:border-strokedark bg-white dark:bg-form-input text-black dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-xs sm:text-sm`}
                  type="text"
                  id="ua_sp"
                  placeholder="0.00"
                  readOnly={true}
                  {...register('ua_sp')}
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
          </div>

        </form>
      </div>
    </>
  );
};

export default PaymentCollectionForm;