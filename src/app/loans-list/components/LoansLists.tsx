"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loansListColumn from './LoansListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';
import LoanPnSigningForm from './LoanPnSigningForm';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = loansListColumn;

const LoansLists: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const { 
    loanData, 
    allLoansData,
    fetchLoans, 
    handleDeleteLoans, 
    loading, 
    currentPage, 
    totalPages, 
    totalRecords,
    hasNextPage,
    prefetching,
    navigateToPage,
    refreshLoans
  } = useLoans();

  const handleRowClick = async (data: BorrLoanRowData) => {
    setSingleData(data);
    handleDeleteLoans(String(data.id), 'rm_loans', fetchLoans);
  }
 
  const handleViewWholeLoan = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
    console.log(data, ' data');
  }

  const handleShowForm = (d: boolean) => {
    setShowForm(d);
    refreshLoans(); // Use smart pagination refresh
  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

            {showForm === false ? (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Loans List
                  </h3>
                </div>
                <div className="p-7">
                  <CustomDatatable
                    apiLoading={loading}
                    columns={column(handleRowClick, handleViewWholeLoan)}
                    data={allLoansData}
                    enableCustomHeader={true} 
                    title={''}
                    smartPagination={{
                      hasNextPage,
                      totalRecords,
                      onLoadMore: () => navigateToPage(currentPage + 1),
                      isLoadingMore: prefetching
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <LoanPnSigningForm singleData={singleData} handleShowForm={handleShowForm} />
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansLists;