'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useBorrowerDetail from '@/hooks/useBorrowerDetail';
import BorrowerInfo from '../components/BorrowerInfo';
import { BorrowerRowInfo } from '@/utils/DataTypes';

const BorrowerDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const borrowerId = params.id as string;

  const {
    dataChief,
    dataArea,
    dataSubArea,
    dataBorrCompany,
    onSubmitBorrower,
    borrowerLoading,
    fetchDataChief,
    fetchDataArea,
    fetchDataSubArea,
    fetchDataBorrCompany,
    fetchSingleBorrower,
  } = useBorrowerDetail();

  const [singleData, setSingleData] = useState<BorrowerRowInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reference data on mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchDataChief(100, 1),
          fetchDataArea(100, 1),
          fetchDataBorrCompany(100, 1),
        ]);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching reference data:', err);
        setError('Failed to load reference data');
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, []);

  // Back button handler
  const handleBack = () => {
    router.push('/borrowers');
  };

  const handleShowForm = (show: boolean) => {
    if (!show) {
      handleBack();
    }
  };

  // Fetch borrower data when ID changes
  useEffect(() => {
    const fetchBorrowerData = async () => {
      if (borrowerId === 'new') {
        // Create mode - no singleData needed
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const borrower = await fetchSingleBorrower(Number(borrowerId));
        setSingleData(borrower);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching borrower:', err);
        setError(err.message || 'Failed to load borrower details');
        setLoading(false);
      }
    };

    fetchBorrowerData();
  }, [borrowerId]);

  const borrowerName = singleData
    ? `${singleData.lastname || ''}, ${singleData.firstname || ''}`.trim()
    : 'New Borrower';
  const borrowerTitle = borrowerId === 'new' ? 'New Borrower' : `Borrower: ${borrowerName}`;

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
  if (error) {
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
              Back to Borrowers List
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Main content
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={borrowerTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Borrowers', href: '/borrowers' },
            { label: borrowerTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <BorrowerInfo
          setShowForm={handleShowForm}
          singleData={singleData}
          setSingleData={setSingleData}
          dataChief={dataChief}
          dataArea={dataArea}
          dataSubArea={dataSubArea}
          dataBorrCompany={dataBorrCompany}
          onSubmitBorrower={async (data) => {
            const result = await onSubmitBorrower(data, () => {
              // Refresh callback - navigate back to list
              router.push('/borrowers');
            });
            return result;
          }}
          borrowerLoading={borrowerLoading}
          fetchDataBorrower={async () => {}} // Not needed on detail page
          fetchDataChief={fetchDataChief}
          fetchDataArea={fetchDataArea}
          fetchDataSubArea={fetchDataSubArea}
          fetchDataBorrCompany={fetchDataBorrCompany}
        />
      </div>
    </DefaultLayout>
  );
};

export default BorrowerDetailPage;
