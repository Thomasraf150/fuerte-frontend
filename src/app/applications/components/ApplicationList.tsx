"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Inbox, Plus } from 'react-feather';
import { Card, CardBody, Toolbar } from '@/components/Card';
import CustomDatatable from '@/components/CustomDatatable';
import useLoanApplications, { ApplicationStatusFilter, LoadedApplications } from '@/hooks/useLoanApplications';
import type { ApplicationOutcome, LoanApplicationRow } from '@/utils/DataTypes';
import { listHref, outcomeLabel, type ListParams } from '@/utils/applicationOutcome';
import { formatCount } from '@/utils/helper';
import { formatPeriod, type DayRange } from '@/utils/sourceTracker';
import { applicationColumns } from './ApplicationColumns';
import { APPLICATION_STATUS_DOT, APPLICATION_STATUS_LABEL } from './ApplicationStatusPill';
import LoadError from './LoadError';
import OutcomeFilters from './OutcomeFilters';
import UploadResponses from './UploadResponses';
import { useCanUpload } from './useCanUpload';

const FILTERS: ApplicationStatusFilter[] = ['all', 'for_interview', 'interviewed', 'declined', 'borrower_created'];

/** Nothing exists at all for this user: an unfiltered, unsearched fetch came back empty. */
const isNothingYet = (loaded: LoadedApplications | null): boolean =>
  !!loaded && loaded.total === 0 && loaded.status === 'all' && loaded.search === '' && !loaded.outcome && !loaded.period;

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

/** "12 applications · Declined · Loan released · Applied Oct 1 – Oct 31, 2026 · matching “cruz”". The dots are for the eye; a screen reader hears commas. */
const ResultLine: React.FC<{ loaded: LoadedApplications }> = ({ loaded }) => {
  const noun = loaded.total === 1 ? 'application' : 'applications';
  const parts = [
    loaded.total === 0 ? `No ${noun}` : `${formatCount(loaded.total)} ${noun}`,
    ...(loaded.status !== 'all' ? [APPLICATION_STATUS_LABEL[loaded.status]] : []),
    ...(loaded.outcome ? [outcomeLabel(loaded.outcome)] : []),
    ...(loaded.period ? [`Applied ${formatPeriod(loaded.period)}`] : []),
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

/** The page's primary action. On phones the button takes the full width. */
const NewApplicationLink: React.FC = () => (
  <Toolbar className="sm:justify-end">
    <Link
      href="/applications/new"
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark sm:w-auto md:min-h-10"
    >
      <Plus aria-hidden="true" size={18} className="shrink-0" />
      New application
    </Link>
  </Toolbar>
);

/**
 * "Na-save ang application." when New application has just saved one: it opens
 * /applications?saved=1. The query is then dropped, so a refresh does not say it again.
 * Read from window.location on mount, not useSearchParams: on Next 14.2.3 that fails
 * `next build` without a <Suspense> boundary.
 */
const useSavedNote = (): string => {
  const [note, setNote] = useState('');
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('saved') !== '1') return;
    setNote('Na-save ang application.');
    window.history.replaceState(null, '', '/applications');
  }, []);
  return note;
};

/**
 * The filters a link can set, kept in the address as they change, so the list on screen can be
 * shared or reloaded as it is. replaceState, not a navigation: the page is already showing it.
 */
const linkedFilterActions = (list: ReturnType<typeof useLoanApplications>) => {
  const write = (status: ApplicationStatusFilter, outcome: ApplicationOutcome | null, period: DayRange | null) =>
    window.history.replaceState(null, '', listHref({ status: status === 'all' ? null : status, outcome, period }));
  return {
    changeStatus: (next: ApplicationStatusFilter) => {
      list.setStatusFilter(next);
      write(next, list.outcome, list.period);
    },
    changeOutcome: (next: ApplicationOutcome | null) => {
      list.setOutcome(next);
      write(list.statusFilter, next, list.period);
    },
    clearPeriod: () => {
      list.setPeriod(null);
      write(list.statusFilter, list.outcome, null);
    },
  };
};

/** `initial`: the filters the address asked for (page.tsx reads them with readListParams). */
const ApplicationList: React.FC<{ initial?: ListParams }> = ({ initial }) => {
  const list = useLoanApplications(initial);
  const {
    applications, loading, error, refresh, loaded, statusFilter, outcome, period,
    uploading, uploadResponses, pasting, pasteRows, serverSidePaginationProps,
  } = list;
  const { changeStatus, changeOutcome, clearPeriod } = linkedFilterActions(list);
  const canUpload = useCanUpload(); // null until read: treated as "not an upload role" meanwhile
  const savedNote = useSavedNote();
  /*
   * A click anywhere on a row opens its application, as the Name link in it does: the shared
   * table's rowHref (components/CustomDatatable/rowOpen.ts). Two exceptions, because in a
   * table of numbers a click is not always a request to open:
   *   - text is selected: Call Center drags across a mobile number to copy it, and the
   *     click that ends the drag must not take the page away;
   *   - ctrl, cmd or the middle button: the application opens in a new tab, as on the link,
   *     and this tab stays on the list.
   */
  const applicationHref = (row: LoanApplicationRow): string => `/applications/${row.id}`;
  // While a load has failed, say nothing about rows: the alert above the table is the news.
  const shown = error ? null : loaded;
  const nothingYet = isNothingYet(shown);

  return (
    <Card>
      {/*
        CardBody's 16px padding on phones leaves the table 328px at 360px. Three columns fit there
        only through the app-wide table-fit settings: useDatatableTheme's tableWrapper
        display:block, and the library's 100px column default.
      */}
      <CardBody>
        <NewApplicationLink />
        {canUpload && (
          <UploadResponses uploading={uploading} pasting={pasting} onUpload={uploadResponses} onPaste={pasteRows} onUploaded={refresh} />
        )}
        <StatusFilter value={statusFilter} onChange={changeStatus} />
        <OutcomeFilters outcome={outcome} period={period} onOutcome={changeOutcome} onClearPeriod={clearPeriod} />
        {error && <LoadError message={error} onRetry={refresh} />}
        <div>
          {/* In the page from the start, empty, so a screen reader announces the note when it fills. */}
          {/* Dark text for contrast (text-success is ~3.8:1 on white); the green lives in the icon. */}
          <p role="status" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-black empty:mb-0 dark:text-white">
            {savedNote && (
              <>
                <CheckCircle size={16} aria-hidden="true" className="shrink-0 text-success" />
                {savedNote}
              </>
            )}
          </p>
          <div role="status" aria-busy={loading}>
            {!shown && !error && <p className="text-sm text-body dark:text-bodydark">Loading applications…</p>}
            {shown && (nothingYet ? <NothingYet canUpload={canUpload === true} /> : <ResultLine loaded={shown} />)}
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
                rowHref={applicationHref}
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default ApplicationList;
