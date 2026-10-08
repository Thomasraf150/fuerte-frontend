"use client";

import Button from '@/components/Button';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import CVForm from './CVForm';
import JVForm from './JVForm';
import VoucherFilters from './VoucherFilters';
import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import { Download, GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import gVTblColumn from './GVTblColumn';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

const column = gVTblColumn;

const GeneralVoucherList: React.FC = () => {
  const router = useRouter();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showFormCv, setShowFormCv] = useState<boolean>(false);
  const [showFormJv, setShowFormJv] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<RowAcctgEntry>();
  const {
    dataGV,
    createGV,
    updateGV,
    fetchGV,
    printSummaryTicketDetails,
    printLoading,
    generalVoucherLoading,
    paginationLoading,
    pubSubBrId,
    serverSidePaginationProps,
    generalVoucherError,
    refresh,
    setFilters,
    filters,
    exportCheckVouchersToExcel,
    exportLoading,
  } = useGeneralVoucher();

  const exportDisabled = exportLoading || !filters?.startDate || !filters?.endDate;

  const handleShowFormCv = (lbl: string, showFrm: boolean) => {
    setShowFormCv(showFrm);
    setActionLbl(lbl);
    setSingleData(undefined);
  }
  const handleShowFormJv = (lbl: string, showFrm: boolean) => {
    setShowFormJv(showFrm);
    setActionLbl(lbl);
    setSingleData(undefined);
  }

  useEffect(() => {
  }, [dataGV])

  // Navigate to detail page on row click (URL-based routing)
  const handleWholeRowClick = (row: RowAcctgEntry) => {
    const type = row?.journal_name === 'Check Voucher' ? 'cv' : 'jv';
    router.push(`/accounting/general-voucher/${row.id}?type=${type}`);
  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showFormCv && !showFormJv && (
            <div className={`col-span-2 ${!showFormCv ?'fade-in' : 'fade-out'}`}>
              <VoucherFilters onChange={setFilters} />

              <Card>
                <CardHeader title="General Voucher" />
                <CardBody>
                <Toolbar>
                  <Button variant="primary"
                    type="button"
                    onClick={ () => handleShowFormCv('Create Check Voucher', true) }>
                      <Plus size={14} />
                      <span>New CV</span>
                  </Button>
                  <Button variant="secondary"
                    type="button"
                    onClick={ () => handleShowFormJv('Create Journal Voucher', true) }>
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
                    <div className="p-4 bg-danger/10 border border-danger text-danger rounded">
                      Error loading general vouchers: {generalVoucherError}
                      <Button variant="secondary" className="ml-2"
                        onClick={refresh}>
                        Retry
                      </Button>
                    </div>
                  )}
                  <CustomDatatable
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
          )}
          {showFormCv && (
            <div className={`col-span-2 ${showFormCv ?'fade-in' : 'fade-out'}`}>
              <Card>
                <CVForm
                  setShowForm={setShowFormCv}
                  actionLbl={actionLbl}
                  singleData={singleData}
                  createGV={createGV}
                  updateGV={updateGV}
                  fetchGV={fetchGV}
                  loading={paginationLoading}
                  generalVoucherLoading={generalVoucherLoading}
                  pubSubBrId={pubSubBrId}
                  printSummaryTicketDetails={printSummaryTicketDetails}
                  printLoading={printLoading} />
              </Card>
            </div>
          )}
          {showFormJv && (
            <div className={`col-span-2 ${showFormJv ?'fade-in' : 'fade-out'}`}>
              <Card>
                <JVForm
                  setShowForm={setShowFormJv}
                  actionLbl={actionLbl}
                  singleData={singleData}
                  createGV={createGV}
                  fetchGV={fetchGV}
                  loading={paginationLoading}
                  generalVoucherLoading={generalVoucherLoading}
                  pubSubBrId={pubSubBrId}
                  printSummaryTicketDetails={printSummaryTicketDetails}
                  printLoading={printLoading} />
              </Card>
            </div>
          )}


</div>
      </div>
    </div>
  );
};

export default GeneralVoucherList;
