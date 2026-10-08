"use client";

import Button from '@/components/Button';
import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import { DataChartOfAccountList } from '@/utils/DataTypes';
import LoanProcSettingsForm from './LoanProcSettingsForm';
import loanProcListCol from './LoanProcListCol';
import useLoanProceedAccount from '@/hooks/useLoanProceedAccount';
import useCoa from '@/hooks/useCoa';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {!showForm && (
            <div className={`${!showForm ? 'fade-in' : 'fade-out'} col-span-1 xl:col-span-3`}>
              <Card>
                <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={() => handleShowForm('Create Account', true)}>
                    <GitBranch  size={14} /> 
                    <span>Create Account</span>
                  </Button>
                </Toolbar>
                <div className="overflow-x-auto overflow-y-auto">
                  <CustomDatatable
                    apiLoading={loading}
                    columns={column(handleRowClick)}
                    data={[...(lpsDataAccount || [])].sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0))}
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
                </CardBody>
              </Card>
            </div>
          )}
          {showForm && (
            <div className={`${showForm ? 'fade-in' : 'fade-out'} col-span-1 xl:col-span-3`}>
              <Card>
                <CardHeader title={actionLbl} />
                <CardBody>
                  <LoanProcSettingsForm
                      setShowForm={setShowForm}
                      actionLbl={actionLbl}
                      lpsSingleData={lpsSingleData}
                      coaDataAccount={coaDataAccount || []}
                      branchSubData={branchSubData}
                      onSaveSuccess={fetchLpsDataTable} />
                </CardBody>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoanProceedSettingsList;