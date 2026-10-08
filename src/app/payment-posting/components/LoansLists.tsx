"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import ErrorAlert from '@/components/ErrorAlert';
import LoanPhoneRow from '@/components/LoanPhoneRow';
import CustomDatatable from '@/components/CustomDatatable';
import { Card, CardHeader, CardBody } from '@/components/Card';
import loansListColumn from './LoansListColumn';
import { BorrLoanRowData } from '@/utils/DataTypes';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import { toast } from "react-toastify";

const column = loansListColumn;

const LoansLists: React.FC = () => {
  const router = useRouter();
  const {
    dataLoans,
    loansLoading,
    loansError,
    serverSidePaginationProps,
    refresh
  } = usePaymentPosting();

  // Navigate to detail page via URL
  const handleRowClick = (data: BorrLoanRowData) => {
    // Block if status indicates closed (includes "Closed" and "Posted (Closed)")
    if (data?.custom_status?.includes('Closed')) {
      toast.error('This loan has already been closed!');
      return;
    }
    router.push(`/payment-posting/${data.id}`);
  };

  // Note: usePagination handles initial data loading automatically

  return (
    <div className="payment-posting-list">
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <Card>
              <CardHeader title="Loans List" />
              <CardBody>
                {loansError && (
                  <ErrorAlert
                    title="The loans didn't load."
                    detail={loansError}
                    onRetry={refresh}
                    className="mb-4"
                  />
                )}
                <CustomDatatable
                  loadFailed={Boolean(loansError)}
                  apiLoading={loansLoading}
                  columns={column(handleRowClick)}
                  onRowClicked={handleRowClick}
                  mobileRow={(row) => <LoanPhoneRow row={row} />}
                  data={dataLoans}
                  enableCustomHeader={true}
                  title={''}
                  serverSidePagination={{ ...serverSidePaginationProps, recordType: 'loan', recordTypePlural: 'loans' }}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansLists;