"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loanProductListColumn from './LoanProductListColumn';
import { DataRowLoanProducts } from '@/utils/DataTypes';
import useLoanProducts from '@/hooks/useLoanProducts';

const column = loanProductListColumn;

const LoanProductList: React.FC = () => {
  const router = useRouter();
  const {
    dataLoanProducts,
    loanProductsLoading,
    loanProductsError,
    serverSidePaginationProps,
    refresh
  } = useLoanProducts();

  // Navigate to create page (URL-based routing)
  const handleCreateLoanProduct = () => {
    router.push('/loan-products/new');
  };

  // Navigate to edit page on action button click (URL-based routing)
  const handleRowClick = (data: DataRowLoanProducts) => {
    router.push(`/loan-products/${data.id}`);
  };

  // Navigate to detail page on whole row click (URL-based routing)
  const handleWholeRowClick = (data: DataRowLoanProducts) => {
    router.push(`/loan-products/${data.id}`);
  };

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
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanProduct}>Create</button>
                {loanProductsError && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading loan products: {loanProductsError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loanProductsLoading}
                  columns={column(handleRowClick)}
                  data={dataLoanProducts}
                  enableCustomHeader={true}
                  onRowClicked={handleWholeRowClick}
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

export default LoanProductList;