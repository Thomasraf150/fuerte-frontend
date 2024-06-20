"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loanProductListColumn from './LoanProductListColumn';
import { DataRowLoanProducts } from '@/utils/DataTypes';

const data: DataRowLoanProducts[] = [
  {
    id: 1,
    type: 'EPZA',
    description: '2019 EPZA CASH ADVANCE TEST',
    loan_code_desc: 'EPZA EPZA CASH ADVANCE 1 Month(s) (0/0/0/0/0/0) ',
    terms: 4,
    interest_rate: 0.00,
    process: 0.00,
    insurance: 0.00,
    commission: 0.00,
    notarial: 0.00,
    addon: 0.00
  },
  {
    id: 2,
    type: 'EPZA/PRIVATE',
    description: 'EPZA ADDITIONAL LOAN 2 MOS',
    loan_code_desc: 'EPZA/PRIVATE ADDITIONAL LOAN 2 Month(s) (10/3/0/3/100/0)',
    terms: 4,
    interest_rate: 0.00,
    process: 0.00,
    insurance: 0.00,
    commission: 0.00,
    notarial: 0.00,
    addon: 0.00
  },
  {
    id: 2,
    type: 'EPZA/PRIVATE',
    description: 'EPZA ADDITIONAL LOAN 3 MOS',
    loan_code_desc: 'EPZA/PRIVATE ADDITIONAL LOAN 3 Month(s) (18/3/0/3/100/0)',
    terms: 4,
    interest_rate: 0.00,
    process: 0.00,
    insurance: 0.00,
    commission: 0.00,
    notarial: 0.00,
    addon: 0.00
  },
  // Add more rows as needed
];

const column = loanProductListColumn;

const LoanProductList: React.FC = () => {

  const handleRowClick = () => {

  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Loan Product
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800">Create</button>
                <CustomDatatable
                  apiLoading={false}
                  title="Client List"
                  columns={column(handleRowClick)}
                  data={data}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanProductList;