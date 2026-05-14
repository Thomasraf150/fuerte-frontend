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
import { GitBranch, SkipBack, X } from 'react-feather';
import { showConfirmationModal, showAlreadyPendingModal, showProcessingModal } from '@/components/ConfirmationModal';
import { usePendingDeletions, PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import useDeletionRequests from '@/hooks/useDeletionRequests';
import { pendingDeletionRowStyles } from '@/components/PendingDeletion/rowStyles';

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
    fetchSubDataList('id_desc', id);
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
    fetchSubDataList('id_desc', row?.branch_id);
  }

  useEffect(() => {
  }, [dataBranch, dataBranchSub, initialFormData, selectedBranchID])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!showSubBranch && (
          <div className={`col-span-1 md:col-span-1 lg:col-span-2 ${!showSubBranch ? 'fade-in' : 'fade-out'}`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Main Branch
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Branch', true)}>
                  <GitBranch  size={14} /> 
                  <span>Create</span>
                </button>
                <CustomDatatable
                  apiLoading={false}
                  title="Branch List"
                  columns={column(handleUpdateRowClick, handleSubViewRowClick, handleDeleteRow)}
                  data={dataBranch || []}
                />
              </div>
            </div>
          </div>
        )}

          {showSubBranch && (
            <div className={`col-span-1 md:col-span-1 lg:col-span-2 ${showSubBranch ? 'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {dataBranchSub && dataBranchSub[0]?.branch?.name}
                  </h3>
                </div>
                <div className="p-7">
                  <div className="flex items-center space-x-2">
                    <button 
                      className="bg-rose-600 text-white py-2 px-4 rounded hover:bg-rose-800 flex items-center space-x-2" onClick={() => 
                      {
                        setShowSubBranch(false)
                        setShowSubForm(false)
                      } 
                      }>
                      <SkipBack size={15} /> 
                      <span>Back</span>
                    </button>
                    <button 
                      className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" 
                      onClick={() => handleCreateSubRowClick() }>
                      <GitBranch  size={14} /> 
                      <span>Create</span>
                    </button>
                  </div>
                  <CustomDatatable
                    apiLoading={pendingSubLoading}
                    title="Branch List"
                    columns={subcolumn(handleUpdateSubRowClick, handleDeleteSubRow, pendingSubBranches, handlePendingSubClick)}
                    data={dataBranchSub || []}
                    conditionalRowStyles={pendingDeletionRowStyles<DataSubBranches>(pendingSubBranches)}
                  />
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="fade-in col-span-1">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex justify-between items-center">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                  <span className="text-right cursor-pointer text-boxdark-2 lg:hidden" onClick={() => setShowForm(false)}>
                    <X size={17}/>
                  </span>
                </div>
                <div className="p-7">
                  <FormAddBranch setShowForm={setShowForm} fetchDataList={fetchDataList} initialData={initialFormData} actionLbl={actionLbl} />
                </div>
              </div>
            </div>
          )}
          
          {showSubForm && (
            <div className="fade-in col-span-1">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex justify-between items-center">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                  <span className="text-right cursor-pointer text-boxdark-2 lg:hidden" onClick={() => setShowSubForm(false)}>
                    <X size={17}/>
                  </span>
                </div>
                <div className="p-7">
                  <FormAddSubBranch setShowForm={setShowSubForm} selectedBranchId={selectedBranchID ?? 0} initialSubData={initialFormSubData} actionLbl={actionLbl} fetchSubDataList={fetchSubDataList}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchLists;