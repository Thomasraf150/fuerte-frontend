import React, { useState } from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { Printer } from 'react-feather';
import useLoans from '@/hooks/useLoans';
import BranchBadge from '@/components/BranchBadge';
import Button from '@/components/Button';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  printLoanDetails: (v: string) => Promise<void>;
}

/** One label and its figure (receipt row): the figure right-aligned in tabular numerals. */
const Row: React.FC<{ label: string; children: React.ReactNode; total?: boolean }> = ({ label, children, total = false }) => (
  <div className={`flex items-baseline justify-between gap-4 py-1.5 text-sm ${total ? 'mt-1 border-t border-stroke pt-2 font-bold dark:border-strokedark' : ''}`}>
    <dt className={total ? 'text-black dark:text-white' : 'text-body dark:text-bodydark'}>{label}</dt>
    <dd className="text-right tabular-nums text-black dark:text-white">{children}</dd>
  </div>
);

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <dl className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">{children}</dl>
);

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
        <Panel>
          <Row label="Borrower">{loanSingleData?.borrower ? `${loanSingleData.borrower.lastname}, ${loanSingleData.borrower.firstname}` : '—'}</Row>
          <Row label="PN Amount">{ formatNumber(Number(loanSingleData?.pn_amount)) }</Row>
          <Row label="Status">{ loanStatus(loanSingleData?.status) }</Row>
          <Row label="Monthly">{formatNumber(Number(loanSingleData?.monthly))}</Row>
        </Panel>
        <Panel>
          <Row label="Term">{loanSingleData?.term} Mo/s.</Row>
          <Row label="Total Deduction">{formatNumber(totalDeduction)}</Row>
          <Row label="Total Interest">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit ?? 0))}</Row>
          <Row label="Loan Proceeds" total>{formatNumber(Number(loanSingleData?.loan_proceeds))}</Row>
        </Panel>
        <Panel>
          <Row label="Transaction Date">{formatDate(String(loanSingleData?.created_at))}</Row>
          <Row label="Loan Ref">{loanSingleData?.loan_ref}</Row>
          <Row label="Branch">
            <BranchBadge branchName={loanSingleData?.branch_sub?.branch?.name} subBranchName={loanSingleData?.branch_sub?.name} />
          </Row>
        </Panel>
        <div className="p-1">
          <Button variant="secondary" onClick={handlePrint} disabled={printLoading}>
            <Printer size={17} />
            <span>{printLoading ? 'Generating...' : 'Print Loan Details'}</span>
          </Button>
        </div>
        {/* Add more grid items as needed */}
      </div>
  );
};

export default LoanDetails;