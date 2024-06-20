"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loanCodeListColumn from './LoanCodeListColumn';
import { DataRowLoanCodes } from '@/utils/DataTypes';

const data: DataRowLoanCodes[] = [
  {
    id: 1,
    loan_code: 'TEACHER',
    description: 'ADDITIONAL LOAN',
    type_of_loan: 'ADDITIONAL LOAN',
  },
  {
    id: 2,
    loan_code: 'TEACHER',
    description: 'NEW LOAN',
    type_of_loan: 'ADDITIONAL LOAN',
  },
  {
    id: 2,
    loan_code: 'TEACHER',
    description: 'RENEWAL LOAN',
    type_of_loan: 'ADDITIONAL LOAN',
  },
  // Add more rows as needed
];

const column = loanCodeListColumn;

const LoanCodeList: React.FC = () => {

  const handleRowClick = () => {

  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Loan Code
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

export default LoanCodeList;