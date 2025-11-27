'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useLoanProducts from '@/hooks/useLoanProducts';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import FormAddLoanProduct from '../components/FormAddLoanProduct';
import { DataRowLoanProducts } from '@/utils/DataTypes';

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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: LoanProductsQueryMutations.GET_LOAN_PRODUCT_BY_ID,
            variables: { id: productId },
          }),
        });

        const result = await response.json();

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
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
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
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Loan Products
            </button>
          </div>
        </div>
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
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {actionLbl}
            </h3>
          </div>
          <div className="p-7">
            <FormAddLoanProduct
              setShowForm={handleShowForm}
              fetchLoanProducts={refresh}
              singleData={singleData}
              actionLbl={actionLbl}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default LoanProductDetailPage;
