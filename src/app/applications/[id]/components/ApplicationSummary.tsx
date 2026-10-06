"use client";

import React from 'react';
import { formatMoneyOrBlank } from '@/utils/helper';
import type { LoanApplicationRecord } from '@/utils/DataTypes';

const CARD = 'rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark';

/** One term and its value: a direct child of the <dl>, so a wider one takes `className` rather than a wrapper of its own. */
const Fact: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => (
  <div className={`min-w-0 ${className}`}>
    <dt className="text-xs font-medium text-body dark:text-bodydark">{label}</dt>
    <dd className="mt-1 break-words text-sm text-black dark:text-white">{children}</dd>
  </div>
);

/** A value nobody gave: a dash for the eye, "Not provided" for a screen reader. */
const Blank: React.FC = () => (
  <span className="text-body dark:text-bodydark">
    <span aria-hidden="true">—</span>
    <span className="sr-only">Not provided</span>
  </span>
);

/**
 * The application's basics, read-only: name, mobile, branch, amount and purpose. Shown where the
 * form would be when there is nothing to edit here: under "Borrower created" once the application
 * is a borrower (ConvertedApplication), and under the view-only note for a user who may see the
 * application but not change it (Marketing on another branch's application).
 */
const ApplicationSummary: React.FC<{ record: LoanApplicationRecord }> = ({ record }) => {
  const amount = formatMoneyOrBlank(record.amount_applied);
  return (
    <section aria-label="Application summary" className={CARD}>
      <h3 className="border-b border-stroke px-5 py-3.5 text-sm font-semibold text-black dark:border-strokedark dark:text-white sm:px-7">
        Application summary
      </h3>
      {/* grid-cols-1 is minmax(0, 1fr): a long name or purpose wraps instead of widening the page. */}
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2 sm:px-7">
        <Fact label="Name">
          <span className="uppercase">{record.full_name}</span>
        </Fact>
        <Fact label="Mobile">{record.contact_no || <Blank />}</Fact>
        <Fact label="Branch">{record.branch_sub?.name ?? <Blank />}</Fact>
        <Fact label="Amount">{amount ? `₱${amount}` : <Blank />}</Fact>
        <Fact label="Purpose" className="sm:col-span-2">
          {record.purpose || <Blank />}
        </Fact>
      </dl>
    </section>
  );
};

export default ApplicationSummary;
