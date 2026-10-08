



import React, { useEffect } from 'react';
import { CustomerLedgerData, BorrLoanRowData } from '@/utils/DataTypes';
import { formatMoneyOrBlank, formatNumberComma } from '@/utils/helper';
import { rt } from '@/components/ReportTable';

// The first column stays put while the other 14 scroll sideways, on every screen width.
const PIN = 'sticky left-0 z-[1] bg-white dark:bg-boxdark';

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
  const totalCollection = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.collection || 0)), 0) : 0;
  const totalBankCharge = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.bank_charge || 0)), 0) : 0;
  const totalApRefund = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.ap_refund || 0)), 0) : 0;
  const totalPaymentUaSp = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.payment_ua_sp || 0)), 0) : 0;
  const totalPenaltyUaSp = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.penalty_ua_sp || 0)), 0) : 0;
  const totalUaSp = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.ua_sp || 0)), 0) : 0;
  const totalAdvancePayment = custLedgerData ? custLedgerData.reduce((acc, item) => acc + parseFloat(String(item.advance_payment || 0)), 0) : 0;

  return (
      <>
        <h4 className="font-medium mb-4 pl-3 text-black dark:text-white">
          Customer Ledger
        </h4>
        <div className={rt.wrap}>
          <table className={`${rt.table} min-w-[1800px] whitespace-nowrap`}>
            <thead className={rt.thead}>
              <tr>
                <th scope="col" className={`${rt.thNum} ${PIN}`}>Debit</th>
                <th scope="col" className={rt.thNum}>Credit</th>
                <th scope="col" className={rt.thNum}>Running Balance</th>
                <th scope="col" className={rt.th}>Due Date</th>
                <th scope="col" className={rt.th}>Date Paid</th>
                <th scope="col" className={rt.thNum}>Collection</th>
                <th scope="col" className={rt.thNum}>Penalty</th>
                <th scope="col" className={rt.thNum}>Principal</th>
                <th scope="col" className={rt.thNum}>Bank Charge</th>
                <th scope="col" className={rt.thNum}>Other Charge</th>
                <th scope="col" className={rt.thNum}>AP or Refund</th>
                <th scope="col" className={rt.thNum}>Payment UA/SP</th>
                <th scope="col" className={rt.thNum}>Penalty UA/SP</th>
                <th scope="col" className={rt.thNum}>UA/SP</th>
                <th scope="col" className={rt.thNum}>Advanced Payment</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <th colSpan={12} className="text-center p-5">Please wait..</th>
              </tr>
            ) : (
              custLedgerData && custLedgerData.map((item, i) => (
                <tr key={i}>
                  <th scope="row" className={`${rt.tdNum} ${PIN} font-normal`}>{formatMoneyOrBlank(item.debit)}</th>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.credit)}</td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.running_balance)}</td>
                  <td className={rt.td}>{item.due_date}</td>
                  <td className={rt.td}>{item.date_paid}</td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.collection)}</td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.penalty)}</td>
                  <td className={rt.tdNum}></td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.bank_charge)}</td>
                  <td className={rt.tdNum}></td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.ap_refund)}</td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.payment_ua_sp)}</td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.penalty_ua_sp)}</td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.ua_sp)}</td>
                  <td className={rt.tdNum}>{formatMoneyOrBlank(item.advance_payment)}</td>
                </tr>
              ))
            )}
            </tbody>
            <tfoot>
              <tr className={rt.grand}>
                <th scope="row" className={`${rt.tdNum} ${PIN}`}></th>
                <td className={rt.tdNum}></td>
                <td className={rt.tdNum}></td>
                <td className={rt.td}>Total</td>
                <td className={rt.td}></td>
                <td className={rt.tdNum}>{formatNumberComma(totalCollection)}</td>
                <td className={rt.tdNum}>{formatNumberComma(totalPenalty)}</td>
                <td className={rt.tdNum}></td>
                <td className={rt.tdNum}>{formatNumberComma(totalBankCharge)}</td>
                <td className={rt.tdNum}></td>
                <td className={rt.tdNum}>{formatNumberComma(totalApRefund)}</td>
                <td className={rt.tdNum}>{formatNumberComma(totalPaymentUaSp)}</td>
                <td className={rt.tdNum}>{formatNumberComma(totalPenaltyUaSp)}</td>
                <td className={rt.tdNum}>{formatNumberComma(totalUaSp)}</td>
                <td className={rt.tdNum}>{formatNumberComma(totalAdvancePayment)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </>
  );
};

export default CustomerLedger;