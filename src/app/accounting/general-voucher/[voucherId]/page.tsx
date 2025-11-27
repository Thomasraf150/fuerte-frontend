'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import GeneralVoucherQueryMutations from '@/graphql/GeneralVoucherQueryMutations';
import CVForm from '../components/CVForm';
import JVForm from '../components/JVForm';
import { RowAcctgEntry } from '@/utils/DataTypes';

const GeneralVoucherDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const voucherId = params.voucherId as string;
  const voucherType = searchParams.get('type') || ''; // 'cv' or 'jv'

  const {
    createGV,
    updateGV,
    fetchGV,
    printSummaryTicketDetails,
    generalVoucherLoading,
    pubSubBrId,
  } = useGeneralVoucher();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<RowAcctgEntry | undefined>(undefined);

  // Fetch voucher directly by ID (fixes pagination bug where voucher was on page 53 but only page 1 was fetched)
  useEffect(() => {
    const fetchVoucher = async () => {
      if (!voucherId || voucherId === 'undefined') {
        setError('Invalid voucher ID');
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
            query: GeneralVoucherQueryMutations.GET_VOUCHER_BY_ID,
            variables: { id: voucherId },
          }),
        });

        const result = await response.json();

        if (result.errors) {
          setError(result.errors[0]?.message || 'Failed to load voucher');
          return;
        }

        if (result.data?.getVoucherById) {
          setSingleData(result.data.getVoucherById);
          setError(null);
        } else {
          setError('Voucher not found');
        }
      } catch (err: any) {
        console.error('Error fetching voucher:', err);
        setError(err.message || 'Failed to load voucher');
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [voucherId]);

  // Back button handler
  const handleBack = () => {
    router.push('/accounting/general-voucher');
  };

  const handleShowFormCv = (show: boolean) => {
    if (!show) {
      handleBack();
    }
  };

  const handleShowFormJv = (show: boolean) => {
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
  if (error || !singleData) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error || 'Voucher not found'}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to General Voucher
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Determine voucher type from data
  const isCheckVoucher = singleData.journal_name === 'Check Voucher';
  const pageTitle = singleData.journal_ref
    ? `Reference #: ${singleData.journal_ref}`
    : isCheckVoucher ? 'Check Voucher' : 'Journal Voucher';
  const actionLbl = isCheckVoucher ? 'Update Check Voucher' : 'Update Journal Voucher';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'General Voucher', href: '/accounting/general-voucher' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="p-4 lg:p-7">
            {isCheckVoucher ? (
              <CVForm
                setShowForm={handleShowFormCv}
                actionLbl={actionLbl}
                singleData={singleData}
                createGV={createGV}
                updateGV={updateGV}
                fetchGV={fetchGV}
                loading={loading}
                generalVoucherLoading={generalVoucherLoading}
                pubSubBrId={pubSubBrId}
                printSummaryTicketDetails={printSummaryTicketDetails}
              />
            ) : (
              <JVForm
                setShowForm={handleShowFormJv}
                actionLbl={actionLbl}
                singleData={singleData}
                createGV={createGV}
                fetchGV={fetchGV}
                loading={loading}
                generalVoucherLoading={generalVoucherLoading}
                pubSubBrId={pubSubBrId}
                printSummaryTicketDetails={printSummaryTicketDetails}
              />
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default GeneralVoucherDetailPage;
