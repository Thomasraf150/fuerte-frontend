"use client";

import React, { useEffect, useState } from 'react';
import { Edit3, X } from 'react-feather';
import { BorrLoanRowData, CollectionFormValues, OtherCollectionFormValues } from '@/utils/DataTypes';
import LoanDetails from './LoanDetails';
import { CardHeader } from '@/components/Card';

interface BorrInfoProps {
  singleData: BorrLoanRowData | undefined;
  handleShowForm: (v: boolean) => void;
  onSubmitCollectionPayment: (d: CollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  fnReversePayment: (d: any, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
}

const PaymentScheduleForm: React.FC<BorrInfoProps> = ({ singleData, handleShowForm, onSubmitCollectionPayment, onSubmitOthCollectionPayment, fnReversePayment, paymentLoading }) => {
  const [activeTab, setActiveTab] = useState<number>();

  useEffect(() => {
    console.log(singleData, 'singleData');
  }, [singleData]);

  return (
    <div className="w-full">
      {singleData && (
        <>
          <LoanDetails
            header={
              <CardHeader
                title={singleData?.loan_product?.description}
                actions={<span className="text-right cursor-pointer text-boxdark-2" onClick={() => { return handleShowForm(false); }}><X size={17}/></span>}
              />
            }
            fnReversePayment={fnReversePayment} loanSingleData={singleData} onSubmitCollectionPayment={onSubmitCollectionPayment} onSubmitOthCollectionPayment={onSubmitOthCollectionPayment} paymentLoading={paymentLoading} />
        </>
      )}
    </div>
  );
};

export default PaymentScheduleForm;