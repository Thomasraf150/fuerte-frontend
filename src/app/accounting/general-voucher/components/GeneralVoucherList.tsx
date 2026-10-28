"use client";

import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import VoucherFilters from './VoucherFilters';
import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import { Download, Plus } from 'react-feather';
import gVTblColumn from './GVTblColumn';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = gVTblColumn;

const GeneralVoucherList: React.FC = () => {
  const router = useRouter();
  const {
    dataGV,
    paginationLoading,
    serverSidePaginationProps,
    generalVoucherError,
    refresh,
    setFilters,
    filters,
    exportCheckVouchersToExcel,
    exportLoading,
  } = useGeneralVoucher();

  const exportDisabled = exportLoading || !filters?.startDate || !filters?.endDate;

  // New CV / New JV open at /new?type=cv|jv, saved vouchers at /[voucherId]: Back and refresh keep the place.
  // Navigate to detail page on row click (URL-based routing)
  const handleWholeRowClick = (row: RowAcctgEntry) => {
    const type = row?.journal_name === 'Check Voucher' ? 'cv' : 'jv';
    router.push(`/accounting/general-voucher/${row.id}?type=${type}`);
  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 fade-in">
              <VoucherFilters onChange={setFilters} />

              <Card>
                <CardHeader title="General Voucher" />
                <CardBody>
                <Toolbar>
                  <Button variant="primary"
                    type="button"
                    onClick={ () => router.push('/accounting/general-voucher/new?type=cv') }>
                      <Plus size={14} />
                      <span>New CV</span>
                  </Button>
                  <Button variant="secondary"
                    type="button"
                    onClick={ () => router.push('/accounting/general-voucher/new?type=jv') }>
                      <Plus size={14} />
                      <span>New JV</span>
                  </Button>
                  <Button variant="secondary" className="ml-auto"
                    type="button"
                    disabled={exportDisabled}
                    title={!filters?.startDate || !filters?.endDate
                      ? 'Select a date range first'
                      : 'Export check vouchers (in the selected date range and branch) to an Excel file'}
                    onClick={exportCheckVouchersToExcel}>
                      <Download size={14} />
                      <span>{exportLoading ? 'Exporting…' : 'Export to Excel'}</span>
                  </Button>
                </Toolbar>
                  {generalVoucherError && (
                    <ErrorAlert
                      title="The vouchers didn't load."
                      detail={`Error loading general vouchers: ${generalVoucherError}`}
                      onRetry={refresh}
                      className="mb-4"
                    />
                  )}
                  <CustomDatatable
                    loadFailed={Boolean(generalVoucherError)}
                    apiLoading={paginationLoading}
                    title=""
                    onRowClicked={handleWholeRowClick}
                    enableCustomHeader={true}
                    columns={column()}
                    data={dataGV || []}
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

export default GeneralVoucherList;
