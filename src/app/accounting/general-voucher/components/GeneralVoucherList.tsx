"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import CVForm from './CVForm';
import JVForm from './JVForm';
import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import gVTblColumn from './GVTblColumn';
import { RowAcctgEntry } from '@/utils/DataTypes';

const column = gVTblColumn;

const GeneralVoucherList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showFormCv, setShowFormCv] = useState<boolean>(false);
  const [showFormJv, setShowFormJv] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<RowAcctgEntry>();
  const { dataGV, createGV, updateGV, fetchGV, printSummaryTicketDetails, loading, setLoading, generalVoucherLoading, pubSubBrId } = useGeneralVoucher();
  
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
  }, [dataGV])

  const handleWholeRowClick = (row: RowAcctgEntry) => {
    console.log(row, ' row');
    setSingleData(row);
    if (row?.journal_name === 'Check Voucher') {
      setShowFormCv(true);
      setActionLbl('Update Check Voucher');
    } else {
      setShowFormJv(true);
      setActionLbl('Update Journal Voucher');
    }
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
                    General Voucher
                  </h3>
                </div>
                <div className="p-5 flex gap-x-2">  {/* Added flex and gap-x-2 */}
                  <button 
                    type="button" 
                    className="text-white bg-gradient-to-r items-center from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 flex space-x-2 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    onClick={ () => handleShowFormCv('Create Check Voucher', true) }>
                      <Plus size={14} /> 
                      <span>New CV</span>
                  </button>
                  <button 
                    type="button" 
                    className="text-white bg-gradient-to-r items-center from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 flex space-x-2 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    onClick={ () => handleShowFormJv('Create Journal Voucher', true) }>
                      <Plus size={14} /> 
                      <span>New JV</span>
                  </button>
                </div>
                <div className="px-4">
                  <CustomDatatable
                    apiLoading={loading}
                    title=""
                    onRowClicked={handleWholeRowClick}
                    enableCustomHeader={true} 
                    columns={column()}
                    data={dataGV || []}
                  />
                </div>
              </div>
            </div>
          )}
          {showFormCv && (
            <div className={`col-span-2 ${showFormCv ?'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <CVForm
                  setShowForm={setShowFormCv}
                  actionLbl={actionLbl}
                  singleData={singleData}
                  createGV={createGV}
                  updateGV={updateGV}
                  fetchGV={fetchGV}
                  loading={loading}
                  generalVoucherLoading={generalVoucherLoading}
                  pubSubBrId={pubSubBrId}
                  printSummaryTicketDetails={printSummaryTicketDetails} />
              </div>
            </div>
          )}
          {showFormJv && (
            <div className={`col-span-2 ${showFormJv ?'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <JVForm
                  setShowForm={setShowFormJv}
                  actionLbl={actionLbl}
                  singleData={singleData}
                  createGV={createGV}
                  fetchGV={fetchGV}
                  loading={loading}
                  generalVoucherLoading={generalVoucherLoading}
                  pubSubBrId={pubSubBrId}
                  printSummaryTicketDetails={printSummaryTicketDetails} />
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default GeneralVoucherList;