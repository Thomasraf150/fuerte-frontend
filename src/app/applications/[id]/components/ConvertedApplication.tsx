"use client";

import React, { useId } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'react-feather';
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
 * An application that has become a borrower is a record, not a form: there is nothing left
 * to edit (the server refuses it). The page says so, points at the borrower, and keeps
 * the application's basics in view for Print and for reference. Call Center gets no pointer
 * (`canOpenBorrower` false): the borrower's page is not its to open, and the server refuses it.
 */
const ConvertedApplication: React.FC<{ record: LoanApplicationRecord; canOpenBorrower: boolean }> = ({ record, canOpenBorrower }) => {
  const titleId = useId();
  const amount = formatMoneyOrBlank(record.amount_applied);
  return (
    <div className="space-y-4">
      <section aria-labelledby={titleId} className="rounded-sm border border-success/40 bg-success/10 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <CheckCircle size={18} />
            </span>
            <div className="min-w-0">
              <h3 id={titleId} className="text-title-xsm font-semibold text-black dark:text-white">
                Borrower created
              </h3>
              <p className="mt-0.5 text-sm text-black dark:text-white">
                This application is now a borrower and can no longer be edited.
              </p>
            </div>
          </div>
          {record.borrower_id ? (
            canOpenBorrower && (
              <Link
                href={`/borrowers/${record.borrower_id}`}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark md:min-h-10"
              >
                Open the borrower
                <ArrowRight aria-hidden="true" size={16} className="shrink-0" />
              </Link>
            )
          ) : (
            <p className="text-sm text-body dark:text-bodydark">The borrower is not linked to this application.</p>
          )}
        </div>
      </section>
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
    </div>
  );
};

export default ConvertedApplication;
