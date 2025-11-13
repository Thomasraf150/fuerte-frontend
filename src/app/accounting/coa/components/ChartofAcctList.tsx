"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import { DataChartOfAccountList } from '@/utils/DataTypes';
import CoaForm from './CoaForm';
import useCoa from '@/hooks/useCoa';
import exportToExcel from '@/hooks/usePrintExcel';
import { GitBranch, Printer, Search } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';


const ChartofAcctList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { coaDataAccount, fetchCoaDataTable, loading } = useCoa();

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  // Recursive filter function that preserves hierarchy
  const filterAccounts = (accounts: DataChartOfAccountList[], term: string): DataChartOfAccountList[] => {
    if (!term.trim()) return accounts;

    const lowerTerm = term.toLowerCase();

    return accounts.reduce((filtered: DataChartOfAccountList[], account) => {
      // Check if current account matches
      const accountMatches =
        account.account_name?.toLowerCase().includes(lowerTerm) ||
        account.number?.toLowerCase().includes(lowerTerm);

      // Filter children recursively
      const filteredChildren = account.subAccounts
        ? filterAccounts(account.subAccounts, term)
        : [];

      // Include account if it matches OR if any children match
      if (accountMatches || filteredChildren.length > 0) {
        filtered.push({
          ...account,
          subAccounts: filteredChildren.length > 0 ? filteredChildren : account.subAccounts
        });
      }

      return filtered;
    }, []);
  };

  useEffect(() => {
    fetchCoaDataTable();

    console.log(coaDataAccount, 'coaDataAccount');
  }, [])

  const renderAccounts = (accounts: DataChartOfAccountList[], level: number = 1) => {
    return accounts.map((account) => (
      <React.Fragment key={account.id}>
        <tr className="bg-white dark:bg-boxdark-2 border-b dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4 cursor-pointer">
          <td className="px-6 py-2 text-sm font-medium text-form-strokedark dark:text-bodydark" style={{ paddingLeft: `${level * 20}px` }}>{account.account_name}</td>
          <td className="px-6 py-2 text-sm font-medium text-form-strokedark dark:text-bodydark" style={{ paddingLeft: `${level * 20}px` }}>{account.number}</td>
          <td className="px-6 py-2 text-sm font-medium text-form-strokedark dark:text-bodydark" style={{ paddingLeft: `${level * 20}px` }}>{account?.branch_sub?.name}</td>
          <td className="px-6 py-2 text-sm text-center text-form-strokedark dark:text-bodydark">{account.is_debit === '1' ? 'Yes' : 'No'}</td>
          <td className="px-6 py-2 text-sm text-center text-form-strokedark dark:text-bodydark">{account.balance}</td>
        </tr>
        {account.subAccounts && renderAccounts(account.subAccounts, level + 1)}
      </React.Fragment>
    ));
  };

  // Apply filter to get filtered accounts
  const filteredAccounts = filterAccounts(coaDataAccount || [], searchTerm);

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className={showForm ? `col-span-2` : `col-span-3`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-boxdark dark:text-boxdark">
                  Chart of Accounts
                </h3>
              </div>
              <div className="p-5 flex">
                <button className="bg-purple-700 text-white py-2 px-4 mb-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Account', true)}>
                  <GitBranch  size={14} />
                  <span>Create Account</span>
                </button>
                <button className="bg-green-500 text-white py-2 px-4 mb-4 rounded hover:bg-green-700 flex items-center space-x-2" onClick={() => exportToExcel(coaDataAccount || [], "User_Data")}>
                  <Printer size={14} />
                  <span>Print COA</span>
                </button>
              </div>
              <div className="px-5 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by Account Name or Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-stroke bg-white dark:bg-form-input text-gray-900 dark:text-white dark:border-strokedark focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] h-[600px]">
                <table className="w-full text-sm text-left text-black dark:text-white">
                  <thead className="text-xs text-black dark:text-white uppercase bg-gray-3 dark:bg-meta-4">
                    <tr>
                      <th scope="col" className="px-6 py-3">Account Name</th>
                      <th scope="col" className="px-6 py-3">Account #</th>
                      <th scope="col" className="px-6 py-3">Branch</th>
                      <th scope="col" className="px-6 py-3 text-center">Is Debit</th>
                      <th scope="col" className="px-6 py-3 text-center">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="text-gray-500 dark:text-gray-400">Loading accounts...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAccounts.length > 0 ? (
                      renderAccounts(filteredAccounts)
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'No accounts found matching your search.' : 'No accounts available.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
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