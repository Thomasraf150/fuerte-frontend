"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import borrowerCompaniesCol, { renderCompanyActions } from './BorrowerCompaniesColumn';
// import subBranchListCol from './SubBranchListColumn';
import { DataBranches, DataFormBranch, DataSubBranches, DataBorrCompanies } from '@/utils/DataTypes';
import BorrCompForm from './BorrCompForm';
// import FormAddSubBranch from './FormAddSubBranch';
// import { useBranchListsStore } from '../hooks/store';
import useBorrCompanies from '@/hooks/useBorrCompanies';
import { Plus, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { FormCloseButton, useRevealFormWhenStacked, PhoneRowText } from '@/components/EntityListLayout';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = borrowerCompaniesCol;
// const subcolumn = subBranchListCol;

const BorrowerCompaniesList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const {
    dataBorrComp,
    fetchDataBorrComp,
    handleDeleteBranch,
    borrCompFetchLoading,
    serverSidePaginationProps,
    refresh
  } = useBorrCompanies();
  
  const [initialFormData, setInitialFormData] = useState<DataBorrCompanies | null>(null);
  const [initialFormSubData, setInitialFormSubData] = useState<DataSubBranches | null>(null);
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

  const handleUpdateRowClick = (row: DataBorrCompanies) => {
    handleShowForm('Update Borrower Companies', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataBorrCompanies) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      await handleDeleteBranch(row);
      refresh();
    }
  }

  useEffect(() => {
  }, [dataBorrComp])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">


          <div className={`col-span-1 ${showForm ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            <Card>
              <CardHeader title="Companies" />
              <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={() => handleShowForm('Create Borrower Companies', true)}>
                    <Plus size={16} aria-hidden="true" />
                    <span>Create</span>
                  </Button>
                </Toolbar>
                <CustomDatatable
                  apiLoading={borrCompFetchLoading}
                  title="Companies List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  mobileRow={(row) => <PhoneRowText title={row.name} sub={row.address} />}
                  mobileActions={(row) => renderCompanyActions(row, handleUpdateRowClick, handleDeleteRow)}
                  data={dataBorrComp || []}
                  enableCustomHeader={true}
                  serverSidePagination={serverSidePaginationProps}
                />
              </CardBody>
            </Card>
          </div>

          {showForm && (
            <div ref={formPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <Card>
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => setShowForm(false)} />} />
                <CardBody>
                  <BorrCompForm setShowForm={setShowForm} fetchDataBorrComp={fetchDataBorrComp} initialData={initialFormData} actionLbl={actionLbl} />
                </CardBody>
              </Card>
            </div>
            )}


        </div>
      </div>
    </div>
  );
};

export default BorrowerCompaniesList;