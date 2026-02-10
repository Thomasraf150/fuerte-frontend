"use client";

import React, { useCallback, useState } from 'react';
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
  const [modalLoading, setModalLoading] = useState<boolean>(false);
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

  const handleOpenForm = useCallback((lbl: string, showFrm: boolean, account: DataChartOfAccountList | null = null) => {
    if (showFrm) {
      // Show loading overlay when opening modal
      setModalLoading(true);
      setShowForm(true);
      setActionLbl(lbl);
      setSelectedAccount(account);
      // Loading will be hidden by CoaForm's onReady callback
    } else {
      // Show loading overlay when closing modal
      setModalLoading(true);
      setShowForm(false);
      setActionLbl('');
      setSelectedAccount(null);
      // Hide loading after a brief delay for unmount animation
      setTimeout(() => setModalLoading(false), 300);
    }
  }, []);

  const handleFormReady = useCallback(() => {
    // Called by CoaForm when it has fully mounted and rendered
    setModalLoading(false);
  }, []);

  const handleCloseForm = useCallback(() => handleOpenForm('', false), [handleOpenForm]);

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
                  onClose={handleCloseForm}
                  onReady={handleFormReady}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-page loading overlay for modal operations */}
      {modalLoading && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            <p className="mt-4 text-white">Loading...</p>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default COA;
