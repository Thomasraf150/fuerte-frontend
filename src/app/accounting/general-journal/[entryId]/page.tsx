'use client';

import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import { Card, CardHeader } from '@/components/Card';
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { SkeletonBlock } from '@/components/LoadingStates';
import GeneralJournalQueryMutations from '@/graphql/GeneralJournalQueryMutations';
import useCoa from '@/hooks/useCoa';
import GJForm from '../components/GJForm';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';

const GeneralJournalDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const entryId = params.entryId as string;
  const journalDate = searchParams.get('date') || '';
  const journalType = searchParams.get('type') || 'JV';

  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<RowAcctgEntry | undefined>(undefined);

  // Fetch journal entry directly by ID (fixes pagination bug)
  useEffect(() => {
    const fetchJournalEntry = async () => {
      if (!entryId || entryId === 'undefined') {
        setError('Invalid journal entry ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch journal entry by ID and COA data in parallel
        const [result] = await Promise.all([
          graphqlFetch(
            GeneralJournalQueryMutations.GET_JOURNAL_ENTRY_BY_ID,
            { id: entryId },
          ),
          fetchCoaDataTable()
        ]);

        if (result.errors) {
          setError(result.errors[0]?.message || 'Failed to load journal entry');
          return;
        }

        if (result.data?.getJournalEntryById) {
          setSingleData(result.data.getJournalEntryById);
          setError(null);
        } else {
          setError('Journal entry not found');
        }
      } catch (err: any) {
        console.error('Error fetching journal entry:', err);
        setError(err.message || 'Failed to load journal entry');
      } finally {
        setLoading(false);
      }
    };

    fetchJournalEntry();
  }, [entryId]);

  // Back button handler
  const handleBack = () => {
    router.push('/accounting/general-journal');
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
              title={error ? "This journal entry didn't load." : "This journal entry couldn't be found."}
              detail={error ?? 'Journal entry not found'}
            />
            <Button variant="primary"
              onClick={handleBack}>
              Back to General Journal
            </Button>
          </div>
        </Card>
      </DefaultLayout>
    );
  }

  const pageTitle = singleData.journal_ref
    ? `Reference #: ${singleData.journal_ref}`
    : 'Journal Entry';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'General Journal', href: '/accounting/general-journal' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader
            title={
              <>
                Journal Entry Details
                {singleData.journal_date && (
                  <span className="block text-sm font-normal text-body dark:text-bodydark">
                    Date: {singleData.journal_date}
                  </span>
                )}
              </>
            }
          />
          <GJForm
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

export default GeneralJournalDetailPage;
