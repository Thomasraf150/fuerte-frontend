import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { BorrLoanRowData, CollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus, formatToTwoDecimalPlaces } from '@/utils/helper';
import { Printer, CreditCard, Save, DollarSign, RotateCw } from 'react-feather';
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
      <div className="bg-gray-200 p-4 rounded">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-4 border border-stroke bg-gradient-to-r from-cyan-500 to-blue-500 md:px-3 xl:px-6">
            <h5 className="text-m text-lime-50 dark:text-white">
              <span className="font-semibold">Process Payment</span>
            </h5>
          </div>
          <table className="min-w-full bg-gray-100 border-gray-300 border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-4 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Due Date: </td>
                <td className="px-4 py-2 text-gray-900 text-center">{moment(selectedMoSched?.due_date).format('YYYY-MM-DD')}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-4 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Remaining Due: </td>
                <td className="px-4 py-2 text-gray-900 text-center">{Number(selectedMoSched?.amount).toFixed(2)}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Collection</td>
                <td className="px-4 py-2 text-gray-900">
                  <FormInput
                    label=""
                    id="collection"
                    type="text"
                    icon={DollarSign}
                    register={register('collection', { required: "Collection is required!" })}
                    error={errors.collection?.message}
                    placeholder="0.00"
                    formatType="number"
                    className="text-center"
                    onChange={(e) => handleDecimal(e, 'collection')}
                  />
                </td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Interest</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="udi"
                    placeholder="0.00"
                    readOnly={true}
                    value={`${Number(watch('interest') ?? 0).toFixed(2)}`}
                  />
                </td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Penalty</td>
                <td className="px-4 py-2 text-gray-900">
                  <FormInput
                    label=""
                    id="penalty"
                    type="text"
                    icon={DollarSign}
                    register={register('penalty')}
                    placeholder="0.00"
                    formatType="number"
                    className="text-center"
                    onChange={(e) => handleDecimal(e, 'penalty')}
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Bank Charges</td>
                <td className="px-4 py-2 text-gray-900">
                  <FormInput
                    label=""
                    id="bank_charge"
                    type="text"
                    icon={DollarSign}
                    register={register('bank_charge', { required: "Bank Charge is required!" })}
                    error={errors.bank_charge?.message}
                    placeholder="0.00"
                    formatType="number"
                    className="text-center"
                    onChange={(e) => handleDecimal(e, 'bank_charge')}
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">AP Refund</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="ap_refund"
                    placeholder="0.00"
                    readOnly={true}
                    {...register('ap_refund')}
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Commission</td>
                <td className="px-4 py-2 text-gray-900">
                  <FormInput
                    label=""
                    id="commission_fee"
                    type="text"
                    icon={DollarSign}
                    register={register('commission_fee')}
                    placeholder="0.00"
                    formatType="number"
                    className="text-center"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">UA/SP</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="ua_sp"
                    placeholder="0.00"
                    readOnly={true}
                    {...register('ua_sp')}
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Collection Date</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="date"
                    id="collection_date"
                    placeholder="mm/dd/YYYY"
                    {...register('collection_date')}
                    onBlur={(e: any) => { return handleDate(e, 'collection_date'); }}
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-gray-900">
                  <button
                    className={`float-right mr-0 flex justify-between items-center focus:outline-none text-white bg-gradient-to-r from-sky-500 to-indigo-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 ${paymentLoading ? 'opacity-70' : ''}`}
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
                </td>
              </tr>
            </tbody>
          </table>

        </form>
      </div>
    </>
  );
};

export default PaymentCollectionForm;