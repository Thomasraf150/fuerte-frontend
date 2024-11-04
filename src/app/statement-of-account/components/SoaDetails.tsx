"use client";

import React, { useEffect, useState } from 'react';
import { CornerUpLeft } from 'react-feather';
import LoanDetails from './LoanDetails'
import CustomerLedger from './CustomerLedger'
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes'
import useSoa from '@/hooks/useSoa';

interface BorrInfoProps {
  setShowForm: (v: boolean) => void;
  singleData?: BorrLoanRowData | undefined;
}

const SoaDetails: React.FC<BorrInfoProps> = ({ setShowForm, singleData }) => {

  const { fetchCustomerLedger, custLedgerData, loading } = useSoa();

  useEffect(() => {
    if (singleData) {
      fetchCustomerLedger(singleData?.id)
    }
  }, [])

  useEffect(() => {
  }, [])

  return (
    <div>
      <div className="relative overflow-x-auto bg-white shadow-default p-4">
          <button
            className="flex justify-center rounded border bg-white border-stroke px-6 py-4 mb-4 space-x-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
            type="button"
            onClick={() => { setShowForm(false) }}
          >
            <CornerUpLeft size={15} /> 
          </button>
          <LoanDetails loanSingleData={singleData}/>
          <CustomerLedger custLedgerData={custLedgerData} loading={loading}/>
          
      </div>
    </div>
  );
};

export default SoaDetails;