import React, { useState } from 'react';
import { CheckCircle } from 'react-feather';
import "react-datepicker/dist/react-datepicker.css";
import { BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  handleRefetchData: () => void;
  // handleApproveRelease: (status: number) => void;
}

const PNSigning: React.FC<OMProps> = ({ handleRefetchData, loanSingleData }) => {

  const { submitPNSigned } = useLoans();

  const handlePNSigning = (data: BorrLoanRowData | undefined) => {
    submitPNSigned(data, handleRefetchData);
  }

  return (
    <>
      <button 
        className="bg-purple-700 flex justify-between items-center text-white py-2 px-4 rounded hover:bg-purple-800 text-sm"
        onClick={() => { return handlePNSigning(loanSingleData); }}
        disabled={loanSingleData?.is_pn_signed === 1 ? true : false}>
        <span className="mr-1">
          <CheckCircle size={16}/>
        </span>
        <span>
          {`${loanSingleData?.is_pn_signed === 1 ? 'PN is Signed' : 'Submit For PN Signing'}`}
        </span>
      </button>
    </>
  )
}

export default PNSigning;
