"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loanCodeListColumn from './LoanCodeListColumn';
import { DataRowLoanCodes } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';

const column = loanCodeListColumn;

const LoanCodeList: React.FC = () => {
  const router = useRouter();
  const {
    dataLoanCodes,
    loanCodesLoading,
    loanCodesError,
    serverSidePaginationProps,
    refresh
  } = useLoanCodes();

  // Navigate to edit page on action button click (URL-based routing)
  const handleRowClick = (row: DataRowLoanCodes) => {
    router.push(`/loan-codes/${row.id}`);
  };

  // Navigate to create page (URL-based routing)
  const handleCreateLoanCode = () => {
    router.push('/loan-codes/new');
  };

  // Navigate to detail page on whole row click (URL-based routing)
  const handleWholeRowClick = (data: DataRowLoanCodes) => {
    router.push(`/loan-codes/${data.id}`);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Loan Code
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanCode}>Create</button>
                {loanCodesError && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading loan codes: {loanCodesError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loanCodesLoading}
                  title={``}
                  columns={column(handleRowClick)}
                  enableCustomHeader={true}
                  data={dataLoanCodes}
                  onRowClicked={handleWholeRowClick}
                  serverSidePagination={serverSidePaginationProps}
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