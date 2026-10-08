"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import bankListCol from './BankListColumn';
import { DataBank } from '@/utils/DataTypes';
import BankForm from './BankForm';
import useBank from '@/hooks/useBank';
import { Plus, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { FormCloseButton, useRevealFormWhenStacked } from '@/components/EntityListLayout';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = bankListCol;

const BankList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { dataBank, fetchDataBank, handleDeleteBank, loading } = useBank();
  
  const [initialFormData, setInitialFormData] = useState<DataBank | null>(null);
  const formPanelRef = useRevealFormWhenStacked<HTMLDivElement>(showForm, actionLbl, initialFormData);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setShowSubForm(false);
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleUpdateRowClick = (row: DataBank) => {
    handleShowForm('Update Bank', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataBank) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      // Await the delete (avoids the refetch racing the soft-delete) and
      // refetch the same page size the list mounts with (100) — refetching
      // with 10 collapsed the table to 10 rows after any delete.
      await handleDeleteBank(row);
      fetchDataBank(100, 1);
    }
  }

  useEffect(() => {
  }, [dataBank])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">


          <div className={`col-span-1 ${showForm ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            <Card>
              <CardHeader title="Banks" />
              <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={() => handleShowForm('Create Bank', true)}>
                    <Plus size={16} aria-hidden="true" />
                    <span>Create</span>
                  </Button>
                </Toolbar>
                <CustomDatatable
                  apiLoading={loading}
                  title="Bank List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataBank || []}
                />
              </CardBody>
            </Card>
          </div>

          {showForm && (
            <div ref={formPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <Card>
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => setShowForm(false)} />} />
                <CardBody>
                  <BankForm setShowForm={setShowForm} fetchDataBank={fetchDataBank} initialData={initialFormData} actionLbl={actionLbl} />
                </CardBody>
              </Card>
            </div>
            )}


        </div>
      </div>
    </div>
  );
};

export default BankList;