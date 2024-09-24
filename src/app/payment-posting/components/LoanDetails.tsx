import React, { useEffect, useState } from 'react';
import { BorrLoanRowData, CollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { CheckCircle, CreditCard } from 'react-feather';
import useLoans from '@/hooks/useLoans';
import PaymentCollectionForm from './Form/PaymentCollectionForm';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  onSubmitCollectionPayment: (d: CollectionFormValues, l: string) => void;
}

const LoanDetails: React.FC<OMProps> = ({ loanSingleData, onSubmitCollectionPayment }) => {


  const [selectedMoSched, setSelectedMoSched] = useState<BorrLoanRowData>();
  const [selectedUdiSched, setSelectedUdiSched] = useState<BorrLoanRowData>();

  const totalDeduction = Number(loanSingleData?.loan_details[2]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[3]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[4]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[5]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[6]?.credit ?? 0);

  const handleProceedToPay = (amortData: any, udiData: any) => {
    setSelectedMoSched(amortData);
    setSelectedUdiSched(udiData);
  }

  useEffect(() => {
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-200 p-4 rounded">
          <table className="min-w-full bg-gray-100 border-gray-300 border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Borrower</td>
                <td className="px-4 py-2 text-gray-900 uppercase">{loanSingleData?.borrower?.lastname + ', ' + loanSingleData?.borrower?.firstname}</td>
              </tr>
              <tr className="">
              <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">PN Amount</td>
                <td className="px-4 py-2 text-gray-900">{ formatNumber(Number(loanSingleData?.pn_amount)) }</td>
              </tr>
              <tr>
              <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Status</td>
                <td className="px-4 py-2 text-gray-900">{ loanStatus(loanSingleData?.status) }</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Monthly</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(Number(loanSingleData?.monthly))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-gray-200 p-4 rounded">
          <table className="min-w-full bg-gray-100 border-gray-300 border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Term</td>
                <td className="px-4 py-2 text-gray-900">{loanSingleData?.term} Mo/s.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Total Deduction</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(totalDeduction)}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Total Interest</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit))}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Loan Proceeds</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(Number(loanSingleData?.loan_proceeds))}</td>
              </tr>
            
            </tbody>
          </table>
        </div>
        <div className="bg-gray-200 p-4 rounded">
          <table className="min-w-full bg-gray-100 border-gray-300 border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Transaction Date</td>
                <td className="px-4 py-2 text-gray-900">{formatDate(String(loanSingleData?.created_at))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Add more grid items as needed */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-gray-200 p-4 rounded">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="px-4 py-4 md:px-3 xl:px-6">
              <h5 className="text-m text-black dark:text-white">
                <span className="font-semibold">Loan Ref :</span> {loanSingleData?.loan_ref}
              </h5>
            </div>

            <div className="grid grid-cols-7 border-t border-stroke px-4 py-2 dark:border-strokedark sm:grid-cols-7 md:px-6">
              <div className="col-span-2 flex items-center">
                <p className="font-small">Due Date</p>
              </div>
              <div className="col-span-2 hidden items-center sm:flex">
                <p className="font-small">Amortization</p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="font-small">Interest</p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="font-small"></p>
              </div>
            </div>

            {loanSingleData?.loan_schedules?.map((item, i) => (
                <div
                    className="grid grid-cols-7 border-t border-stroke px-4 py-2 dark:border-strokedark sm:grid-cols-7 md:px-6"
                  key={i}
                >
                <div className="col-span-2 flex items-center">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <p className="text-sm text-black dark:text-white">
                      {item?.due_date}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                  <p className="text-sm text-black dark:text-white">
                    {item?.amount}
                  </p>
                </div>
                <div className="col-span-1 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {Number(loanSingleData?.loan_udi_schedules[i]?.amount).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  {item?.amount > 0 ? (
                    <button
                      className="w-full flex justify-between items-center focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                      type="button"
                      onClick={() => {handleProceedToPay(item, loanSingleData?.loan_udi_schedules[i])}}
                    >
                      <span className="mr-1">
                        <CreditCard size={17} /> 
                      </span>
                      <span>Proceed to pay</span>
                    </button>
                  ) : (
                    <button
                      className="w-full flex justify-between items-center focus:outline-none text-white bg-blue-400 hover:bg-blue-300 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                      type="button"
                      disabled
                    >
                      <span className="mr-1">
                        <CheckCircle size={17} /> 
                      </span>
                      <span>Paid</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

          </div>
        </div>
        <div>
          {selectedMoSched && (
            <div className={`${selectedMoSched && 'fade-in'}`}>
              <PaymentCollectionForm selectedMoSched={selectedMoSched} setSelectedMoSched={setSelectedMoSched} selectedUdiSched={selectedUdiSched} onSubmitCollectionPayment={onSubmitCollectionPayment}/>
            </div>
          )}
        </div>
        


      </div>
    </>
  );
};

export default LoanDetails;