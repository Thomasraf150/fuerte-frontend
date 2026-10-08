"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import { Eye, Trash2 } from 'react-feather';
import Button from '@/components/Button';
import { Card, CardBody } from '@/components/Card';
import LoanPhoneRow from '@/components/LoanPhoneRow';
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
                  rowHref={(row) => `/loans-list/${row.id}`}
                  mobileActions={(row) => {
                    const info = pendingByEntityId.get(Number(row.id));
                    const deletable = row?.acctg_entry === null && row.is_closed !== '1' && row.status <= 3;
                    return (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleViewWholeLoan(row)}>
                          <Eye size="16" aria-hidden="true" />
                          <span>View</span>
                        </Button>
                        {deletable && info && (
                          <Button variant="secondary" size="sm" onClick={() => handlePendingClick(row, info)}>
                            <Trash2 size="16" aria-hidden="true" />
                            <span>Already in deletion queue</span>
                          </Button>
                        )}
                        {deletable && !info && (
                          <Button variant="danger" size="sm" onClick={() => handleRowClick(row)}>
                            <Trash2 size="16" aria-hidden="true" />
                            <span>Remove</span>
                          </Button>
                        )}
                      </>
                    );
                  }}
                  mobileRow={(row) => (
                    <LoanPhoneRow
                      row={row}
                      note={
                        pendingByEntityId.has(Number(row.id)) && row?.acctg_entry === null && row.is_closed !== '1' && row.status <= 3
                          ? 'Deletion pending'
                          : undefined
                      }
                    />
                  )}
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
