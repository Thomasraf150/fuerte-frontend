import React, { useState } from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { Printer } from 'react-feather';
import useLoans from '@/hooks/useLoans';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  printLoanDetails: (v: string) => Promise<void>;
}

const LoanDetails: React.FC<OMProps> = ({ loanSingleData, printLoanDetails }) => {
  const [printLoading, setPrintLoading] = useState(false);

  const handlePrint = async () => {
    setPrintLoading(true);
    try {
      await printLoanDetails(String(loanSingleData?.id));
    } finally {
      setPrintLoading(false);
    }
  };

  const totalDeduction = Number(loanSingleData?.loan_details[2]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[3]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[4]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[5]?.credit ?? 0) +
                        Number(loanSingleData?.loan_details[6]?.credit ?? 0);

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-200 dark:bg-boxdark p-4 rounded">
          <table className="min-w-full bg-gray-100 dark:bg-meta-4 border-gray-300 dark:border-strokedark border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Borrower</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{loanSingleData?.borrower?.lastname + ', ' + loanSingleData?.borrower?.firstname}</td>
              </tr>
              <tr className="">
              <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">PN Amount</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{ formatNumber(Number(loanSingleData?.pn_amount)) }</td>
              </tr>
              <tr>
              <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Status</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{ loanStatus(loanSingleData?.status) }</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Monthly</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{formatNumber(Number(loanSingleData?.monthly))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-gray-200 dark:bg-boxdark p-4 rounded">
          <table className="min-w-full bg-gray-100 dark:bg-meta-4 border-gray-300 dark:border-strokedark border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Term</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{loanSingleData?.term} Mo/s.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Total Deduction</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{formatNumber(totalDeduction)}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Total Interest</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit))}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Loan Proceeds</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{formatNumber(Number(loanSingleData?.loan_proceeds))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-gray-200 dark:bg-boxdark p-4 rounded">
          <table className="min-w-full bg-gray-100 dark:bg-meta-4 border-gray-300 dark:border-strokedark border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Transaction Date</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{formatDate(String(loanSingleData?.created_at))}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 dark:text-bodydark bg-neutral-100 dark:bg-meta-4 text-form-strokedark">Loan Ref</td>
                <td className="px-4 py-2 text-gray-900 dark:text-white">{loanSingleData?.loan_ref}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-gray-200 dark:bg-boxdark p-4 rounded">
          <button
            className="flex justify-between items-center focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            type="button"
            onClick={handlePrint}
            disabled={printLoading}
          >
            <span className="mt-1 mr-1">
              <Printer size={17} />
            </span>
            <span>{printLoading ? 'Generating...' : 'Print Loan Details'}</span>
          </button>
        </div>
        {/* Add more grid items as needed */}
      </div>
  );
};

export default LoanDetails;