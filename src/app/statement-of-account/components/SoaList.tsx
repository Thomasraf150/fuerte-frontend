"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import soaListColumn from './SoaListColumn';
import { BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';

const column = soaListColumn;

const SoaList: React.FC = () => {
  const router = useRouter();
  const { dataLoans, loansLoading, serverSidePaginationProps } = useLoans();

  // Navigate to the SOA detail (ledger) for the chosen loan.
  const handleRowClick = (data: BorrLoanRowData) => {
    router.push(`/statement-of-account/${data.id}`);
  };

  // Server-side search + pagination, but WITHOUT the Loans-List status/branch
  // filters (we omit onStatusFilterChange & the date/branch handlers so those
  // controls don't render on this page). This makes the SOA search behave like
  // the Borrowers/Loans search: server-side, case-insensitive, and able to find
  // ANY loan in the user's branch — not just the first (capped) page that the
  // old client-side filter could see.
  const soaSearchProps = {
    totalRecords: serverSidePaginationProps.totalRecords,
    currentPage: serverSidePaginationProps.currentPage,
    pageSize: serverSidePaginationProps.pageSize,
    totalPages: serverSidePaginationProps.totalPages,
    hasNextPage: serverSidePaginationProps.hasNextPage,
    hasPreviousPage: serverSidePaginationProps.hasPreviousPage,
    onPageChange: serverSidePaginationProps.onPageChange,
    onPageSizeChange: serverSidePaginationProps.onPageSizeChange,
    searchQuery: serverSidePaginationProps.searchQuery,
    onSearchChange: serverSidePaginationProps.onSearchChange,
    pageSizeOptions: serverSidePaginationProps.pageSizeOptions,
    enableSearch: true,
    searchPlaceholder: 'Search loan ref or borrower…',
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Statement of Account
                </h3>
              </div>
              <div className="p-7">
                <CustomDatatable
                  apiLoading={loansLoading}
                  columns={column(handleRowClick)}
                  onRowClicked={handleRowClick}
                  data={dataLoans}
                  serverSidePagination={soaSearchProps}
                  enableCustomHeader={true}
                  title={''}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoaList;
