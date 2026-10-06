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
import { useStore } from 'zustand';
import { useAuthStore } from '@/store';
import BorrowerPhoneRow from './BorrowerPhoneRow';

/** Whether the user sees more than one branch's borrowers: the Owner, or more than one assigned branch. */
const useSeesManyBranches = (): boolean =>
  useStore(useAuthStore, (state) => state.user?.role?.code === 'OWN' || (state.user?.assignedBranchSubIds?.length ?? 0) > 1);

const borrowerHref = (row: BorrowerRowInfo): string => `/borrowers/${row.id}`;

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
  const seesManyBranches = useSeesManyBranches();

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
    <div className="borrowers-list">
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              {/* No card heading: the page title above already says "Borrowers" (B1). */}
              <div className="p-3 md:p-7">
                <button className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90" onClick={handleCreateBorrower}>Create</button>
                {borrowerError && (
                  <div className="mb-4 p-4 bg-danger/10 border border-danger text-danger rounded">
                    Error loading borrowers: {borrowerError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-danger text-white rounded text-sm hover:bg-opacity-90"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <div className="mb-3">
                  <PayerFilterChips value={payerFilter} onChange={setPayerFilter} />
                </div>
                <CustomDatatable
                  apiLoading={paginationLoading || pendingLoading}
                  columns={borrowerColumn(handleRowClick, handleRowRmBorrClick, pendingByEntityId, handlePendingClick)}
                  data={dataBorrower}
                  enableCustomHeader={true}
                  title={''}
                  serverSidePagination={serverSidePaginationProps}
                  conditionalRowStyles={pendingDeletionRowStyles<BorrowerRowInfo>(pendingByEntityId)}
                  searchLabel="Search borrowers"
                  searchPlaceholder="Name, mobile no. or chief"
                  rowHref={borrowerHref}
                  mobileRow={(row) => (
                    <BorrowerPhoneRow row={row} showBranch={seesManyBranches} pendingDeletion={pendingByEntityId.has(Number(row.id))} />
                  )}
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
