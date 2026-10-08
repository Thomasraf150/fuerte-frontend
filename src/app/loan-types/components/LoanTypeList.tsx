"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loanTypeListColumn from './LoanTypeListColumn';
import LoanTypeForm from './LoanTypeForm';
import useLoanTypes from '@/hooks/useLoanTypes';
import { DataRowLoanTypeList, DataFormLoanType } from '@/utils/DataTypes';
import { showAlreadyPendingModal, showProcessingModal } from '@/components/ConfirmationModal';
import { usePendingDeletions, PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import useDeletionRequests from '@/hooks/useDeletionRequests';
import { pendingDeletionRowStyles } from '@/components/PendingDeletion/rowStyles';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const LoanTypeList: React.FC = () => {
  const {
    dataLoanTypes,
    loading,
    submitting,
    fetchLoanTypes,
    onSubmitLoanType,
    handleDeleteLoanType,
  } = useLoanTypes();

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<DataRowLoanTypeList | null>(null);

  const router = useRouter();
  const entityIds = useMemo(
    () => (dataLoanTypes ?? []).map((r: any) => Number(r.id)).filter(Boolean),
    [dataLoanTypes]
  );
  const { pendingByEntityId, loading: pendingLoading, refresh: refreshPending } = usePendingDeletions('loan_type', entityIds);
  const { cancel: cancelDeletionRequest } = useDeletionRequests();

  useEffect(() => {
    fetchLoanTypes();
  }, [fetchLoanTypes]);

  const handleCreate = () => {
    setEditData(null);
    setShowForm(true);
  };

  const handleEdit = (row: DataRowLoanTypeList) => {
    setEditData(row);
    setShowForm(true);
  };

  const handleDelete = async (row: DataRowLoanTypeList) => {
    // refreshPending is passed in so the spinner stays open until the
    // badge data is ready — no flash-of-no-badge after the modal closes.
    await handleDeleteLoanType(row.id, refreshPending);
  };

  const handlePendingClick = async (row: DataRowLoanTypeList, info: PendingDeletionInfo) => {
    const action = await showAlreadyPendingModal({
      request_id: info.request_id,
      requested_by_name: info.requested_by_name,
      reason: info.reason,
      created_at: info.created_at,
      is_mine: info.is_mine,
      entity_label: `Loan type ${row.name}`,
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

  const handleFormSubmit = async (data: DataFormLoanType) => {
    const result = await onSubmitLoanType(data);
    if (result.success) {
      setShowForm(false);
      setEditData(null);
    }
    return result;
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditData(null);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className={`col-span-1 ${showForm ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            <Card>
              <CardHeader title="Loan Types" />
              <CardBody>
                <Toolbar>
                  <Button variant="primary"
                    onClick={handleCreate}>
                    Create
                  </Button>
                </Toolbar>
                <CustomDatatable
                  apiLoading={loading || pendingLoading}
                  title=""
                  columns={loanTypeListColumn(handleEdit, handleDelete, pendingByEntityId, handlePendingClick)}
                  enableCustomHeader={true}
                  data={dataLoanTypes}
                  conditionalRowStyles={pendingDeletionRowStyles<DataRowLoanTypeList>(pendingByEntityId)}
                />
              </CardBody>
            </Card>
          </div>

          {showForm && (
            <div className="col-span-1">
              <Card>
                <CardHeader title={editData ? 'Update Loan Type' : 'Create Loan Type'} />
                <CardBody>
                  <LoanTypeForm
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                    initialData={editData}
                    submitting={submitting}
                  />
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanTypeList;
