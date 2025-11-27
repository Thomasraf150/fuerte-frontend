"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import soaListColumn from './SoaListColumn';
import { BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';

const column = soaListColumn;

const SoaList: React.FC = () => {
  const router = useRouter();
  const { loanData, fetchLoans, loading } = useLoans();

  // Navigate to detail page on action button click (URL-based routing)
  const handleRowClick = (data: BorrLoanRowData) => {
    router.push(`/statement-of-account/${data.id}`);
  };

  // Navigate to detail page on whole row click (URL-based routing)
  const handleWholeRowClick = (data: BorrLoanRowData) => {
    router.push(`/statement-of-account/${data.id}`);
  };

  useEffect(() => {
    fetchLoans(100000, 1, 0);
  }, []);

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
                  apiLoading={loading}
                  columns={column(handleRowClick)}
                  onRowClicked={handleWholeRowClick}
                  data={loanData}
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