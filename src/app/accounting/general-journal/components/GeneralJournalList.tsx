"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import useGeneralJournal from '@/hooks/useGeneralJournal';
import useCoa from '@/hooks/useCoa';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import gJTblColumn from './GJTblColumn';
import GJForm from './GJForm';
import { RowAcctgEntry } from '@/utils/DataTypes';

const column = gJTblColumn;

const GeneralJournalList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showFormCv, setShowFormCv] = useState<boolean>(false);
  const [showFormJv, setShowFormJv] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<RowAcctgEntry>();
  const { fetchGJ, dataGj, loading } = useGeneralJournal();
  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  
  const handleShowFormCv = (lbl: string, showFrm: boolean) => {
    setShowFormCv(showFrm);
    setActionLbl(lbl);
    setSingleData(undefined);
  }
  const handleShowFormJv = (lbl: string, showFrm: boolean) => {
    setShowFormJv(showFrm);
    setActionLbl(lbl);
    setSingleData(undefined);
  }

  useEffect(() => {
    fetchGJ("","","","GJ");
  }, [])

  const handleWholeRowClick = (row: RowAcctgEntry) => {
    console.log(row, ' row');
    setSingleData(row);
    setActionLbl('Reference #:');
    setShowFormJv(true);
  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showFormCv && !showFormJv && (
            <div className={`col-span-2 ${!showFormCv ?'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    General Journal
                  </h3>
                </div>
                <div className="px-4">
                  <CustomDatatable
                    apiLoading={false}
                    title=""
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    enableCustomHeader={true} 
                    data={dataGj || []}
                  />
                </div>
              </div>
            </div>
          )}
          {showFormJv && (
            <div className={`col-span-2 ${showFormJv ?'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <GJForm 
                  setShowForm={setShowFormJv} 
                  actionLbl={actionLbl} 
                  singleData={singleData} 
                  loading={loading}
                  coaDataAccount={coaDataAccount || []}
                  fetchCoaDataTable={fetchCoaDataTable} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralJournalList;