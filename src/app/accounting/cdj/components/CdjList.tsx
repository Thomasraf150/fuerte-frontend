"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomDatatable from '@/components/CustomDatatable';
import useGeneralJournal from '@/hooks/useGeneralJournal';
import cdJTblColumn from './CdjTblColumn';
import { RowAcctgEntry } from '@/utils/DataTypes';

const column = cdJTblColumn;

const CdjList: React.FC = () => {
  const router = useRouter();
  const { fetchGJ, dataGj, loading } = useGeneralJournal();

  useEffect(() => {
    fetchGJ("", "", "", "CDJ");
  }, []);

  // Navigate to detail page on row click
  const handleRowClick = (row: RowAcctgEntry) => {
    const date = row.journal_date || '';
    router.push(`/accounting/cdj/${row.id}?date=${date}`);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 fade-in">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Cash Disbursements Journal
                </h3>
              </div>
              <div className="px-4">
                <CustomDatatable
                  apiLoading={loading}
                  title=""
                  onRowClicked={handleRowClick}
                  columns={column()}
                  enableCustomHeader={true}
                  data={dataGj || []}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CdjList;