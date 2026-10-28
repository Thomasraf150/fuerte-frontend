"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { Card } from '@/components/Card';
import { SkeletonBlock } from '@/components/LoadingStates';
import useAdjustingEntries from '@/hooks/useAdjustingEntries';
import GeneralJournalQueryMutations from '@/graphql/GeneralJournalQueryMutations';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RowAcctgEntry } from '@/utils/DataTypes';
import AEForm from './AEForm';

const LIST_PATH = '/accounting/adjusting-entries';

/**
 * An adjusting entry on its own URL: `/new` to create one, `/<entry id>` to view a saved one.
 * The entry is read by the URL's id (getJournalEntryById, branch-scoped like the list), never
 * from the list row, so Back, refresh and a pasted link all land on the same entry.
 */
const AEFormPage: React.FC<{ entryId?: string }> = ({ entryId }) => {
  const router = useRouter();
  const isView = entryId !== undefined;
  const { createAe, fetchAe, adjustingEntriesLoading, refresh } = useAdjustingEntries();
  const [entry, setEntry] = useState<RowAcctgEntry>();
  const [loading, setLoading] = useState<boolean>(isView);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(entry?.journal_ref, 'Adjusting Entries');

  useEffect(() => {
    if (!isView) return;
    if (!/^\d+$/.test(entryId)) {
      setError('That adjusting entry does not exist.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const result = await graphqlFetch(GeneralJournalQueryMutations.GET_JOURNAL_ENTRY_BY_ID, { id: entryId });
        if (result.errors) throw new Error(result.errors[0]?.message || 'Failed to load the entry');
        if (!result.data?.getJournalEntryById) throw new Error('That adjusting entry does not exist.');
        setEntry(result.data.getJournalEntryById);
      } catch (err: any) {
        console.warn('Adjusting entry failed to load', { entry_id: entryId, error: err });
        setError(err?.message || 'Failed to load the entry');
      } finally {
        setLoading(false);
      }
    })();
  }, [entryId]);

  const backToList = (show: boolean) => {
    if (!show) router.push(LIST_PATH);
  };

  const label = isView ? (entry?.journal_ref ? `Reference #: ${entry.journal_ref}` : '') : 'New Adjusting Entry';

  return (
    <>
      <div className="mx-auto">
        <Breadcrumb
          pageName="Adjusting Entries"
          loading={loading}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Adjusting Entries', href: LIST_PATH },
            { label: error ? 'Error' : label },
          ]}
        />
      </div>
      <div className="max-w-12xl">
        <div className="fade-in">
          {loading ? (
            <Card className="p-6">
              <SkeletonBlock rows={5} label="Loading the entry…" />
            </Card>
          ) : error ? (
            <Card className="p-10">
              <div className="space-y-4 text-left">
                <ErrorAlert title="This adjusting entry didn't load." detail={error} />
                <Button variant="primary" onClick={() => backToList(false)}>
                  Back to Adjusting Entries
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <AEForm
                setShowForm={backToList}
                actionLbl={isView ? 'View Adjusting Entries' : 'Create Adjusting Entries'}
                singleData={entry}
                createAe={createAe}
                fetchAe={fetchAe}
                refresh={refresh}
                loading={adjustingEntriesLoading}
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AEFormPage;
