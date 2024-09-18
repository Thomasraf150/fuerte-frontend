import React, { useEffect } from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { Printer } from 'react-feather';
import useLoans from '@/hooks/useLoans';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  printLoanDetails: (v: string) => void;
}

const LoanDetails: React.FC<OMProps> = ({ loanSingleData, printLoanDetails }) => {

  const totalDeduction = Number(loanSingleData?.loan_details[2]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[3]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[4]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[5]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[6]?.credit ?? 0);

  return (
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
                <td className="px-4 py-2 text-gray-900">{loanSingleData?.borrower?.lastname + ', ' + loanSingleData?.borrower?.firstname}</td>
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
        <div className="bg-gray-200 p-4 rounded">
          <button
            className="flex justify-between items-center focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            type="button"
            onClick={() => { return printLoanDetails(String(loanSingleData?.id)); }}
          >
            <span className="mt-1 mr-1">
              <Printer size={17} /> 
            </span>
            <span>Print Loan Details</span>
          </button>
        </div>
        {/* Add more grid items as needed */}
      </div>
  );
};

export default LoanDetails;