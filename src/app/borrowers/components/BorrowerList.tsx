"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import borrowerColumn from './BorrowerColumn';
import { BorrowerRowInfo } from '@/utils/DataTypes';
import useBorrower from '@/hooks/useBorrower';
import { usePendingDeletions, PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import { showAlreadyPendingModal, showProcessingModal } from '@/components/ConfirmationModal';
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

  const handlePendingClick = async (row: BorrowerRowInfo, info: PendingDeletionInfo) => {
    const action = await showAlreadyPendingModal({
      request_id: info.request_id,
      requested_by_name: info.requested_by_name,
      reason: info.reason,
      created_at: info.created_at,
      is_mine: info.is_mine,
      entity_label: [row.firstname, row.middlename, row.lastname].filter(Boolean).join(' '),
    });
    if (action === 'view') {
      router.push('/approvals');
    } else if (action === 'withdraw' && info.is_mine) {
      const closeProcessing = showProcessingModal('Deleting request…');
      try {
        const ok = await cancelDeletionRequest(String(info.request_id));
        if (ok) await refreshPending();
      } finally {
        closeProcessing();
      }
    }
  };

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
