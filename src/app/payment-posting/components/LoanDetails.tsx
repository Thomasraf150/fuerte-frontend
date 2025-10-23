import React, { useEffect, useState } from 'react';
import { BorrLoanRowData, CollectionFormValues, OtherCollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { CheckCircle, CreditCard, RefreshCcw, Save, RotateCw } from 'react-feather';
import useLoans from '@/hooks/useLoans';
import PaymentCollectionForm from './Form/PaymentCollectionForm';
import OtherPaymentForm from './Form/OtherPaymentForm';
import usePaymentPosting from '@/hooks/usePaymentPosting';
interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  onSubmitCollectionPayment: (d: CollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  fnReversePayment: (d: any, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
}

const LoanDetails: React.FC<OMProps> = ({ loanSingleData, onSubmitCollectionPayment, onSubmitOthCollectionPayment, fnReversePayment, paymentLoading }) => {

  const [selectedMoSched, setSelectedMoSched] = useState<BorrLoanRowData>();
  const [selectedMoSchedOthPay, setSelectedMoSchedOthPay] = useState<BorrLoanRowData>();
  const [selectedUdiSched, setSelectedUdiSched] = useState<BorrLoanRowData>();

  const totalDeduction = Number(loanSingleData?.loan_details[2]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[3]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[4]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[5]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[6]?.credit ?? 0);

  const handleProceedToPay = (amortData: any, udiData: any) => {
    setSelectedMoSchedOthPay(undefined);
    setSelectedMoSched(amortData);
    setSelectedUdiSched(udiData);
  }
  
  const handleProceedToOtherPay = (amortData: any, udiData: any) => {
    setSelectedMoSched(undefined);
    setSelectedMoSchedOthPay(amortData);
    setSelectedUdiSched(udiData);
  }

  const handleReversePayment = async (row: any) => {
    const result = await fnReversePayment(row, String(loanSingleData?.id));

    // The hook already handles success/error notifications and data refetch
    // No additional form closing needed here since this isn't a modal form
  }

  useEffect(() => {
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-boxdark p-2 sm:p-4 rounded border border-stroke dark:border-strokedark">
          <table className="w-full bg-white dark:bg-boxdark border-stroke dark:border-strokedark border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Borrower</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white uppercase">{loanSingleData?.borrower?.lastname + ', ' + loanSingleData?.borrower?.firstname}</td>
              </tr>
              <tr className="">
              <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">PN Amount</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{ formatNumber(Number(loanSingleData?.pn_amount)) }</td>
              </tr>
              <tr>
              <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Status</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{ loanStatus(loanSingleData?.status) }</td>
              </tr>
              <tr>
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Monthly</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{formatNumber(Number(loanSingleData?.monthly))}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Loan Ref #:</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{loanSingleData?.loan_ref}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white dark:bg-boxdark p-2 sm:p-4 rounded border border-stroke dark:border-strokedark">
          <table className="w-full bg-white dark:bg-boxdark border-stroke dark:border-strokedark border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Term</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{loanSingleData?.term} Mo/s.</td>
              </tr>
              <tr>
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Total Deduction</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{formatNumber(totalDeduction)}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Total Interest</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit))}</td>
              </tr>
              <tr className="">
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Loan Proceeds</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{formatNumber(Number(loanSingleData?.loan_proceeds))}</td>
              </tr>

            </tbody>
          </table>
        </div>
        <div className="bg-white dark:bg-boxdark p-2 sm:p-4 rounded border border-stroke dark:border-strokedark">
          <table className="w-full bg-white dark:bg-boxdark border-stroke dark:border-strokedark border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-2 py-1 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm text-black dark:text-white bg-stroke dark:bg-meta-4">Transaction Date</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-black dark:text-white">{formatDate(String(loanSingleData?.created_at))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Add more grid items as needed */}
      </div>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          {/* First Column - Payment Schedule */}
          <div>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="px-2 py-2 sm:px-4 sm:py-4 md:px-3 xl:px-6">
                <h5 className="text-m text-black dark:text-white">
                  <span className="font-semibold">Loan Ref:</span> {loanSingleData?.loan_ref}
                </h5>
              </div>

              <div className="grid grid-cols-[auto_auto_1fr] sm:grid-cols-[minmax(100px,auto)_minmax(100px,auto)_minmax(80px,auto)_1fr] gap-2 sm:gap-4 border-t border-stroke px-2 sm:px-4 py-2 dark:border-strokedark md:px-6">
                <div className="flex items-center">
                  <p className="text-xs sm:text-sm font-semibold">Due Date</p>
                </div>
                <div className="hidden sm:flex items-center">
                  <p className="text-xs sm:text-sm font-semibold">Amortization</p>
                </div>
                <div className="flex items-center">
                  <p className="text-xs sm:text-sm font-semibold">Interest</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-semibold">Actions</p>
                </div>
              </div>

              {loanSingleData?.loan_schedules?.map((item, i) => (
                <div
                  className="grid grid-cols-[auto_auto_1fr] sm:grid-cols-[minmax(100px,auto)_minmax(100px,auto)_minmax(80px,auto)_1fr] gap-2 sm:gap-4 border-t border-stroke px-2 sm:px-4 py-2 dark:border-strokedark md:px-6"
                  key={i}
                >
                  <div className="flex items-center">
                    <p className="text-xs sm:text-sm text-black dark:text-white">{item?.due_date}</p>
                  </div>
                  <div className="hidden sm:flex items-center">
                    <p className="text-xs sm:text-sm text-black dark:text-white">{item?.amount}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-xs sm:text-sm text-black dark:text-white">
                      {Number(loanSingleData?.loan_udi_schedules[i]?.amount).toFixed(2)}
                    </p>
                  </div>

                  {/* Button Group */}
                  <div className="w-full flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-2 sm:justify-end">
                    <button
                      className="w-full sm:w-auto flex items-center justify-center whitespace-nowrap text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                      onClick={() => handleProceedToOtherPay(item, loanSingleData?.loan_udi_schedules[i])}
                    >
                      <CreditCard size={15} className="mr-1" />
                      <span className="hidden md:inline">Other Payments</span>
                      <span className="md:hidden">Other</span>
                    </button>

                    {item?.amount > 0 ? (
                      <button
                        className="w-full sm:w-auto flex items-center justify-center whitespace-nowrap text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                        onClick={() => handleProceedToPay(item, loanSingleData?.loan_udi_schedules[i])}
                      >
                        <CreditCard size={15} className="mr-1" />
                        <span className="hidden lg:inline">Proceed to Pay</span>
                        <span className="lg:hidden">Pay</span>
                      </button>
                    ) : (
                      <button
                        className="w-full sm:w-auto flex items-center justify-center whitespace-nowrap text-white bg-blue-400 cursor-not-allowed font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                        disabled
                      >
                        <CheckCircle size={15} className="mr-1" />
                        Paid
                      </button>
                    )}

                    <button
                      className={`w-full sm:w-auto flex items-center justify-center whitespace-nowrap text-white bg-orange-700 hover:bg-orange-400 focus:ring-4 focus:ring-orange-600 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-orange-300 dark:hover:bg-orange-700 dark:focus:ring-orange-400 ${paymentLoading ? 'opacity-70' : ''}`}
                      onClick={() => handleReversePayment(item)}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <>
                          <RotateCw size={15} className="mr-1 animate-spin" />
                          <span className="hidden sm:inline">Reversing...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCcw size={15} className="mr-1" />
                          Reverse
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Second Column - Payment Form */}
        <div>
          {selectedMoSched && (
            <div className={`${selectedMoSched ? 'fade-in' : 'fade-out'}`}>
              <PaymentCollectionForm selectedMoSched={selectedMoSched} setSelectedMoSched={setSelectedMoSched} selectedUdiSched={selectedUdiSched} onSubmitCollectionPayment={onSubmitCollectionPayment} paymentLoading={paymentLoading}/>
            </div>
          )}
          {selectedMoSchedOthPay && (
            <div className={`${selectedMoSchedOthPay ? 'fade-in' : 'fade-out'}`}>
              <OtherPaymentForm selectedMoSchedOthPay={selectedMoSchedOthPay} setSelectedMoSchedOthPay={setSelectedMoSchedOthPay} selectedUdiSched={selectedUdiSched} onSubmitOthCollectionPayment={onSubmitOthCollectionPayment} paymentLoading={paymentLoading}/>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoanDetails;