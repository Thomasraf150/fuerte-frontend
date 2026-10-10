'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { SkeletonBlock } from '@/components/LoadingStates';
import Button from '@/components/Button';
import { Card, CardBody } from '@/components/Card';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import PaymentScheduleForm from '../components/PaymentScheduleForm';
import { toast } from 'react-toastify';
import { useDocumentTitle, loanTitle } from '@/hooks/useDocumentTitle';

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
  useDocumentTitle(...loanTitle('Post payment', loanScheduleList)); // "Post payment · {borrower} · {ref}"

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
        <Card className="min-h-[400px]">
          <CardBody>
            <SkeletonBlock rows={5} label="Loading the payment schedule…" />
          </CardBody>
        </Card>
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
        <Card>
          <CardBody className="text-center sm:p-10">
          <div>
            <h3 className="text-xl font-semibold text-danger mb-4">
              {error || 'Loan schedule not found'}
            </h3>
            <Button variant="primary" onClick={handleBack}>
              Back to Payment Posting
            </Button>
          </div>
          </CardBody>
        </Card>
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
        <Card>
          <CardBody className="text-center sm:p-10">
          <div>
            <h3 className="text-xl font-semibold text-amber-500 mb-4">
              This loan has already been closed
            </h3>
            <p className="text-body dark:text-bodydark mb-4">
              Payment posting is not available for closed loans.
            </p>
            <Button variant="primary" onClick={handleBack}>
              Back to Payment Posting
            </Button>
          </div>
          </CardBody>
        </Card>
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
        <PaymentScheduleForm
          singleData={loanScheduleList}
          handleShowForm={handleShowForm}
          onSubmitCollectionPayment={onSubmitCollectionPayment}
          onSubmitOthCollectionPayment={onSubmitOthCollectionPayment}
          fnReversePayment={fnReversePayment}
          paymentLoading={paymentLoading}
        />
      </div>
    </DefaultLayout>
  );
};

export default PaymentPostingDetailPage;
