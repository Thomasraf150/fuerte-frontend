"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from 'react-toastify';
import { DataColListRow } from '@/utils/DataTypes';
import useCollectionList from '@/hooks/useCollectionList';
import collectionListCol from './CollectionListCol';
import ErrorAlert from '@/components/ErrorAlert';
import CollectionPhoneRow from './CollectionPhoneRow';
import CustomDatatable from '@/components/CustomDatatable';
import { Card, CardBody } from '@/components/Card';

const column = collectionListCol;

const CollectionList: React.FC = () => {
  const router = useRouter();

  const {
    dataColListData,
    collectionListLoading,
    collectionListError,
    serverSidePaginationProps,
    refresh,
  } = useCollectionList();

  // Navigate to detail page on row click (show read-only mode message for posted entries)
  const handleRowClick = (data: DataColListRow) => {
    if (data.journal_ref) {
      toast.info('Viewing posted entry (read-only mode).');
    }
    router.push(`/collection-list/${data.loan_schedule_id}?date=${data.trans_date}&ref=${data.loan_ref}`);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* One card on the page, so no card title: it would only repeat the page title (Decision 3). */}
          <Card className="w-full">
            <CardBody className="overflow-x-auto">
                {collectionListError && (
                  <ErrorAlert
                    title="The collection list didn't load."
                    detail={collectionListError}
                    onRetry={refresh}
                    className="mb-4"
                  />
                )}
                <CustomDatatable
                  loadFailed={Boolean(collectionListError)}
                  apiLoading={collectionListLoading}
                  columns={column()}
                  onRowClicked={handleRowClick}
                  mobileRow={(row) => <CollectionPhoneRow row={row} />}
                  data={dataColListData || []}
                  enableCustomHeader={true}
                  title={''}
                  serverSidePagination={{ ...serverSidePaginationProps, recordType: 'loan', recordTypePlural: 'loans' }}
                />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollectionList;
