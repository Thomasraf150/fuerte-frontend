"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle, FileText, Lock, MapPin, UserCheck, type Icon } from 'react-feather';
import useFocusOnMount from '@/hooks/useFocusOnMount';
import type { StopState } from '@/hooks/useConvertApplication';
import { OTHER_BRANCH_HINT, OTHER_BRANCH_TITLE, applicationNumber, type ConversionBlock } from '@/utils/convertApplication';

/*
 * Create as borrower, the two things New Borrower shows around the form (see
 * borrowers/[id]/page.tsx and useConvertApplication):
 *   - ConvertBanner: above the prefilled form, saying where it came from and what is left to add;
 *   - ConvertStop: in place of the form when the application cannot become a borrower (yet).
 * Both carry a bar down their left edge, the colour saying where things stand: primary for
 * "in progress", warning for "on hold", success for "done", danger for "missing". They sit in
 * the same column as BorrowerInfo's card, so their edges line up with it.
 */

/** BorrowerInfo's own column, so a banner or a card above it shares its left and right edges. */
const COLUMN = 'mx-auto w-full max-w-full px-2 sm:px-4 lg:max-w-7xl lg:px-0';

/** A card with a coloured bar down its left edge, clipped to the corners. */
const CARD = 'relative overflow-hidden rounded-xl border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-boxdark';

const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark';

/**
 * The banner: where the form came from, what to add, and the way to the application. After a
 * Retry (`focusOnMount`) it takes focus, once, as it appears: the Retry button the keyboard was
 * on has gone with the alert, and the banner says what has loaded. It is focusable by script
 * only (tabIndex -1).
 */
