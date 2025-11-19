"use client";

import React, { useState } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import ChartofAcctList from './components/ChartofAcctList';
import CoaForm from './components/CoaForm';
import { DataChartOfAccountList } from '@/utils/DataTypes';
import useCoa from '@/hooks/useCoa';
import { toast } from 'react-toastify';

const COA: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<DataChartOfAccountList | null>(null);
  const {
    coaDataAccount,
    fetchCoaDataTable,
    branchSubData,
    onSubmitCoa,
    coaLoading,
    loading,
    deleteCoaAccount,
    reactivateAccount,
    countInactiveDescendants,
    printChartOfAccounts
  } = useCoa();

  // PATTERN COPIED FROM: Loan Codes, Branch Setup, Area, Users, Vendors (ALL working pages)
  // Direct state changes with NO setTimeout, NO loading overlay - CSS animation handles transition
  const handleOpenForm = (lbl: string, showFrm: boolean, account: DataChartOfAccountList | null = null) => {
    console.log('🔵 MODAL - handleOpenForm called:', { lbl, showFrm, accountId: account?.id });

    if (showFrm) {
      // Check if branch data is loaded before opening form
      if (!branchSubData) {
        toast.warning('Loading branch data, please wait...');
        return;
      }

      // Direct state updates (NO setTimeout) - like ALL other working pages
      setShowForm(true);
      setActionLbl(lbl);
      setSelectedAccount(account);
      console.log('✅ MODAL - Opened instantly');
    } else {
      // Direct close (NO setTimeout) - like ALL other working pages
      setShowForm(false);
      setActionLbl('');
      setSelectedAccount(null);
      console.log('✅ MODAL - Closed instantly');
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Chart of Accounts" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className={showForm ? 'col-span-2' : 'col-span-3'}>
          <ChartofAcctList
            coaDataAccount={coaDataAccount}
            fetchCoaDataTable={fetchCoaDataTable}
            onOpenForm={handleOpenForm}
            loading={loading}
            deleteCoaAccount={deleteCoaAccount}
            reactivateAccount={reactivateAccount}
            countInactiveDescendants={countInactiveDescendants}
            branchSubData={branchSubData}
            printChartOfAccounts={printChartOfAccounts}
          />
        </div>

        {showForm && (
          <div className="fade-in col-span-1">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  {actionLbl}
                </h3>
              </div>
              <div className="p-7">
                <CoaForm
                  setShowForm={setShowForm}
                  fetchCoaDataTable={fetchCoaDataTable}
                  actionLbl={actionLbl}
                  coaDataAccount={coaDataAccount || []}
                  selectedAccount={selectedAccount}
                  branchSubData={branchSubData}
                  onSubmitCoa={onSubmitCoa}
                  coaLoading={coaLoading}
                  onClose={() => handleOpenForm('', false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* NO loading overlay - CSS animation (0.5s) handles transition like ALL other working pages */}
    </DefaultLayout>
  );
};

export default COA;
