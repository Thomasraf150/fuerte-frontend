



import React, { useEffect } from 'react';
import { CustomerLedgerData, BorrLoanRowData } from '@/utils/DataTypes';
import { formatToTwoDecimalPlaces } from '@/utils/helper';

interface OMProps {
  custLedgerData: CustomerLedgerData[] | undefined;
  loading: boolean;
}

const CustomerLedger: React.FC<OMProps> = ({ custLedgerData, loading }) => {

  useEffect(() => {
    console.log(custLedgerData, 'custLedgerData')
  }, [custLedgerData])

  const totalPenalty = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.penalty || 0)), 0) : 0;
  const totalPrincipal = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.running_balance || 0)), 0) : 0;
  const totalBankCharge = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.bank_charge || 0)), 0) : 0;
  const totalApRefund = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.ap_refund || 0)), 0) : 0;
  const totalPaymentUaSp = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.payment_ua_sp || 0)), 0) : 0;
  const totalUaSp = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.ua_sp || 0)), 0) : 0;
  const totalAdvancePayment = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.advance_payment || 0)), 0) : 0;

  return (
      <>
        <h4 className="font-medium mb-4 pl-3 text-black dark:text-white">
          Customer Ledger
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1800px] text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-teal-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-4 py-3 w-32 whitespace-nowrap sticky left-0 bg-teal-50 dark:bg-gray-700">Debit</th>
                <th scope="col" className="px-4 py-3 w-32 text-left whitespace-nowrap sticky left-32 bg-teal-50 dark:bg-gray-700">Credit</th>
                <th scope="col" className="px-4 py-3 w-36 text-left whitespace-nowrap sticky left-64 bg-teal-50 dark:bg-gray-700">Running Balance</th>
                <th scope="col" className="px-4 py-3 w-32 text-left whitespace-nowrap">Due Date</th>
                <th scope="col" className="px-4 py-3 w-32 text-left whitespace-nowrap">Date Paid</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">Penalty</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">Principal</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">Bank Charge</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">Other Charge</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">AP or Refund</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">Payment UA/SP</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">UA/SP</th>
                <th scope="col" className="px-4 py-3 w-32 text-center whitespace-nowrap">Advanced Payment</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr className="bg-white dark:bg-gray-800">
                <th colSpan={12} className="text-center p-5">Please wait..</th>
              </tr>
            ) : (
              custLedgerData && custLedgerData.map((item, i) => (
                <tr key={i} className="bg-white dark:bg-gray-800">
                  <th scope="row" className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800">{formatToTwoDecimalPlaces(item.debit)}</th>
                  <td className="px-4 py-4 text-left whitespace-nowrap sticky left-32 bg-white dark:bg-gray-800">{formatToTwoDecimalPlaces(item.credit)}</td>
                  <td className="px-4 py-4 text-left whitespace-nowrap sticky left-64 bg-white dark:bg-gray-800">{formatToTwoDecimalPlaces(item.running_balance)}</td>
                  <td className="px-4 py-4 text-left">{item.due_date}</td>
                  <td className="px-4 py-4 text-left">{item.date_paid}</td>
                  <td className="px-4 py-4 text-center">{formatToTwoDecimalPlaces(item.penalty)}</td>
                  <td className="px-4 py-4 text-center"></td>
                  <td className="px-4 py-4 text-center">{formatToTwoDecimalPlaces(item.bank_charge)}</td>
                  <td className="px-4 py-4 text-center"></td>
                  <td className="px-4 py-4 text-center">{formatToTwoDecimalPlaces(item.ap_refund)}</td>
                  <td className="px-4 py-4 text-center">{formatToTwoDecimalPlaces(item.payment_ua_sp)}</td>
                  <td className="px-4 py-4 text-center">{formatToTwoDecimalPlaces(item.ua_sp)}</td>
                  <td className="px-4 py-4 text-center">{formatToTwoDecimalPlaces(item.advance_payment)}</td>
                </tr>
              ))
            )}
            </tbody>
            <tfoot>
              <tr className="font-semibold text-gray-900 dark:text-white">
                <th scope="row" className="px-4 py-3 text-base sticky left-0 bg-teal-50 dark:bg-gray-700"></th>
                <td className="px-4 py-3 text-left sticky left-32 bg-teal-50 dark:bg-gray-700"></td>
                <td className="px-4 py-3 text-left sticky left-64 bg-teal-50 dark:bg-gray-700"></td>
                <td className="px-4 py-3 text-left">Total</td>
                <td className="px-4 py-3 text-center"></td>
                <td className="px-4 py-3 text-center">{totalPenalty}</td>
                <td className="px-4 py-3 text-center"></td>
                <td className="px-4 py-3 text-center">{totalBankCharge}</td>
                <td className="px-4 py-3 text-center"></td>
                <td className="px-4 py-3 text-center">{totalApRefund}</td>
                <td className="px-4 py-3 text-center">{totalPaymentUaSp}</td>
                <td className="px-4 py-3 text-center">{totalUaSp}</td>
                <td className="px-4 py-3 text-center">{totalAdvancePayment}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </>
  );
};

export default CustomerLedger;