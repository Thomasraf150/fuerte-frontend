'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useLoanDetail from '@/hooks/useLoanDetail';
import LoanPnSigningForm from '@/app/loans-list/components/LoanPnSigningForm';

const LoanDetailPage: React.FC = () => {
  // Extract loan ID from URL
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;

  console.log('[LoanDetail] Component initialized with params:', { params, loanId });

  // State management
  const { loanSingleData, fetchSingLoans } = useLoanDetail();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch loan data on mount
  useEffect(() => {
    console.log('[LoanDetail] useEffect triggered for loanId:', loanId);

    const fetchData = async () => {
      try {
        console.log('[LoanDetail] Starting fetch for loan ID:', loanId);
        setLoading(true);
        setError(null);

        await fetchSingLoans(Number(loanId));

        console.log('[LoanDetail] Fetch completed successfully');
        console.log('[LoanDetail] loanSingleData:', loanSingleData);
        setLoading(false);
      } catch (err: any) {
        console.error('[LoanDetail] Fetch error:', {
          message: err.message,
          error: err,
          loanId
        });
        setError(err.message || 'Failed to load loan details');
        setLoading(false);
      }
    };

    if (loanId) {
      console.log('[LoanDetail] Loan ID is valid, proceeding with fetch');
      fetchData();
    } else {
      console.warn('[LoanDetail] No loan ID provided!');
    }
  }, [loanId]);

  // Back button handler
  const handleBack = () => {
    router.push('/loans-list');
  };

  // Loading state
  if (loading) {
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

  // Error state
  if (error || !loanSingleData) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error || 'Loan not found'}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Loans List
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Main content
  const borrowerName = `${loanSingleData?.borrower?.lastname || ''}, ${loanSingleData?.borrower?.firstname || ''}`.trim();
  const loanRef = loanSingleData?.loan_ref || '';
  const loanTitle = `Loan: ${borrowerName} - ${loanRef}`;

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={loanTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Loan Lists', href: '/loans-list' },
            { label: loanTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <LoanPnSigningForm
          singleData={loanSingleData}
          handleShowForm={handleBack}
        />
      </div>
    </DefaultLayout>
  );
};

export default LoanDetailPage;
