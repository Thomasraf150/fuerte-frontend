'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { SkeletonBlock } from '@/components/LoadingStates';
import useLoanProducts from '@/hooks/useLoanProducts';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import FormAddLoanProduct from '../components/FormAddLoanProduct';
import { DataRowLoanProducts } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';

const LoanProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const isNewProduct = productId === 'new';

  const { refresh } = useLoanProducts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<DataRowLoanProducts | undefined>(undefined);

  // Fetch loan product directly by ID (fixes pagination bug)
  useEffect(() => {
    const fetchLoanProduct = async () => {
      if (isNewProduct) {
        // Creating new product - no data to load
        setLoading(false);
        setSingleData(undefined);
        return;
      }

      if (!productId || productId === 'undefined') {
        setError('Invalid loan product ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await graphqlFetch(
          LoanProductsQueryMutations.GET_LOAN_PRODUCT_BY_ID,
          { id: productId },
        );

        if (result.errors) {
          setError(result.errors[0]?.message || 'Failed to load loan product');
          return;
        }

        if (result.data?.getLoanProductById) {
          setSingleData(result.data.getLoanProductById);
          setError(null);
        } else {
          setError('Loan product not found');
        }
      } catch (err: any) {
        console.error('Error fetching loan product:', err);
        setError(err.message || 'Failed to load loan product');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanProduct();
  }, [productId, isNewProduct]);

  // Back button handler - navigates to list
  const handleBack = () => {
    router.push('/loan-products');
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
        <SkeletonBlock rows={4} label="Loading loan product…" />
      </DefaultLayout>
    );
  }

  // Error state (only for edit mode)
  if (error && !isNewProduct) {
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
              Back to Loan Products
            </Button>
          </CardBody>
        </Card>
      </DefaultLayout>
    );
  }

  const pageTitle = isNewProduct
    ? 'Create Loan Product'
    : `Update Loan Product: ${singleData?.description || ''}`;

  const actionLbl = isNewProduct ? 'Create Loan Product' : 'Update Loan Product';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Loan Products', href: '/loan-products' },
            { label: isNewProduct ? 'New' : singleData?.description || 'Edit' }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title={actionLbl} />
          <CardBody>
            <FormAddLoanProduct
              setShowForm={handleShowForm}
              fetchLoanProducts={refresh}
              singleData={singleData}
              actionLbl={actionLbl}
            />
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default LoanProductDetailPage;
