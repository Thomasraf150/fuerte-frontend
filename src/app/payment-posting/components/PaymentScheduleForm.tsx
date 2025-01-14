"use client";

import React, { useEffect, useState } from 'react';
import { Edit3, X } from 'react-feather';
import { BorrLoanRowData, CollectionFormValues, OtherCollectionFormValues } from '@/utils/DataTypes';
import LoanDetails from './LoanDetails';

interface BorrInfoProps {
  singleData: BorrLoanRowData | undefined;
  handleShowForm: (v: boolean) => void;
  onSubmitCollectionPayment: (d: CollectionFormValues, l: string) => void;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => void;
  fnReversePayment: (d: any, l: string) => void;
}

const PaymentScheduleForm: React.FC<BorrInfoProps> = ({ singleData, handleShowForm, onSubmitCollectionPayment, onSubmitOthCollectionPayment, fnReversePayment }) => {
  const [activeTab, setActiveTab] = useState<number>();

  useEffect(() => {
    console.log(singleData, 'singleData');
  }, [singleData]);

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
          <LoanDetails fnReversePayment={fnReversePayment} loanSingleData={singleData} onSubmitCollectionPayment={onSubmitCollectionPayment} onSubmitOthCollectionPayment={onSubmitOthCollectionPayment} />
        </>
      )}
    </div>
  );
};

export default PaymentScheduleForm;