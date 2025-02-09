"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import { DataChartOfAccountList } from '@/utils/DataTypes';
import LoanProcSettingsForm from './LoanProcSettingsForm';
import loanProcListCol from './LoanProcListCol';
import useLoanProceedAccount from '@/hooks/useLoanProceedAccount';
import useCoa from '@/hooks/useCoa';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = loanProcListCol;

const LoanProceedSettingsList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { fetchLpsDataTable, lpsDataAccount, loading, onSubmitLoanProSettings, fetchLpsDataForm, lpsSingleData } = useLoanProceedAccount();
  const { coaDataAccount, branchSubData, fetchCoaDataTable } = useCoa();

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  const handleRowClick = async (row: any) => {
    console.log(row, ' row');
  }

  const handleWholeRowClick = async (row: any) => {
    console.log(row?.branch_sub_id, ' row');
    setShowForm(true);
    setActionLbl('Update Account');
    fetchLpsDataForm(row)
  }

  useEffect(() => {
    fetchLpsDataTable();
    fetchCoaDataTable();
  }, [])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          {!showForm && (
            <div className={`${!showForm ? 'fade-in' : 'fade-out'} col-span-3`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    Loan Proceed Settings
                  </h3>
                </div>
                <div className="p-5">
                  <button className="bg-purple-700 text-white py-2 px-4 mb-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Account', true)}>
                    <GitBranch  size={14} /> 
                    <span>Create Account</span>
                  </button>
                </div>
                <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto">
                  <CustomDatatable
                    apiLoading={false}
                    columns={column(handleRowClick)}
                    data={lpsDataAccount || []}
                    onRowClicked={handleWholeRowClick}
                    enableCustomHeader={true} 
                    title={''}  
                  />
                  {/* <table className="w-full text-sm text-left text-black">
                    <thead className="text-xs text-black uppercase bg-gray-3">
                      <tr>
                        <th scope="col" className="px-6 py-3">Account Name</th>
                        <th scope="col" className="px-6 py-3">Account #</th>
                        <th scope="col" className="px-6 py-3">Branch</th>
                        <th scope="col" className="px-6 py-3 text-center">Is Debit</th>
                        <th scope="col" className="px-6 py-3 text-center">Balance</th>
                      </tr>
                    </thead>
                    <tbody>{renderAccounts(coaDataAccount || [])}</tbody>
                  </table> */}
                </div>
              </div>
            </div>
          )}
          {showForm && (
            <div className={`${showForm ? 'fade-in' : 'fade-out'} col-span-3`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-7">
                  <LoanProcSettingsForm 
                      setShowForm={setShowForm} 
                      actionLbl={actionLbl} 
                      lpsSingleData={lpsSingleData}
                      coaDataAccount={coaDataAccount || []} 
                      branchSubData={branchSubData} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoanProceedSettingsList;