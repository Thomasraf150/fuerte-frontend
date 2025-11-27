'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useLoanCodes from '@/hooks/useLoanCodes';
import FormAddLoanCode from '../components/FormAddLoanCode';
import { DataRowLoanCodes } from '@/utils/DataTypes';

const LoanCodeDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const codeId = params.id as string;
  const isNewCode = codeId === 'new';

  const {
    dataLoanCodes,
    loanCodesLoading,
    loanCodesError,
    refresh
  } = useLoanCodes();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<DataRowLoanCodes | undefined>(undefined);

  // Find the specific code when data is loaded
  useEffect(() => {
    if (isNewCode) {
      // Creating new code - no data to load
      setLoading(false);
      setSingleData(undefined);
      return;
    }

    if (!loanCodesLoading && dataLoanCodes) {
      const code = dataLoanCodes.find(item => String(item.id) === codeId);
      if (code) {
        setSingleData(code);
        setError(null);
      } else {
        setError('Loan code not found');
      }
      setLoading(false);
    }
  }, [dataLoanCodes, loanCodesLoading, codeId, isNewCode]);

  // Handle error from hook
  useEffect(() => {
    if (loanCodesError && !isNewCode) {
      setError(loanCodesError);
      setLoading(false);
    }
  }, [loanCodesError, isNewCode]);

  // Back button handler - navigates to list
  const handleBack = () => {
    router.push('/loan-codes');
  };

  const handleShowForm = (show: boolean) => {
    if (!show) {
      handleBack();
    }
  };

  // Loading state
  if (loading || (loanCodesLoading && !isNewCode)) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Loading..." />
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DefaultLayout>
    );
  }

  // Error state (only for edit mode)
  if (error && !isNewCode) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Loan Codes
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const pageTitle = isNewCode
    ? 'Create Loan Code'
    : `Update Loan Code: ${singleData?.code || ''}`;

  const actionLbl = isNewCode ? 'Create Loan Code' : 'Update Loan Code';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Loan Codes', href: '/loan-codes' },
            { label: isNewCode ? 'New' : singleData?.code || 'Edit' }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {actionLbl}
            </h3>
          </div>
          <div className="p-7">
            <FormAddLoanCode
              setShowForm={handleShowForm}
              fetchLoanCodes={refresh}
              singleUserData={singleData}
              actionLbl={actionLbl}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default LoanCodeDetailPage;
