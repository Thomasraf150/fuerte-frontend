'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import PaymentScheduleForm from '../components/PaymentScheduleForm';
import { toast } from 'react-toastify';

const PaymentPostingDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const loanId = params.loanId as string;

  const {
    fetchLoanSchedule,
    loanScheduleList,
    onSubmitCollectionPayment,
    onSubmitOthCollectionPayment,
    fnReversePayment,
    paymentLoading
  } = usePaymentPosting();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch loan schedule data on mount
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
        await fetchLoanSchedule(loanId);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching loan schedule:', err);
        setError(err.message || 'Failed to load payment schedule');
        setLoading(false);
      }
    };

    fetchData();
  }, [loanId]);

  // Back button handler
  const handleBack = () => {
    router.push('/payment-posting');
  };

  const handleShowForm = (show: boolean) => {
    if (!show) {
      handleBack();
    }
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
  if (error || !loanScheduleList) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error || 'Loan schedule not found'}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Payment Posting
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Check if loan is closed
  if (loanScheduleList?.is_closed === '1') {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Loan Closed" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-amber-500 mb-4">
              This loan has already been closed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Payment posting is not available for closed loans.
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Payment Posting
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Build dynamic title
  const borrowerName = loanScheduleList?.borrower
    ? `${loanScheduleList.borrower.lastname || ''}, ${loanScheduleList.borrower.firstname || ''}`.trim()
    : '';
  const loanRef = loanScheduleList?.loan_ref || '';
  const productName = loanScheduleList?.loan_product?.description || 'Payment Schedule';
  const pageTitle = borrowerName ? `${productName}: ${borrowerName}` : productName;

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Payment Posting', href: '/payment-posting' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <PaymentScheduleForm
            singleData={loanScheduleList}
            handleShowForm={handleShowForm}
            onSubmitCollectionPayment={onSubmitCollectionPayment}
            onSubmitOthCollectionPayment={onSubmitOthCollectionPayment}
            fnReversePayment={fnReversePayment}
            paymentLoading={paymentLoading}
          />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default PaymentPostingDetailPage;
