"use client";

import Button from '@/components/Button';
import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import AEForm from './AEForm';
import useAdjustingEntries from '@/hooks/useAdjustingEntries';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet, RowAcctgEntry } from '@/utils/DataTypes';
import aETblColumn from './AETblColumn';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = aETblColumn;

const AdjustingEntriesList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const {
    dataAe,
    createAe,
    fetchAe,
    adjustingEntriesLoading,
    paginationLoading,
    serverSidePaginationProps,
    adjustingEntriesError,
    refresh
  } = useAdjustingEntries();
  const [singleData, setSingleData] = useState<RowAcctgEntry>();
  const [showFormAe, setShowFormAe] = useState<boolean>(false);
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  const handleShowFormAe = (lbl: string, showFrm: boolean) => {
    setShowFormAe(showFrm);
    setActionLbl(lbl);
    setSingleData(undefined);
  }

  const handleWholeRowClick = (row: RowAcctgEntry) => {
    console.log(row, ' row');
    setSingleData(row);
    setShowFormAe(true);
    setActionLbl('View Adjusting Entries');
  }

  useEffect(() => {

  }, [])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showFormAe && (
            <div className={`col-span-2 ${!showFormAe ?'fade-in' : 'fade-out'}`}>
              <Card>
                <CardHeader title="Adjusting Entries" />
                <CardBody>
                <Toolbar>
                  <Button variant="primary"
                    type="button"
                    onClick={ () => handleShowFormAe('Create Adjusting Entries', true) }>
                      <Plus size={14} />
                      <span>New Adjusting Entry</span>
                  </Button>
                </Toolbar>
                  {adjustingEntriesError && (
                    <div className="p-4 bg-danger/10 border border-danger text-danger rounded">
                      Error loading adjusting entries: {adjustingEntriesError}
                      <Button variant="secondary" className="ml-2"
                        onClick={refresh}>
                        Retry
                      </Button>
                    </div>
                  )}
                  <CustomDatatable
                    apiLoading={paginationLoading}
                    title="AE List"
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    data={dataAe || []}
                    enableCustomHeader={true}
                    serverSidePagination={serverSidePaginationProps}
                  />
                </CardBody>
              </Card>
            </div>
          )}
          {showFormAe && (
            <div className={`col-span-2 ${showFormAe ?'fade-in' : 'fade-out'}`}>
              <Card>
                <AEForm
                  setShowForm={setShowFormAe}
                  actionLbl={actionLbl}
                  singleData={singleData}
                  createAe={createAe}
                  fetchAe={fetchAe}
                  refresh={refresh}
                  loading={adjustingEntriesLoading}
                />
              </Card>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default AdjustingEntriesList;