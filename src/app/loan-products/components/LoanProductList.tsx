"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import loanProductListColumn from './LoanProductListColumn';
import { DataRowLoanProducts } from '@/utils/DataTypes';
import useLoanProducts from '@/hooks/useLoanProducts';
import Button from '@/components/Button';
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
                  <div className="p-4 bg-danger/10 border border-danger text-danger rounded">
                    Error loading loan products: {loanProductsError}
                    <Button variant="secondary" size="sm" className="ml-2"
                      onClick={refresh}>
                      Retry
                    </Button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loanProductsLoading}
                  columns={column(handleRowClick)}
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