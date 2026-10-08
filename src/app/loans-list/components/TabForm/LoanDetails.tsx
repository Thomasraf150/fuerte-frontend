import React, { useState } from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { Printer } from 'react-feather';
import useLoans from '@/hooks/useLoans';
import BranchBadge from '@/components/BranchBadge';
import Button from '@/components/Button';
import { KeyValueColumns, KeyValueList, KeyValueRow } from '@/components/KeyValueList';

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
      <div className="grid grid-cols-1 gap-4">
        <KeyValueColumns>
        <KeyValueList>
          <KeyValueRow label="Borrower">{loanSingleData?.borrower ? `${loanSingleData.borrower.lastname}, ${loanSingleData.borrower.firstname}` : '—'}</KeyValueRow>
          <KeyValueRow label="PN Amount">{ formatNumber(Number(loanSingleData?.pn_amount)) }</KeyValueRow>
          <KeyValueRow label="Status">{ loanStatus(loanSingleData?.status) }</KeyValueRow>
          <KeyValueRow label="Monthly">{formatNumber(Number(loanSingleData?.monthly))}</KeyValueRow>
        </KeyValueList>
        <KeyValueList>
          <KeyValueRow label="Term">{loanSingleData?.term} Mo/s.</KeyValueRow>
          <KeyValueRow label="Total Deduction">{formatNumber(totalDeduction)}</KeyValueRow>
          <KeyValueRow label="Total Interest">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit ?? 0))}</KeyValueRow>
          <KeyValueRow label="Loan Proceeds" total>{formatNumber(Number(loanSingleData?.loan_proceeds))}</KeyValueRow>
        </KeyValueList>
        <KeyValueList>
          <KeyValueRow label="Transaction Date">{formatDate(String(loanSingleData?.created_at))}</KeyValueRow>
          <KeyValueRow label="Loan Ref">{loanSingleData?.loan_ref}</KeyValueRow>
          <KeyValueRow label="Branch">
            <BranchBadge size="lg" branchName={loanSingleData?.branch_sub?.branch?.name} subBranchName={loanSingleData?.branch_sub?.name} />
          </KeyValueRow>
        </KeyValueList>
        </KeyValueColumns>
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