"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import { Card, CardBody } from '@/components/Card';
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
            {/* One card on the page, so no card title: it would only repeat the page title (Decision 3). */}
            <Card>
              <CardBody>
                <CustomDatatable
                  apiLoading={loansLoading || pendingLoading}
                  columns={loansListColumn(handleRowClick, handleViewWholeLoan, pendingByEntityId, handlePendingClick)}
                  data={dataLoans}
                  serverSidePagination={{ ...serverSidePaginationProps, recordType: 'loan', recordTypePlural: 'loans' }}
                  enableCustomHeader={true}
                  title={''}
                  conditionalRowStyles={pendingDeletionRowStyles<BorrLoanRowData>(pendingByEntityId)}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansLists;
