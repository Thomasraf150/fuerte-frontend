"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import chiefListCol from './ChiefListColumn';
import { DataChief } from '@/utils/DataTypes';
import ChiefForm from './ChiefForm';
import useChiefs from '@/hooks/useChiefs';
import { Plus, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { FormCloseButton, useRevealFormWhenStacked } from '@/components/EntityListLayout';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = chiefListCol;

const ChiefList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { dataChief, fetchDataChief, handleDeleteChief, chiefFetchLoading, chiefPaginator } = useChiefs();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handlePageChange = (p: number) => { setPage(p); fetchDataChief(pageSize, p); };
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); fetchDataChief(s, 1); };

  const [initialFormData, setInitialFormData] = useState<DataChief | null>(null);
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

  const handleUpdateRowClick = (row: DataChief) => {
    handleShowForm('Update Chief', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataChief) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      // Await the delete so the refetch runs after the soft-delete commits.
      await handleDeleteChief(row);
      fetchDataChief(pageSize, page);
    }
  }

  useEffect(() => {
  }, [dataChief])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">


          <div className={`col-span-1 ${showForm ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            <Card>
              <CardHeader title="Chiefs" />
              <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={() => handleShowForm('Create Chief', true)}>
                    <Plus size={16} aria-hidden="true" />
                    <span>Create</span>
                  </Button>
                </Toolbar>
                <CustomDatatable
                  apiLoading={chiefFetchLoading}
                  title="Chief List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataChief || []}
                  serverSidePagination={{
                    totalRecords: chiefPaginator?.total ?? 0,
                    currentPage: chiefPaginator?.currentPage ?? page,
                    pageSize: chiefPaginator?.perPage ?? pageSize,
                    totalPages: chiefPaginator?.lastPage ?? 1,
                    hasNextPage: chiefPaginator?.hasMorePages ?? false,
                    hasPreviousPage: (chiefPaginator?.currentPage ?? page) > 1,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    recordType: 'chief',
                    recordTypePlural: 'chiefs',
                    enableSearch: false,
                  }}
                />
              </CardBody>
            </Card>
          </div>

          {showForm && (
            <div ref={formPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <Card>
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => setShowForm(false)} />} />
                <CardBody>
                  <ChiefForm setShowForm={setShowForm} fetchDataChief={fetchDataChief} initialData={initialFormData} actionLbl={actionLbl} />
                </CardBody>
              </Card>
            </div>
            )}


        </div>
      </div>
    </div>
  );
};

export default ChiefList;