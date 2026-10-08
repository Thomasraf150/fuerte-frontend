import React from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus } from '@/utils/helper';
import { Printer, RotateCw } from 'react-feather';
import Button from '@/components/Button';
import { KeyValueColumns, KeyValueList, KeyValueRow } from '@/components/KeyValueList';

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
      <div className="pb-4">
      <KeyValueColumns>
        <KeyValueList>
          <KeyValueRow label="Loan Reference">{loanSingleData?.loan_ref}</KeyValueRow>
          <KeyValueRow label="Borrower">{loanSingleData?.borrower?.lastname?.toUpperCase() + ', ' + loanSingleData?.borrower?.firstname?.toUpperCase()}</KeyValueRow>
          <KeyValueRow label="PN Amount">{ formatNumber(Number(loanSingleData?.pn_amount)) }</KeyValueRow>
          <KeyValueRow label="Status">{ loanStatus(loanSingleData?.status) }</KeyValueRow>
        </KeyValueList>
        <KeyValueList>
          <KeyValueRow label="Monthly">{formatNumber(Number(loanSingleData?.monthly))}</KeyValueRow>
          <KeyValueRow label="Term">{loanSingleData?.term} Mo/s.</KeyValueRow>
          <KeyValueRow label="Total Deduction">{formatNumber(totalDeduction)}</KeyValueRow>
          <KeyValueRow label="Total Interest">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit))}</KeyValueRow>
        </KeyValueList>
        <KeyValueList>
          <KeyValueRow label="Loan Proceeds" total>{formatNumber(Number(loanSingleData?.loan_proceeds))}</KeyValueRow>
          <KeyValueRow label="Transaction Date">{formatDate(String(loanSingleData?.created_at))}</KeyValueRow>
          <KeyValueRow label="Released Date">{formatDate(String(loanSingleData?.released_date))}</KeyValueRow>
        </KeyValueList>
      </KeyValueColumns>
      </div>
    </>
  );
};

export default LoanDetails;