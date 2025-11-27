'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useLoans from '@/hooks/useLoans';
import useSoa from '@/hooks/useSoa';
import LoanDetails from '../components/LoanDetails';
import CustomerLedger from '../components/CustomerLedger';
import { CornerUpLeft } from 'react-feather';

const SoaDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const loanId = params.loanId as string;

  const { fetchSingLoans, loanSingleData, loading: loanLoading } = useLoans();
  const { fetchCustomerLedger, custLedgerData, loading: ledgerLoading } = useSoa();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch loan data and customer ledger on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!loanId || loanId === 'undefined') {
        setError('Invalid loan ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch loan details
        await fetchSingLoans(Number(loanId));

        // Fetch customer ledger
        await fetchCustomerLedger(loanId);

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching SOA data:', err);
        setError(err.message || 'Failed to load statement of account');
        setLoading(false);
      }
    };

    fetchData();
  }, [loanId]);

  // Back button handler - navigates to list
  const handleBack = () => {
    router.push('/statement-of-account');
  };

  // Loading state
  if (loading || loanLoading) {
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
              Back to Statement of Account
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Build page title from loan data
  const borrowerName = loanSingleData.borrower
    ? `${loanSingleData.borrower.lastname}, ${loanSingleData.borrower.firstname}`
    : 'Unknown Borrower';
  const loanRef = loanSingleData.loan_ref || `Loan #${loanId}`;
  const pageTitle = `SOA: ${borrowerName} - ${loanRef}`;

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Statement of Account', href: '/statement-of-account' },
            { label: loanRef }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="relative overflow-x-auto bg-white shadow-default dark:bg-boxdark p-4">
          <button
            className="flex justify-center rounded border bg-white border-stroke px-6 py-4 mb-4 space-x-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:bg-boxdark dark:text-white"
            type="button"
            onClick={handleBack}
          >
            <CornerUpLeft size={15} />
            <span>Back</span>
          </button>

          <LoanDetails loanSingleData={loanSingleData} />
          <CustomerLedger custLedgerData={custLedgerData} loading={ledgerLoading} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SoaDetailPage;
