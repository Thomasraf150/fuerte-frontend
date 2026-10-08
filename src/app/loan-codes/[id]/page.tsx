'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { SkeletonBlock } from '@/components/LoadingStates';
import useLoanCodes from '@/hooks/useLoanCodes';
import LoanCodeQueryMutations from '@/graphql/LoanCodeQueryMutations';
import FormAddLoanCode from '../components/FormAddLoanCode';
import { DataRowLoanCodes } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';

const LoanCodeDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const codeId = params.id as string;
  const isNewCode = codeId === 'new';

  const { refresh } = useLoanCodes();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<DataRowLoanCodes | undefined>(undefined);

  // Fetch loan code directly by ID (fixes pagination bug)
  useEffect(() => {
    const fetchLoanCode = async () => {
      if (isNewCode) {
        // Creating new code - no data to load
        setLoading(false);
        setSingleData(undefined);
        return;
      }

      if (!codeId || codeId === 'undefined') {
        setError('Invalid loan code ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await graphqlFetch(
          LoanCodeQueryMutations.GET_LOAN_CODE_BY_ID,
          { id: codeId },
        );

        if (result.errors) {
          setError(result.errors[0]?.message || 'Failed to load loan code');
          return;
        }

        if (result.data?.getLoanCodeById) {
          setSingleData(result.data.getLoanCodeById);
          setError(null);
        } else {
          setError('Loan code not found');
        }
      } catch (err: any) {
        console.error('Error fetching loan code:', err);
        setError(err.message || 'Failed to load loan code');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanCode();
  }, [codeId, isNewCode]);

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
  if (loading) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Loading..." />
        </div>
        <SkeletonBlock rows={4} label="Loading loan code…" />
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
        <Card>
          <CardBody className="text-center">
            <h3 className="text-xl font-semibold text-danger">
              {error}
            </h3>
            <Button variant="primary"
              onClick={handleBack}>
              Back to Loan Codes
            </Button>
          </CardBody>
        </Card>
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
        <Card>
          <CardHeader title={actionLbl} />
          <CardBody>
            <FormAddLoanCode
              setShowForm={handleShowForm}
              fetchLoanCodes={refresh}
              singleUserData={singleData}
              actionLbl={actionLbl}
            />
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default LoanCodeDetailPage;
