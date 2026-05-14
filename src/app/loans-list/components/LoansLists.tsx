"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loansListColumn from './LoansListColumn';
import { BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';
import { usePendingDeletions, PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import { showAlreadyPendingModal, showProcessingModal } from '@/components/ConfirmationModal';
import useDeletionRequests from '@/hooks/useDeletionRequests';
import { pendingDeletionRowStyles } from '@/components/PendingDeletion/rowStyles';

const LoansLists: React.FC = () => {
  const router = useRouter();
  const {
    dataLoans,
    loansLoading,
    serverSidePaginationProps,
    handleDeleteLoans,
  } = useLoans();

  const entityIds = useMemo(
    () => (dataLoans ?? []).map((r: any) => Number(r.id)).filter(Boolean),
    [dataLoans]
  );

  const { pendingByEntityId, loading: pendingLoading, refresh: refreshPending } = usePendingDeletions('loan', entityIds);
  const { cancel: cancelDeletionRequest } = useDeletionRequests();

  const handleRowClick = async (data: BorrLoanRowData) => {
    await handleDeleteLoans(String(data.id), 'rm_loans', refreshPending);
  };

  const handleViewWholeLoan = (data: BorrLoanRowData) => {
    router.push(`/loans-list/${data.id}`);
  };

  const handlePendingClick = async (row: BorrLoanRowData, info: PendingDeletionInfo) => {
    const action = await showAlreadyPendingModal({
      request_id: info.request_id,
      requested_by_name: info.requested_by_name,
      reason: info.reason,
      created_at: info.created_at,
      is_mine: info.is_mine,
      entity_label: `Loan ${row.loan_ref ?? `#${row.id}`}${row.borrower?.lastname ? ` — ${row.borrower.lastname}, ${row.borrower.firstname ?? ''}` : ''}`,
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
                  Loans List
                </h3>
              </div>
              <div className="p-7">
                <CustomDatatable
                  apiLoading={loansLoading || pendingLoading}
                  columns={loansListColumn(handleRowClick, handleViewWholeLoan, pendingByEntityId, handlePendingClick)}
                  data={dataLoans}
                  serverSidePagination={serverSidePaginationProps}
                  enableCustomHeader={true}
                  title={''}
                  conditionalRowStyles={pendingDeletionRowStyles<BorrLoanRowData>(pendingByEntityId)}
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
