"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loanCodeListColumn, { renderLoanCodeActions } from './LoanCodeListColumn';
import { DataRowLoanCodes } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';
import Button from '@/components/Button';
import { PhoneRowText } from '@/components/EntityListLayout';
import ErrorAlert from '@/components/ErrorAlert';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = loanCodeListColumn;

const LoanCodeList: React.FC = () => {
  const router = useRouter();
  const {
    dataLoanCodes,
    loanCodesLoading,
    loanCodesError,
    serverSidePaginationProps,
    refresh
  } = useLoanCodes();

  // Navigate to edit page on action button click (URL-based routing)
  const handleRowClick = (row: DataRowLoanCodes) => {
    router.push(`/loan-codes/${row.id}`);
  };

  // Navigate to create page (URL-based routing)
  const handleCreateLoanCode = () => {
    router.push('/loan-codes/new');
  };

  // Navigate to detail page on whole row click (URL-based routing)
  const handleWholeRowClick = (data: DataRowLoanCodes) => {
    router.push(`/loan-codes/${data.id}`);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <Card>
              <CardHeader title="Loan Code" />
              <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={handleCreateLoanCode}>Create</Button>
                </Toolbar>
                {loanCodesError && (
                  <ErrorAlert title="The loan codes didn't load." detail={loanCodesError} onRetry={refresh} />
                )}
                <CustomDatatable
                  loadFailed={Boolean(loanCodesError)}
                  apiLoading={loanCodesLoading}
                  title={``}
                  columns={column(handleRowClick)}
                  mobileRow={(row) => <PhoneRowText title={row.code} sub={`${row.description} · ${row.loan_type.name}`} />}
                  mobileActions={(row) => renderLoanCodeActions(row, handleRowClick)}
                  enableCustomHeader={true}
                  data={dataLoanCodes}
                  onRowClicked={handleWholeRowClick}
                  serverSidePagination={serverSidePaginationProps}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCodeList;