"use client";

import React from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { Card } from '@/components/Card';
import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import CVForm from './CVForm';
import JVForm from './JVForm';

const LIST_PATH = '/accounting/general-voucher';

/**
 * New CV / New JV on their own URL (/accounting/general-voucher/new?type=cv|jv), so Back
 * returns to the list and a refresh keeps the form. Saved vouchers open at /[voucherId].
 */
const NewVoucher: React.FC<{ type: 'cv' | 'jv' }> = ({ type }) => {
  const router = useRouter();
  const {
    createGV,
    updateGV,
    fetchGV,
    printSummaryTicketDetails,
    printLoading,
    generalVoucherLoading,
    paginationLoading,
    pubSubBrId,
  } = useGeneralVoucher();

  const isCv = type === 'cv';
  const backToList = (show: boolean) => {
    if (!show) router.push(LIST_PATH);
  };

  return (
    <>
      <div className="mx-auto">
        <Breadcrumb
          pageName="General Voucher"
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'General Voucher', href: LIST_PATH },
            { label: isCv ? 'New Check Voucher' : 'New Journal Voucher' },
          ]}
        />
      </div>
      <div className="max-w-12xl">
        <div className="fade-in">
          <Card>
            {isCv ? (
              <CVForm
                setShowForm={backToList}
                actionLbl="Create Check Voucher"
                singleData={undefined}
                createGV={createGV}
                updateGV={updateGV}
                fetchGV={fetchGV}
                loading={paginationLoading}
                generalVoucherLoading={generalVoucherLoading}
                pubSubBrId={pubSubBrId}
                printSummaryTicketDetails={printSummaryTicketDetails}
                printLoading={printLoading} />
            ) : (
              <JVForm
                setShowForm={backToList}
                actionLbl="Create Journal Voucher"
                singleData={undefined}
                createGV={createGV}
                fetchGV={fetchGV}
                loading={paginationLoading}
                generalVoucherLoading={generalVoucherLoading}
                pubSubBrId={pubSubBrId}
                printSummaryTicketDetails={printSummaryTicketDetails}
                printLoading={printLoading} />
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default NewVoucher;
