"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loansListColumn from './LoansListColumn';
import { BorrLoanRowData } from '@/utils/DataTypes';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import { toast } from "react-toastify";

const column = loansListColumn;

const LoansLists: React.FC = () => {
  const router = useRouter();
  const {
    dataLoans,
    loansLoading,
    loansError,
    serverSidePaginationProps,
    refresh
  } = usePaymentPosting();

  // Navigate to detail page via URL
  const handleRowClick = (data: BorrLoanRowData) => {
    // Block if status indicates closed (includes "Closed" and "Posted (Closed)")
    if (data?.custom_status?.includes('Closed')) {
      toast.error('This loan has already been closed!');
      return;
    }
    router.push(`/payment-posting/${data.id}`);
  };

  // Note: usePagination handles initial data loading automatically

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Loans List
                </h3>
              </div>
              <div className="p-7">
                {loansError && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading payment posting loans: {loansError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loansLoading}
                  columns={column(handleRowClick)}
                  onRowClicked={handleRowClick}
                  data={dataLoans}
                  enableCustomHeader={true}
                  title={''}
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

export default LoansLists;