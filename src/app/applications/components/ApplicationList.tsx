"use client";

import React, { useEffect, useState } from 'react';
import { Inbox } from 'react-feather';
import CustomDatatable from '@/components/CustomDatatable';
import useLoanApplications, { ApplicationStatusFilter, LoadedApplications } from '@/hooks/useLoanApplications';
import { useAuthStore } from '@/store/authStore';
import { formatCount } from '@/utils/helper';
import { applicationColumns } from './ApplicationColumns';
import { APPLICATION_STATUS_DOT, APPLICATION_STATUS_LABEL } from './ApplicationStatusPill';
import UploadResponses from './UploadResponses';

/** Mirrors the backend's ApplicationAccessPolicy::canUpload: Admin, Owner and Call Center. */
const UPLOAD_ROLE_CODES = new Set(['ADM', 'OWN', 'CALLCTR']);

const FILTERS: ApplicationStatusFilter[] = ['all', 'for_interview', 'interviewed', 'declined', 'borrower_created'];

/** Who may upload. Read after mount: the persisted auth store only exists in the browser, never during SSR. */
const useCanUpload = (): boolean => {
  const [canUpload, setCanUpload] = useState(false);
  useEffect(() => {
    setCanUpload(UPLOAD_ROLE_CODES.has(useAuthStore.getState().user?.role?.code));
  }, []);
  return canUpload;
};

/** Nothing exists at all for this user: an unfiltered, unsearched fetch came back empty. */
const isNothingYet = (loaded: LoadedApplications | null): boolean =>
  !!loaded && loaded.total === 0 && loaded.status === 'all' && loaded.search === '';

/*
 * The same chips as the Borrowers Payer filter, so the control is familiar, plus
 * the status colour as a dot. text-xs on phones keeps all five on two rows at
 * 360px; every chip is at least 48px tall and wide there, and denser from md up.
 */
const StatusFilter: React.FC<{ value: ApplicationStatusFilter; onChange: (value: ApplicationStatusFilter) => void }> = ({ value, onChange }) => (
  <div role="group" aria-label="Filter applications by status" className="flex flex-wrap gap-2">
    {FILTERS.map(option => {
      const selected = value === option;
      return (
        <button
          key={option}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(option)}
          className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-boxdark sm:px-4 sm:text-sm md:min-h-9 ${
            selected
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-inset ring-primary dark:bg-primary/20 dark:text-white'
              : 'border-stroke bg-white text-body hover:border-primary/50 hover:text-black dark:border-strokedark dark:bg-boxdark dark:text-bodydark1 dark:hover:text-white'
          }`}
        >
          {option !== 'all' && <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${APPLICATION_STATUS_DOT[option]}`} />}
          {option === 'all' ? 'All' : APPLICATION_STATUS_LABEL[option]}
        </button>
      );
    })}
  </div>
);

/** "12 applications · Declined · matching “cruz”". The dots are for the eye; a screen reader hears commas. */
const ResultLine: React.FC<{ loaded: LoadedApplications }> = ({ loaded }) => {
  const noun = loaded.total === 1 ? 'application' : 'applications';
  const parts = [
    loaded.total === 0 ? `No ${noun}` : `${formatCount(loaded.total)} ${noun}`,
    ...(loaded.status !== 'all' ? [APPLICATION_STATUS_LABEL[loaded.status]] : []),
    ...(loaded.search ? [`matching “${loaded.search}”`] : []),
  ];
  return (
    <p className="truncate text-sm text-body dark:text-bodydark">
      {parts.map((part, index) => (
        <React.Fragment key={part}>
          {index > 0 && (
            <>
              <span aria-hidden="true" className="px-1.5 text-bodydark2">·</span>
              <span className="sr-only">, </span>
            </>
          )}
          <span className={index === 0 ? 'font-medium text-black dark:text-white' : ''}>{part}</span>
        </React.Fragment>
      ))}
    </p>
  );
};

/** An empty list, not an error: worded for who is looking. */
const NothingYet: React.FC<{ canUpload: boolean }> = ({ canUpload }) => (
  <div className="flex flex-col items-center rounded-sm bg-whiter px-6 py-12 text-center dark:bg-boxdark-2">
    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-body shadow-card-2 dark:bg-boxdark dark:text-bodydark">
      <Inbox size={22} />
    </span>
    <p className="mt-4 font-medium text-black dark:text-white">
      {canUpload ? 'No applications yet' : 'No applications for your branch yet'}
    </p>
    <p className="mt-1 max-w-sm text-sm text-body dark:text-bodydark">
      {canUpload
        ? 'Upload the Google Form download above to add the applicants.'
        : 'Nothing has been assigned to your branch yet. Applications show here once they are.'}
    </p>
  </div>
);

const LoadError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex flex-col gap-3 rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-black dark:text-white sm:flex-row sm:items-center sm:justify-between">
    <p className="min-w-0 break-words">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="min-h-12 shrink-0 rounded bg-danger px-5 font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark md:min-h-9"
    >
      Retry
    </button>
  </div>
);

const ApplicationList: React.FC = () => {
  const { applications, loading, error, refresh, loaded, statusFilter, setStatusFilter, uploading, uploadResponses, serverSidePaginationProps } =
    useLoanApplications();
  const canUpload = useCanUpload();
  // While a load has failed, say nothing about rows: the alert above the table is the news.
  const shown = error ? null : loaded;
  const nothingYet = isNothingYet(shown);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-3 py-4 dark:border-strokedark sm:px-5 md:px-7">
        <h3 className="font-medium text-black dark:text-white">Applications</h3>
      </div>
      {/*
        px-3 on phones leaves the table 302px at 360px. Three columns fit there only
        through the app-wide table-fit settings: useDatatableTheme's tableWrapper
        display:block plus the 80px column floor in app/styles.css.
      */}
      <div className="space-y-5 px-3 py-5 sm:px-5 md:p-7">
        {canUpload && <UploadResponses uploading={uploading} onUpload={uploadResponses} onUploaded={refresh} />}
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        {error && <LoadError message={error} onRetry={refresh} />}
        <div>
          <div role="status" aria-busy={loading}>
            {!shown && !error && <p className="text-sm text-body dark:text-bodydark">Loading applications…</p>}
            {shown && (nothingYet ? <NothingYet canUpload={canUpload} /> : <ResultLine loaded={shown} />)}
          </div>
          {!nothingYet && (
            <div className="mt-3">
              <CustomDatatable
                apiLoading={loading || (!loaded && !error)}
                columns={applicationColumns}
                data={applications}
                enableCustomHeader={true}
                title={''}
                serverSidePagination={serverSidePaginationProps}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationList;
