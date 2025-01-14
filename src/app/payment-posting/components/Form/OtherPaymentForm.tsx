import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { BorrLoanRowData, OtherCollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus, formatToTwoDecimalPlaces } from '@/utils/helper';
import { Printer, CreditCard } from 'react-feather';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import moment from 'moment';
import { toast } from "react-toastify";
interface OMProps {
  selectedMoSchedOthPay: any;
  selectedUdiSched: any;
  setSelectedMoSchedOthPay: (data: any) => void;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => void;
}

const PaymentCollectionForm: React.FC<OMProps> = ({ selectedMoSchedOthPay, setSelectedMoSchedOthPay, selectedUdiSched, onSubmitOthCollectionPayment }) => {
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
      
      const computedUdi = String((udiSched?.amount * ((((parseFloat(watch('advanced_payment')) || 0 ) + (parseFloat(watch('payment_ua_sp')) || 0)) / amountSched?.amount) * 100 / 100)).toFixed(2));
      if (parseFloat(computedUdi) > parseFloat(selectedUdiSched?.amount)) {
        toast.error("Your amount paying is exeeding a total remaining due. Please input a right remain amount");

        setTimeout(function(){
          setValue('payment_ua_sp', '0');
          setValue('advanced_payment', '0');
          console.log(computedUdi, ' computedUdi')
          console.log(selectedUdiSched?.amount, ' selectedUdiSched?.amount')
        }, 1000);
      } else {
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
    const formattedValue = formatToTwoDecimalPlaces(value);
    if (type === 'collection') {
      if (parseFloat(value) > selectedMoSchedOthPay?.amount) {
        setValue('ap_refund', String((parseFloat(value) - 
                              (parseFloat(watch('bank_charge')) || 0) - 
                              (parseFloat(watch('payment_ua_sp')) || 0) - 
                              (parseFloat(watch('penalty_ua_sp')) || 0) - 
                              (parseFloat(watch('advanced_payment')) || 0)).toFixed(2)));
      } else {
        setValue('ap_refund', "0.00");
      }
      
    }
    if (type === 'bank_charge') {
      if (parseFloat(watch('collection')) > selectedMoSchedOthPay?.amount) {
        setValue('ap_refund', String((parseFloat(watch('collection')) - 
                              (parseFloat(value) || 0) - 
                              (parseFloat(watch('payment_ua_sp')) || 0) - 
                              (parseFloat(watch('penalty_ua_sp')) || 0) - 
                              (parseFloat(watch('advanced_payment')) || 0)).toFixed(2)));
      } else {
        setValue('ap_refund', "0.00");
      }
    }
    if (type === 'payment_ua_sp') {
      setValue('ap_refund', String((parseFloat(watch('collection')) - 
                            (parseFloat(value) || 0) - 
                            (parseFloat(watch('bank_charge')) || 0) - 
                            (parseFloat(watch('penalty_ua_sp')) || 0) -
                            (parseFloat(watch('advanced_payment')) || 0)).toFixed(2)));
      fnComputeUdi(selectedMoSchedOthPay, selectedUdiSched);
    }
    if (type === 'penalty_ua_sp') {
      setValue('ap_refund', String((parseFloat(watch('collection')) - 
                            (parseFloat(value) || 0) - 
                            (parseFloat(watch('bank_charge')) || 0) - 
                            (parseFloat(watch('payment_ua_sp')) || 0) - 
                            (parseFloat(watch('advanced_payment')) || 0)).toFixed(2)));
    }
    if (type === 'advanced_payment') {
      setValue('ap_refund', String((parseFloat(watch('collection')) - 
                            (parseFloat(value) || 0) - 
                            (parseFloat(watch('bank_charge')) || 0) - 
                            (parseFloat(watch('payment_ua_sp')) || 0) - 
                            (parseFloat(watch('penalty_ua_sp')) || 0)).toFixed(2)));
      fnComputeUdi(selectedMoSchedOthPay, selectedUdiSched);
    }

    setValue(type, formattedValue);
  };

  const handleDate = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    setValue(type, value);
  };

  const onSubmit = (data: OtherCollectionFormValues) => {
    console.log(data, ' data');
    onSubmitOthCollectionPayment(data, selectedMoSchedOthPay?.loan_id);
    setSelectedMoSchedOthPay('');
  }

  useEffect(() => {
    setValue('loan_schedule_id', selectedMoSchedOthPay?.id);
    setValue('loan_udi_schedule_id', selectedUdiSched?.id);
  }, [selectedMoSchedOthPay, selectedUdiSched]);

  return (
    <>
      <div className="bg-gray-200 p-4 rounded">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-4 border border-stroke bg-gradient-to-r from-cyan-500 to-blue-500 md:px-3 xl:px-6">
            <h5 className="text-m text-lime-50 dark:text-white">
              <span className="font-semibold">Other Payment</span>
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
                <td className="px-4 py-2 text-gray-900 text-center">{moment(selectedMoSchedOthPay?.due_date).format('YYYY-MM-DD')}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-4 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Remaining Due: </td>
                <td className="px-4 py-2 text-gray-900 text-center">{Number(selectedMoSchedOthPay?.amount).toFixed(2)}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Collection</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="collection"
                    placeholder="0.00"
                    {...register('collection', { required: "Collection is required!" })}
                    onBlur={(e: any) => { return handleDecimal(e, 'collection'); }}
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
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Payment UA/SP</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="payment_ua_sp"
                    placeholder="0.00"
                    {...register('payment_ua_sp')}
                    onBlur={(e: any) => { return handleDecimal(e, 'payment_ua_sp'); }}
                  />
                </td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Penalty UA/SP</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="penalty_ua_sp"
                    placeholder="0.00"
                    {...register('penalty_ua_sp')}
                    onBlur={(e: any) => { return handleDecimal(e, 'penalty_ua_sp'); }}
                  />
                </td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Advanced Payment</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="advanced_payment"
                    placeholder="0.00"
                    {...register('advanced_payment')}
                    onBlur={(e: any) => { return handleDecimal(e, 'advanced_payment'); }}
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Bank Charges</td>
                <td className="px-4 py-2 text-gray-900">
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="bank_charge"
                    placeholder="0.00"
                    {...register('bank_charge', { required: "Bank Charge is required!" })}
                    onBlur={(e: any) => { return handleDecimal(e, 'bank_charge'); }}
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
                  <input
                    className={`block p-2 border w-full text-center border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="commission_fee"
                    placeholder="0.00"
                    {...register('commission_fee')}
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
                    className="float-right mr-0 flex 
                    justify-between items-center focus:outline-none text-white bg-gradient-to-r from-sky-500 to-indigo-500 focus:ring-4 
                    focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                    type="submit"
                  >
                    <span className="mr-1">
                      <CreditCard size={17} /> 
                    </span>
                    <span>Pay Now</span>
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