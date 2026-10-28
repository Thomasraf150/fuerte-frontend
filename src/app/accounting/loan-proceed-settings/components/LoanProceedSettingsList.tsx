"use client";

import Button from '@/components/Button';
import React, { useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import { DataLoanProceedAcctData } from '@/utils/DataTypes';
import loanProcListCol from './LoanProcListCol';
import useLoanProceedAccount from '@/hooks/useLoanProceedAccount';
import { GitBranch } from 'react-feather';
import { Card, CardBody, Toolbar } from '@/components/Card';
import { LIST_PATH } from './LoanProcSettingsFormPage';

const column = loanProcListCol;

// The form has its own URLs (/new, /<branch_sub_id>, /global), so Back and refresh keep it open.
const LoanProceedSettingsList: React.FC = () => {
  const router = useRouter();
  const { fetchLpsDataTable, lpsDataAccount, loading } = useLoanProceedAccount();

  const handleRowClick = async (row: any) => {
    console.log(row, ' row');
  }

  // A Global Default row has no branch.
  const handleWholeRowClick = (row: DataLoanProceedAcctData) => {
    router.push(`${LIST_PATH}/${row?.branch_sub_id ?? 'global'}`);
  }

  useEffect(() => {
    fetchLpsDataTable();
  }, [])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="fade-in col-span-1 xl:col-span-3">
              <Card>
                <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={() => router.push(`${LIST_PATH}/new`)}>
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
        </div>
      </div>
    </div>
  );
};

export default LoanProceedSettingsList;
