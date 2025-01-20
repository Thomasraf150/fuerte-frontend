"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import { DataChartOfAccountList } from '@/utils/DataTypes';
import CoaForm from './CoaForm';
import useCoa from '@/hooks/useCoa';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';


const ChartofAcctList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  useEffect(() => {
    fetchCoaDataTable();
  }, [])

  const renderAccounts = (accounts: DataChartOfAccountList[], level: number = 1) => {
    return accounts.map((account) => (
      <React.Fragment key={account.id}>
        <tr className="bg-white border-b hover:bg-gray-3 cursor-pointer">
          <td className="px-6 py-4 text-sm font-medium text-form-strokedark" style={{ paddingLeft: `${level * 20}px` }}>{account.account_name}</td>
          <td className="px-6 py-4 text-sm font-medium text-form-strokedark" style={{ paddingLeft: `${level * 20}px` }}>{account.number}</td>
          <td className="px-6 py-4 text-sm font-medium text-form-strokedark" style={{ paddingLeft: `${level * 20}px` }}>{account?.branch_sub.name}</td>
          <td className="px-6 py-4 text-sm text-center text-form-strokedark">{account.is_debit === '1' ? 'Yes' : 'No'}</td>
          <td className="px-6 py-4 text-sm text-center text-form-strokedark">{account.balance}</td>
        </tr>
        {account.subAccounts && renderAccounts(account.subAccounts, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className={`col-span-2`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 overflow-y-auto min-h-[300px]">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-boxdark dark:text-boxdark">
                  Chart of Accounts
                </h3>
              </div>
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5">
                <button className="bg-purple-700 text-white py-2 px-4 mb-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Account', true)}>
                  <GitBranch  size={14} /> 
                  <span>Create Account</span>
                </button>
                <table className="w-full text-sm text-left text-black">
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
                </table>
              </div>
            </div>
          </div>

          {showForm && (
            <div className="fade-in">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-7">
                  <CoaForm setShowForm={setShowForm} fetchCoaDataTable={fetchCoaDataTable} actionLbl={actionLbl} coaDataAccount={coaDataAccount || []} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ChartofAcctList;