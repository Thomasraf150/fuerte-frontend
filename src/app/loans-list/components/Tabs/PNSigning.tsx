import React from 'react';
import { CheckCircle } from 'react-feather';
import "react-datepicker/dist/react-datepicker.css";
import { BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';
import { LoadingSpinner } from '@/components/LoadingStates';
import Button from '@/components/Button';
import { useStableLoading } from '@/hooks/useStableLoading';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  handleRefetchData: () => Promise<void> | void;
}

const PNSigning: React.FC<OMProps> = ({ handleRefetchData, loanSingleData }) => {

  const { submitPNSigned, loading } = useLoans();
  const showLoadingOverlay = useStableLoading(loading);

  const handlePNSigning = (data: BorrLoanRowData | undefined) => {
    submitPNSigned(data, handleRefetchData);
  }

  const hasSchedule = (loanSingleData?.loan_schedules?.length ?? 0) > 0;
  const isSigned = loanSingleData?.is_pn_signed === 1;

  return (
    <div className="relative" data-testid="pn-signing-section">
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-50 flex items-center justify-center rounded-lg" data-testid="pn-signing-loading-overlay">
          <LoadingSpinner size="lg" message="Signing PN..." />
        </div>
      )}
      <Button
        variant="primary"
        onClick={() => { return handlePNSigning(loanSingleData); }}
        disabled={isSigned || !hasSchedule}>
        <span className="mr-1">
          <CheckCircle size={16}/>
        </span>
        <span>
          {`${isSigned ? 'PN is Signed' : 'Submit For PN Signing'}`}
        </span>
      </Button>
      {!isSigned && !hasSchedule && (
        <p className="mt-2 text-xs text-danger">
          Please complete Set Effectivity/Maturity first before signing the PN.
        </p>
      )}
    </div>
  )
}

export default PNSigning;
