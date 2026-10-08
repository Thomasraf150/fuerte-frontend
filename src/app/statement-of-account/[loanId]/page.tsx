'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { SkeletonBlock } from '@/components/LoadingStates';
import Button from '@/components/Button';
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
  const { fetchCustomerLedger, custLedgerData, loading: ledgerLoading, printStateOfAccount, printing } = useSoa();

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
        <div className="min-h-[400px] rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <SkeletonBlock rows={5} label="Loading the statement of account…" />
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
        <div className="rounded-2xl border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-danger mb-4">
              {error || 'Loan not found'}
            </h3>
            <Button variant="primary" onClick={handleBack}>
              Back to Statement of Account
            </Button>
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
          <Button variant="secondary" className="mb-4" onClick={handleBack}>
            <CornerUpLeft size={15} />
            <span>Back</span>
          </Button>

          <LoanDetails
            loanSingleData={loanSingleData}
            onPrint={() => printStateOfAccount(loanId)}
            printing={printing}
          />
          <CustomerLedger custLedgerData={custLedgerData} loading={ledgerLoading} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SoaDetailPage;
