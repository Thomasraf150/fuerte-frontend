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
import CrjForm from '../components/CrjForm';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const CrjDetailPage: React.FC = () => {
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

  // Fetch CRJ entry directly by ID (fixes pagination bug)
  useEffect(() => {
    const fetchCrjEntry = async () => {
      if (!entryId || entryId === 'undefined') {
        setError('Invalid CRJ entry ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch CRJ entry by ID and COA data in parallel
        const [result] = await Promise.all([
          graphqlFetch(
            GeneralJournalQueryMutations.GET_JOURNAL_ENTRY_BY_ID,
            { id: entryId },
          ),
          fetchCoaDataTable()
        ]);

        if (result.errors) {
          setError(result.errors[0]?.message || 'Failed to load CRJ entry');
          return;
        }

        if (result.data?.getJournalEntryById) {
          setSingleData(result.data.getJournalEntryById);
          setError(null);
        } else {
          setError('CRJ entry not found');
        }
      } catch (err: any) {
        console.error('Error fetching CRJ entry:', err);
        setError(err.message || 'Failed to load CRJ entry');
      } finally {
        setLoading(false);
      }
    };

    fetchCrjEntry();
  }, [entryId]);

  // Back button handler
  const handleBack = () => {
    router.push('/accounting/crj');
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
              title={error ? "This receipt entry didn't load." : "This receipt entry couldn't be found."}
              detail={error ?? 'CRJ entry not found'}
            />
            <Button variant="primary"
              onClick={handleBack}>
              Back to Cash Receipts Journal
            </Button>
          </div>
        </Card>
      </DefaultLayout>
    );
  }

  const pageTitle = singleData.journal_ref
    ? `Reference #: ${singleData.journal_ref}`
    : 'CRJ Entry';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Cash Receipts Journal', href: '/accounting/crj' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CrjForm
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

export default CrjDetailPage;
