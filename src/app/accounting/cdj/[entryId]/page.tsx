'use client';

import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import { Card } from '@/components/Card';
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { SkeletonBlock } from '@/components/LoadingStates';
import GeneralJournalQueryMutations from '@/graphql/GeneralJournalQueryMutations';
import useCoa from '@/hooks/useCoa';
import CdjForm from '../components/CdjForm';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const CdjDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const entryId = params.entryId as string;
  const journalDate = searchParams.get('date') || '';

  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<RowAcctgEntry | undefined>(undefined);
  useDocumentTitle(singleData?.journal_ref, singleData?.journal_name); // tab: "{journal ref} · {journal name} · Fuerte Lending"

  // Fetch CDJ entry directly by ID (fixes pagination bug)
  useEffect(() => {
    const fetchCdjEntry = async () => {
      if (!entryId || entryId === 'undefined') {
        setError('Invalid CDJ entry ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch CDJ entry by ID and COA data in parallel
        const [result] = await Promise.all([
          graphqlFetch(
            GeneralJournalQueryMutations.GET_JOURNAL_ENTRY_BY_ID,
            { id: entryId },
          ),
          fetchCoaDataTable()
        ]);

        if (result.errors) {
          setError(result.errors[0]?.message || 'Failed to load CDJ entry');
          return;
        }

        if (result.data?.getJournalEntryById) {
          setSingleData(result.data.getJournalEntryById);
          setError(null);
        } else {
          setError('CDJ entry not found');
        }
      } catch (err: any) {
        console.error('Error fetching CDJ entry:', err);
        setError(err.message || 'Failed to load CDJ entry');
      } finally {
        setLoading(false);
      }
    };

    fetchCdjEntry();
  }, [entryId]);

  // Back button handler
  const handleBack = () => {
    router.push('/accounting/cdj');
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
        <Card className="p-6">
          <SkeletonBlock rows={5} label="Loading the entry…" />
        </Card>
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
        <Card className="p-10">
          <div className="space-y-4 text-left">
            <ErrorAlert
              title={error ? "This disbursement entry didn't load." : "This disbursement entry couldn't be found."}
              detail={error ?? 'CDJ entry not found'}
            />
            <Button variant="primary"
              onClick={handleBack}>
              Back to Cash Disbursements Journal
            </Button>
          </div>
        </Card>
      </DefaultLayout>
    );
  }

  const pageTitle = singleData.journal_ref
    ? `Reference #: ${singleData.journal_ref}`
    : 'CDJ Entry';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Cash Disbursements Journal', href: '/accounting/cdj' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CdjForm
            setShowForm={handleShowForm}
            actionLbl="Reference #:"
            singleData={singleData}
            loading={false}
            coaDataAccount={coaDataAccount || []}
            fetchCoaDataTable={fetchCoaDataTable}
          />
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default CdjDetailPage;