export const ConvertBanner: React.FC<{ applicationId: number; focusOnMount?: boolean }> = ({ applicationId, focusOnMount = false }) => {
  const number = applicationNumber(applicationId);
  const banner = useFocusOnMount<HTMLDivElement>(focusOnMount);
  return (
    <div className={COLUMN}>
      <div
        ref={banner}
        role="note"
        tabIndex={-1}
        className={`${CARD} py-3.5 pl-6 pr-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:pr-4`}
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
            >
              <FileText size={18} />
            </span>
            <p className="min-w-0 break-words pt-2 text-sm leading-6 text-black dark:text-white">
              Creating a borrower from application{' '}
              <span className="font-semibold tabular-nums text-primary dark:text-white">{number}</span>
              {' '}— check the details, then add the Chief, Area / Sub-area, Office and a photo.
            </p>
          </div>
          <Link
            href={`/applications/${applicationId}`}
            className={`-ml-1 inline-flex min-h-12 shrink-0 items-center self-start rounded px-3 text-sm font-medium text-primary transition-colors hover:underline sm:ml-0 sm:self-center md:min-h-10 dark:text-white ${FOCUS}`}
          >
            View application<span className="sr-only"> {number}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

type Tone = 'done' | 'hold' | 'missing';

/** Whole class names, so Tailwind sees them. */
const TONES: Record<Tone, { bar: string; badge: string }> = {
  done: { bar: 'bg-success', badge: 'bg-success/10 text-success dark:bg-success/20' },
  hold: { bar: 'bg-warning', badge: 'bg-warning/10 text-warning dark:bg-warning/20' },
  missing: { bar: 'bg-danger', badge: 'bg-danger/10 text-danger dark:bg-danger/20' },
};

interface Notice {
  tone: Tone;
  Icon: Icon;
  title: string;
  hint: string;
}

/**
 * Why an application cannot become a borrower yet, in staff's words. The titles are the server's own
 * messages, except the last: the page knows the user's branches and says it before the server does,
 * at the save, after the photo is stored.
 */
const BLOCKED: Record<ConversionBlock, Notice> = {
  converted: {
    tone: 'done',
    Icon: CheckCircle,
    title: 'This application is already a borrower',
    hint: 'It has already been turned into a borrower, and an application can only become one once.',
  },
  'no-branch': {
    tone: 'hold',
    Icon: MapPin,
    title: 'Assign a branch to this application first',
    hint: 'A borrower takes the branch of the application it comes from. Open the application, choose its branch, then try again.',
  },
  'not-interviewed': {
    tone: 'hold',
    Icon: UserCheck,
    title: 'Set this application to Interviewed first',
    hint: 'Only an interviewed application can become a borrower. Open the application, set its status to Interviewed, then try again.',
  },
  'other-branch': {
    tone: 'hold',
    Icon: Lock,
    title: OTHER_BRANCH_TITLE,
    hint: OTHER_BRANCH_HINT,
  },
};

const NOT_FOUND: Notice = {
  tone: 'missing',
  Icon: AlertCircle,
  title: 'Application not found',
  hint: 'It may have been removed, or it is not one you can open.',
};

/** The one way forward from a notice: where it goes, what it says, and what a screen reader hears besides. */
interface Way {
  href: string;
  label: string;
  hidden: string;
}

/**
 * One notice: the bar and icon of its tone, whose application it is, why, and the way forward.
 * After a Retry (`focusOnMount`) it takes focus, as the banner and the new failed alert's Retry
 * button do: the Retry button the keyboard was on went with the old alert, and the card says
 * what the Retry found.
 * A first load into it moves nothing. Focusable by script only (tabIndex -1).
 */
const NoticeCard: React.FC<{ notice: Notice; number: string; way: Way; focusOnMount: boolean }> = ({
  notice, number, way, focusOnMount,
}) => {
  const { tone, Icon: NoticeIcon, title, hint } = notice;
  const card = useFocusOnMount<HTMLElement>(focusOnMount);
  return (
    <section
      ref={card}
      tabIndex={-1}
      aria-labelledby="convert-stop-title"
      className={`${CARD} max-w-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${TONES[tone].bar}`} />
      <div className="flex flex-col gap-5 py-6 pl-7 pr-5 sm:px-9 sm:py-8">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${TONES[tone].badge}`}
          >
            <NoticeIcon size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-body dark:text-bodydark">Application {number}</p>
            <h3
              id="convert-stop-title"
              className="mt-1 break-words text-title-xsm font-semibold text-black dark:text-white sm:text-title-sm"
            >
              {title}
            </h3>
          </div>
        </div>
        <p className="text-sm leading-6 text-body dark:text-bodydark">{hint}</p>
        <Link
          href={way.href}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-primary px-6 font-medium text-white transition-colors hover:bg-opacity-90 sm:w-auto sm:self-start ${FOCUS}`}
        >
          <ArrowLeft aria-hidden="true" size={16} className="shrink-0" />
          <span>
            {way.label}
            {way.hidden && <span className="sr-only">{way.hidden}</span>}
          </span>
        </Link>
      </div>
    </section>
  );
};

/**
 * A load that failed: the words, Retry, and beside it the way back to the application. It is
 * drawn as LoadError is (the alert the Applications pages use), which has no room for the second.
 * After a Retry that fails again (`focusOnMount`) its Retry button takes focus: the one the
 * keyboard was on went with the old alert, and the keyboard user lands where they can go on. The
 * alert itself is not focused too: it is announced as it appears (role="alert"), and focusing it
 * as well would read it twice. A first failure moves nothing.
 */
const FailedNotice: React.FC<{ id: number; message: string; onRetry: () => void; focusOnMount: boolean }> = ({
  id, message, onRetry, focusOnMount,
}) => {
  const number = applicationNumber(id);
  const retry = useFocusOnMount<HTMLButtonElement>(focusOnMount);
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-black dark:text-white sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="min-w-0 break-words">{message}</p>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <button
          ref={retry}
          type="button"
          onClick={onRetry}
          className="min-h-12 rounded bg-danger px-5 font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark md:min-h-9"
        >
          Retry
        </button>
        <Link
          href={`/applications/${id}`}
          className="inline-flex min-h-12 items-center justify-center rounded border border-stroke bg-white px-5 font-medium text-black transition-colors hover:border-danger/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus-visible:ring-offset-boxdark md:min-h-9"
        >
          Open application<span className="sr-only"> {number}</span>
        </Link>
      </div>
    </div>
  );
};

/**
 * What New Borrower shows instead of the form when the application cannot become a borrower
 * (yet): the reason, and the one way forward. A load that failed is an alert with Retry, and
 * a link back to the application beside it. `focusOnMount` (a Retry has been pressed) moves
 * focus to what the Retry shows: the alert's Retry button, or the card.
 */
export const ConvertStop: React.FC<{ state: StopState; onRetry: () => void; focusOnMount?: boolean }> = ({
  state, onRetry, focusOnMount = false,
}) => {
  if (state.kind === 'failed') {
    return (
      <div className={COLUMN}>
        <FailedNotice id={state.id} message={state.message} onRetry={onRetry} focusOnMount={focusOnMount} />
      </div>
    );
  }

  const number = applicationNumber(state.id);
  const [notice, way]: [Notice, Way] = state.kind === 'blocked'
    ? [BLOCKED[state.reason], { href: `/applications/${state.id}`, label: 'Open application', hidden: ` ${number}` }]
    : [NOT_FOUND, { href: '/applications', label: 'Back to Applications', hidden: '' }];

  return (
    <div className={COLUMN}>
      <NoticeCard notice={notice} number={number} way={way} focusOnMount={focusOnMount} />
    </div>
  );
};
