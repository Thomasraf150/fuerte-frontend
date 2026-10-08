"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import { Card, CardBody, CardHeader } from '@/components/Card';
import VoucherFilters from '@/app/accounting/general-voucher/components/VoucherFilters';
import useGeneralJournal from '@/hooks/useGeneralJournal';
import gJTblColumn from './GJTblColumn';
import { RowAcctgEntry } from '@/utils/DataTypes';

const column = gJTblColumn;

const GeneralJournalList: React.FC = () => {
  const router = useRouter();
  const { dataGj, loading, serverSidePaginationProps, setFilters } = useGeneralJournal('GJ');

  // Navigate to detail page on row click
  const handleRowClick = (row: RowAcctgEntry) => {
    const date = row.journal_date || '';
    router.push(`/accounting/general-journal/${row.id}?date=${date}&type=GJ`);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 fade-in">
            <VoucherFilters onChange={setFilters} />
            <Card>
              <CardHeader title="General Journal" />
              <CardBody>
                <CustomDatatable
                  apiLoading={loading}
                  title=""
                  onRowClicked={handleRowClick}
                  columns={column()}
                  enableCustomHeader={true}
                  data={dataGj || []}
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

export default GeneralJournalList;
