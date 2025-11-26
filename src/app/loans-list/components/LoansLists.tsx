"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomDatatable from '@/components/CustomDatatable';
import loansListColumn from './LoansListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = loansListColumn;

const LoansLists: React.FC = () => {
  const router = useRouter();
  const {
    dataLoans,
    loansLoading,
    serverSidePaginationProps,
    handleDeleteLoans,
    refreshLoans,
  } = useLoans();

  // Debug: Component lifecycle
  useEffect(() => {
    console.log('[LoansLists] Component mounted');
    console.log('[LoansLists] Initial state:', {
      dataLoans: dataLoans?.length || 0,
      loansLoading,
      pagination: serverSidePaginationProps
    });
  }, []);

  // Debug: Data changes
  useEffect(() => {
    console.log('[LoansLists] Data updated:', {
      loansCount: dataLoans?.length || 0,
      loading: loansLoading,
      hasData: !!dataLoans
    });
  }, [dataLoans, loansLoading]);

  const handleRowClick = async (data: BorrLoanRowData) => {
    console.log('[LoansLists] Delete clicked for loan:', data.id);
    handleDeleteLoans(String(data.id), 'rm_loans');
  }

  const handleViewWholeLoan = (data: BorrLoanRowData) => {
    console.log('[LoansLists] View loan clicked:', {
      id: data.id,
      borrower: data.borrower?.lastname,
      loanRef: data.loan_ref
    });
    router.push(`/loans-list/${data.id}`);
  }

  // Note: Removed useEffect - usePagination handles initial data loading

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
                <CustomDatatable
                  apiLoading={loansLoading}
                  columns={column(handleRowClick, handleViewWholeLoan)}
                  data={dataLoans}
                  serverSidePagination={serverSidePaginationProps}
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

export default LoansLists;