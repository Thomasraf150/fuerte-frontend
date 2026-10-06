"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from 'react-toastify';
import { DataColListRow } from '@/utils/DataTypes';
import useCollectionList from '@/hooks/useCollectionList';
import collectionListCol from './CollectionListCol';
import CustomDatatable from '@/components/CustomDatatable';

const column = collectionListCol;

const CollectionList: React.FC = () => {
  const router = useRouter();

  const {
    dataColListData,
    collectionListLoading,
    collectionListError,
    serverSidePaginationProps,
    refresh,
  } = useCollectionList();

  // Navigate to detail page on row click (show read-only mode message for posted entries)
  const handleRowClick = (data: DataColListRow) => {
    if (data.journal_ref) {
      toast.info('Viewing posted entry (read-only mode).');
    }
    router.push(`/collection-list/${data.loan_schedule_id}?date=${data.trans_date}&ref=${data.loan_ref}`);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
            <div>
              <div className="border-b border-stroke px-4 lg:px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Collection List
                </h3>
              </div>
              <div className="p-2 lg:p-4 overflow-x-auto">
                {collectionListError && (
                  <div className="mb-4 p-4 bg-danger/10 border border-danger text-danger rounded">
                    Error loading collection list: {collectionListError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-danger text-white rounded text-sm hover:bg-opacity-90"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={collectionListLoading}
                  columns={column()}
                  onRowClicked={handleRowClick}
                  data={dataColListData || []}
                  enableCustomHeader={true}
                  title={''}
                  serverSidePagination={{ ...serverSidePaginationProps, recordType: 'loan', recordTypePlural: 'loans' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionList;
