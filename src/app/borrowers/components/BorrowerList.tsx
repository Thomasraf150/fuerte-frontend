"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import PayerFilterChips from '@/components/PayerFilterChips';
import borrowerColumn from './BorrowerColumn';
import { BorrowerRowInfo } from '@/utils/DataTypes';
import useBorrower from '@/hooks/useBorrower';
import { usePendingDeletions, PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import { showPendingBorrowerDeletion } from '@/hooks/borrowerDelete';
import useDeletionRequests from '@/hooks/useDeletionRequests';
import { pendingDeletionRowStyles } from '@/components/PendingDeletion/rowStyles';

const BorrowerList: React.FC = () => {
  const router = useRouter();
  const {
      dataBorrower,
      paginationLoading,
      handleRmBorrower,
      serverSidePaginationProps,
      borrowerError,
      payerFilter,
      setPayerFilter,
      refresh } = useBorrower();

  const entityIds = useMemo(
    () => (dataBorrower ?? []).map((r: any) => Number(r.id)).filter(Boolean),
    [dataBorrower]
  );

  const { pendingByEntityId, loading: pendingLoading, refresh: refreshPending } = usePendingDeletions('borrower', entityIds);
  const { cancel: cancelDeletionRequest } = useDeletionRequests();

  const handleCreateBorrower = () => {
    router.push('/borrowers/new');
  }

  const handleRowClick = (data: BorrowerRowInfo) => {
    router.push(`/borrowers/${data.id}`);
  }

  const handleRowRmBorrClick = async (data: BorrowerRowInfo) => {
    // refreshPending is passed in so the spinner stays open until the
    // badge data is ready — no flash-of-no-badge after the modal closes.
    await handleRmBorrower(data, refreshPending);
  }

  const handlePendingClick = (row: BorrowerRowInfo, info: PendingDeletionInfo) =>
    showPendingBorrowerDeletion(info, row, {
      onView: () => router.push('/approvals'),
      cancel: cancelDeletionRequest,
      refresh: refreshPending,
    });

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
                <button className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90" onClick={handleCreateBorrower}>Create</button>
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
                <PayerFilterChips value={payerFilter} onChange={setPayerFilter} />
                <CustomDatatable
                  apiLoading={paginationLoading || pendingLoading}
                  columns={borrowerColumn(handleRowClick, handleRowRmBorrClick, pendingByEntityId, handlePendingClick)}
                  data={dataBorrower}
                  enableCustomHeader={true}
                  title={''}
                  serverSidePagination={serverSidePaginationProps}
                  conditionalRowStyles={pendingDeletionRowStyles<BorrowerRowInfo>(pendingByEntityId)}
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
