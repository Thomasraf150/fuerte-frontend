"use client";

import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import useAdjustingEntries from '@/hooks/useAdjustingEntries';
import { Plus } from 'react-feather';
import { RowAcctgEntry } from '@/utils/DataTypes';
import aETblColumn from './AETblColumn';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = aETblColumn;

// New entries open at /new, saved ones at /<entry id>: Back and refresh keep the place.
const AdjustingEntriesList: React.FC = () => {
  const router = useRouter();
  const {
    dataAe,
    paginationLoading,
    serverSidePaginationProps,
    adjustingEntriesError,
    refresh
  } = useAdjustingEntries();

  const handleWholeRowClick = (row: RowAcctgEntry) => {
    router.push(`/accounting/adjusting-entries/${row.id}`);
  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 fade-in">
              <Card>
                <CardHeader title="Adjusting Entries" />
                <CardBody>
                <Toolbar>
                  <Button variant="primary"
                    type="button"
                    onClick={ () => router.push('/accounting/adjusting-entries/new') }>
                      <Plus size={14} />
                      <span>New Adjusting Entry</span>
                  </Button>
                </Toolbar>
                  {adjustingEntriesError && (
                    <ErrorAlert
                      title="The adjusting entries didn't load."
                      detail={`Error loading adjusting entries: ${adjustingEntriesError}`}
                      onRetry={refresh}
                      className="mb-4"
                    />
                  )}
                  <CustomDatatable
                    loadFailed={Boolean(adjustingEntriesError)}
                    apiLoading={paginationLoading}
                    title="AE List"
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    data={dataAe || []}
                    enableCustomHeader={true}
                    serverSidePagination={serverSidePaginationProps}
                  />
                </CardBody>
              </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustingEntriesList;
