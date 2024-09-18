"use client";

import React, { useEffect, useState } from 'react';
import { Edit3, X } from 'react-feather';
import { BorrLoanRowData } from '@/utils/DataTypes';
import LoanDetails from './LoanDetails';
import usePaymentPosting from '@/hooks/usePaymentPosting';

interface BorrInfoProps {
  singleData: BorrLoanRowData | undefined;
  handleShowForm: (v: boolean) => void;
}

const PaymentScheduleForm: React.FC<BorrInfoProps> = ({ singleData, handleShowForm }) => {
  const [activeTab, setActiveTab] = useState<number>();

  useEffect(() => {
  }, []);

  return (
    <div className="w-full">
      <div className="border-b flex justify-between items-center border-stroke px-7 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          {singleData?.loan_product?.description} 
        </h3>
        <span className="text-right cursor-pointer text-boxdark-2" onClick={() => { return handleShowForm(false); }}><X size={17}/></span>
      </div>
      {singleData && (
        <>
          <LoanDetails loanSingleData={singleData} />
        </>
      )}
    </div>
  );
};

export default PaymentScheduleForm;