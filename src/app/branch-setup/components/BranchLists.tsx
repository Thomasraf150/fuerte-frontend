"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import branchListCol from './BranchListColumn';
import subBranchListCol from './SubBranchListColumn';
import { DataBranches, DataFormBranch, DataSubBranches } from '@/utils/DataTypes';
import FormAddBranch from './FormAddBranch';
import FormAddSubBranch from './FormAddSubBranch';
import { useBranchListsStore } from '../hooks/store';
import useBranches from '@/hooks/useBranches';
import { Plus, SkipBack } from 'react-feather';
import { showConfirmationModal, showAlreadyPendingModal, showProcessingModal } from '@/components/ConfirmationModal';
import { FormCloseButton, useRevealFormWhenStacked } from '@/components/EntityListLayout';
import { usePendingDeletions, PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import useDeletionRequests from '@/hooks/useDeletionRequests';
import { pendingDeletionRowStyles } from '@/components/PendingDeletion/rowStyles';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = branchListCol;
const subcolumn = subBranchListCol;

const BranchLists: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  const { selectedRow } = useBranchListsStore.getState();
  const { dataBranch, dataBranchSub, selectedBranchID, fetchDataList, fetchSubDataList, handleDeleteBranch, handleDeleteSubBranch } = useBranches();
  const [initialFormData, setInitialFormData] = useState<DataBranches | null>(null);
  const [initialFormSubData, setInitialFormSubData] = useState<DataSubBranches | null>(null);
  const formPanelRef = useRevealFormWhenStacked<HTMLDivElement>(showForm, actionLbl, initialFormData);
  const subFormPanelRef = useRevealFormWhenStacked<HTMLDivElement>(showSubForm, actionLbl, initialFormSubData);

  const router = useRouter();
  const subBranchIds = useMemo(
    () => (dataBranchSub ?? []).map((r: any) => Number(r.id)).filter(Boolean),
    [dataBranchSub]
  );
  const { pendingByEntityId: pendingSubBranches, loading: pendingSubLoading, refresh: refreshPendingSub } =
    usePendingDeletions('branch_sub', subBranchIds);
  const { cancel: cancelDeletionRequest } = useDeletionRequests();

  const handlePendingSubClick = async (row: DataSubBranches, info: PendingDeletionInfo) => {
    const action = await showAlreadyPendingModal({
      request_id: info.request_id,
      requested_by_name: info.requested_by_name,
      reason: info.reason,
      created_at: info.created_at,
      is_mine: info.is_mine,
      entity_label: `Sub-branch ${row.name}`,
    });
    if (action === 'view') {
      router.push('/approvals');
    } else if (action === 'withdraw' && info.is_mine) {
      const closeProcessing = showProcessingModal('Deleting request…');
      try {
        const ok = await cancelDeletionRequest(String(info.request_id));
        if (ok) await refreshPendingSub();
      } finally {
        closeProcessing();
      }
    }
  };

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setShowSubForm(false);
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleUpdateRowClick = (row: DataBranches) => {
    handleShowForm('Update Branch', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };
  
  const handleSubViewRowClick = (id: number) => {
    console.log('View Subs');
    setShowSubBranch(true);
    fetchSubDataList('name_asc', id);
  };

  const handleUpdateSubRowClick = (row: DataSubBranches) => {
    handleShowSubForm('Update Sub Branch', true)
    setShowForm(false);
    setInitialFormSubData(row);
  };

  const handleCreateSubRowClick = () => {
    handleShowSubForm('Create Sub Branch', true)
    setInitialFormSubData(null);
    setShowForm(false);
  };

  const handleDeleteRow = async (id: number) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteBranch(id);
      fetchDataList();  
    }
  }
  
  const handleDeleteSubRow = async (row: DataSubBranches) => {
    // The confirmation/prompt lives inside handleDeleteSubBranch — and the
    // `onAfterRequest` callback refreshes the pending-deletion badges
    // BEFORE the submitting spinner closes, so the row updates atomically.
    await handleDeleteSubBranch(Number(row?.id), refreshPendingSub);
    fetchSubDataList('name_asc', row?.branch_id);
  }

  useEffect(() => {
  }, [dataBranch, dataBranchSub, initialFormData, selectedBranchID])

  // The list takes the full width until a form opens beside it (the empty right column was a bug).
  const listSpan = showForm || showSubForm ? 'xl:col-span-2' : 'xl:col-span-3';

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {!showSubBranch && (
          <div className={`col-span-1 ${listSpan} ${!showSubBranch ? 'fade-in' : 'fade-out'}`}>
            <Card>
              <CardHeader title="Main Branch" />
              <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={() => handleShowForm('Create Branch', true)}>
                    <Plus size={16} aria-hidden="true" />
                    <span>Create</span>
                  </Button>
                </Toolbar>
                <CustomDatatable
                  apiLoading={false}
                  title="Branch List"
                  columns={column(handleUpdateRowClick, handleSubViewRowClick, handleDeleteRow)}
                  data={dataBranch || []}
                />
              </CardBody>
            </Card>
          </div>
        )}

          {showSubBranch && (
            <div className={`col-span-1 ${listSpan} ${showSubBranch ? 'fade-in' : 'fade-out'}`}>
              <Card>
                <CardHeader title={dataBranchSub && dataBranchSub[0]?.branch?.name} />
                <CardBody>
                  <Toolbar>
                    <Button variant="secondary" onClick={() =>
                      {
                        setShowSubBranch(false)
                        setShowSubForm(false)
                      }
                      }>
                      <SkipBack size={15} aria-hidden="true" />
                      <span>Back</span>
                    </Button>
                    <Button variant="primary"
                      onClick={() => handleCreateSubRowClick() }>
                      <Plus size={16} aria-hidden="true" />
                      <span>Create</span>
                    </Button>
                  </Toolbar>
                  <CustomDatatable
                    apiLoading={pendingSubLoading}
                    title="Branch List"
                    columns={subcolumn(handleUpdateSubRowClick, handleDeleteSubRow, pendingSubBranches, handlePendingSubClick)}
                    data={dataBranchSub || []}
                    conditionalRowStyles={pendingDeletionRowStyles<DataSubBranches>(pendingSubBranches)}
                  />
                </CardBody>
              </Card>
            </div>
          )}

          {showForm && (
            <div ref={formPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <Card>
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => setShowForm(false)} />} />
                <CardBody>
                  <FormAddBranch setShowForm={setShowForm} fetchDataList={fetchDataList} initialData={initialFormData} actionLbl={actionLbl} />
                </CardBody>
              </Card>
            </div>
          )}

          {showSubForm && (
            <div ref={subFormPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <Card>
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => setShowSubForm(false)} />} />
                <CardBody>
                  <FormAddSubBranch setShowForm={setShowSubForm} selectedBranchId={selectedBranchID ?? 0} initialSubData={initialFormSubData} actionLbl={actionLbl} fetchSubDataList={fetchSubDataList}/>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchLists;