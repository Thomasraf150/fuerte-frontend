"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loanProductListColumn, { renderLoanProductActions } from './LoanProductListColumn';
import { DataRowLoanProducts } from '@/utils/DataTypes';
import useLoanProducts from '@/hooks/useLoanProducts';
import Button from '@/components/Button';
import { PhoneRowText } from '@/components/EntityListLayout';
import ErrorAlert from '@/components/ErrorAlert';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = loanProductListColumn;

const LoanProductList: React.FC = () => {
  const router = useRouter();
  const {
    dataLoanProducts,
    loanProductsLoading,
    loanProductsError,
    serverSidePaginationProps,
    refresh
  } = useLoanProducts();

  // Navigate to create page (URL-based routing)
  const handleCreateLoanProduct = () => {
    router.push('/loan-products/new');
  };

  // Navigate to edit page on action button click (URL-based routing)
  const handleRowClick = (data: DataRowLoanProducts) => {
    router.push(`/loan-products/${data.id}`);
  };

  // Navigate to detail page on whole row click (URL-based routing)
  const handleWholeRowClick = (data: DataRowLoanProducts) => {
    router.push(`/loan-products/${data.id}`);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <Card>
              <CardHeader title="Loan Product" />
              <CardBody>
                <Toolbar>
                  <Button variant="primary" onClick={handleCreateLoanProduct}>Create</Button>
                </Toolbar>
                {loanProductsError && (
                  <ErrorAlert title="The loan products didn't load." detail={loanProductsError} onRetry={refresh} />
                )}
                <CustomDatatable
                  loadFailed={Boolean(loanProductsError)}
                  apiLoading={loanProductsLoading}
                  columns={column(handleRowClick)}
                  mobileRow={(row) => <PhoneRowText title={row.description} sub={`Loan code ${row.loan_code_id} · Terms ${row.terms}`} />}
                  mobileActions={(row) => renderLoanProductActions(row, handleRowClick)}
                  data={dataLoanProducts}
                  enableCustomHeader={true}
                  onRowClicked={handleWholeRowClick}
                  title={''}
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

export default LoanProductList;