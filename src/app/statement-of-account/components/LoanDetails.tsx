import React from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { Printer, RotateCw } from 'react-feather';
import Button from '@/components/Button';

/** One label and its figure (receipt row): the figure right-aligned in tabular numerals; `big` is the one key total. */
const Row: React.FC<{ label: string; children: React.ReactNode; big?: boolean }> = ({ label, children, big = false }) => (
  <div className={`flex items-baseline justify-between gap-4 py-1.5 ${big ? 'border-b border-stroke pb-2.5 text-base font-bold dark:border-strokedark' : 'text-sm'}`}>
    <dt className={big ? 'text-black dark:text-white' : 'text-body dark:text-bodydark'}>{label}</dt>
    <dd className="text-right tabular-nums text-black dark:text-white">{children}</dd>
  </div>
);

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <dl className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">{children}</dl>
);

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  onPrint?: () => void;
  printing?: boolean;
}

const LoanDetails: React.FC<OMProps> = ({ loanSingleData, onPrint, printing }) => {

  const totalDeduction = Number(loanSingleData?.loan_details[2]?.credit ?? 0) +
                        Number(loanSingleData?.loan_details[3]?.credit ?? 0) +
                        Number(loanSingleData?.loan_details[4]?.credit ?? 0) +
                        Number(loanSingleData?.loan_details[5]?.credit ?? 0) +
                        Number(loanSingleData?.loan_details[6]?.credit ?? 0);

  return (
    <>
      {onPrint && (
        <div className="flex justify-end pb-3">
          <Button
            type="button"
            variant="primary"
            onClick={onPrint}
            disabled={printing || !loanSingleData?.id}
          >
            {printing ? <RotateCw size={15} className="animate-spin" /> : <Printer size={15} />}
            <span>{printing ? 'Generating…' : 'Print Statement'}</span>
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 pb-4 md:grid-cols-3 gap-4">
        <Panel>
          <Row label="Loan Reference">{loanSingleData?.loan_ref}</Row>
          <Row label="Borrower">{loanSingleData?.borrower?.lastname?.toUpperCase() + ', ' + loanSingleData?.borrower?.firstname?.toUpperCase()}</Row>
          <Row label="PN Amount">{ formatNumber(Number(loanSingleData?.pn_amount)) }</Row>
          <Row label="Status">{ loanStatus(loanSingleData?.status) }</Row>
        </Panel>
        <Panel>
          <Row label="Monthly">{formatNumber(Number(loanSingleData?.monthly))}</Row>
          <Row label="Term">{loanSingleData?.term} Mo/s.</Row>
          <Row label="Total Deduction">{formatNumber(totalDeduction)}</Row>
          <Row label="Total Interest">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit))}</Row>
        </Panel>
        <Panel>
          <Row label="Loan Proceeds" big>{formatNumber(Number(loanSingleData?.loan_proceeds))}</Row>
          <Row label="Transaction Date">{formatDate(String(loanSingleData?.created_at))}</Row>
          <Row label="Released Date">{formatDate(String(loanSingleData?.released_date))}</Row>
        </Panel>
   
        {/* Add more grid items as needed */}
      </div>
    </>
  );
};

export default LoanDetails;