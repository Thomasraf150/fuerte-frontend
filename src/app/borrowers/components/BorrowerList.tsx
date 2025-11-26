"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import CustomDatatable from '@/components/CustomDatatable';
import borrowerColumn from './BorrowerColumn';
import { BorrowerRowInfo } from '@/utils/DataTypes';
import useBorrower from '@/hooks/useBorrower';

const column = borrowerColumn;

const BorrowerList: React.FC = () => {
  const router = useRouter();
  const {
      dataBorrower,
      paginationLoading,
      handleRmBorrower,
      serverSidePaginationProps,
      borrowerError,
      refresh } = useBorrower();

  const handleCreateBorrower = () => {
    router.push('/borrowers/new');
  }

  const handleRowClick = (data: BorrowerRowInfo) => {
    router.push(`/borrowers/${data.id}`);
  }

  const handleRowRmBorrClick = (data: BorrowerRowInfo) => {
    handleRmBorrower(data);
  }

  // Note: Pagination hook automatically handles initial data loading
  // No manual useEffect needed for fetching data

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Borrowers
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateBorrower}>Create</button>
                {borrowerError && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading borrowers: {borrowerError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={paginationLoading}
                  columns={column(handleRowClick, handleRowRmBorrClick)}
                  data={dataBorrower}
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

export default BorrowerList;