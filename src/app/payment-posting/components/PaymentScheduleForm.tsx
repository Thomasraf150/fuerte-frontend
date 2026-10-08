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
                actions={
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => { return handleShowForm(false); }}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-boxdark-2 hover:bg-whiten focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:h-10 md:w-10 dark:text-bodydark dark:hover:bg-meta-4"
                  >
                    <X size={17} />
                  </button>
                }
              />
            }
            fnReversePayment={fnReversePayment} loanSingleData={singleData} onSubmitCollectionPayment={onSubmitCollectionPayment} onSubmitOthCollectionPayment={onSubmitOthCollectionPayment} paymentLoading={paymentLoading} />
        </>
      )}
    </div>
  );
};

export default PaymentScheduleForm;