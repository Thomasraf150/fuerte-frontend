"use client";

import React, { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { AlertOctagon, AlertTriangle, HelpCircle } from 'react-feather';
import type { BorrowerMatchCheck } from '@/hooks/useApplicationBorrowerMatch';
import useFocusOnMount from '@/hooks/useFocusOnMount';
import type { LoanApplicationBorrowerMatch } from '@/utils/DataTypes';

const TITLE = 'This applicant may already be a borrower';
const BODY =
  'Their name or mobile number matches a borrower already in Fuerte. They may be applying as a new borrower to get better rates. Check their record before you continue.';
const CHECK_FAILED = 'Could not check whether this applicant is already a borrower.';
/** What a screen reader hears, once, when the card appears. */
const ANNOUNCEMENT = `${TITLE}. Check their record before you continue.`;

/** Focusable by script only (tabIndex -1): the ring shows for a keyboard, not after a click. */
const FOCUS_RING = 'rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark';

/**
 * Hazard tape for the card's left edge, in the page's own two colours: the amber the intake
 * flags use and the ink of the dark surfaces. The header's edge carries the status colour; this
 * one carries a warning.
 */
const CAUTION_TAPE =
  'bg-[repeating-linear-gradient(135deg,theme(colors.warning)_0,theme(colors.warning)_6px,theme(colors.black)_6px,theme(colors.black)_12px)]';

const plural = (count: number, one: string): string => `${count} ${one}${count === 1 ? '' : 's'}`;

/** Only a match in some branch is worth a warning: a problem flag with nothing found is not one. */
const hasMatch = (match: LoanApplicationBorrowerMatch | null): match is LoanApplicationBorrowerMatch =>
  match !== null && (match.existsInMyBranches || match.existsElsewhere);

/**
 * The card unfolds as it appears, so the form under it slides down instead of jumping: native
 * (Web Animations), a quarter of a second, and none at all for a reader who asked for less motion.
 * No library: this repo has none for motion, and one effect does not earn a dependency. Returns
 * the animation, or null when there is none.
 */
function unfold(node: HTMLElement): Animation | null {
  if (typeof node.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const height = node.getBoundingClientRect().height;
  return node.animate([{ height: '0px', opacity: 0 }, { height: `${height}px`, opacity: 1 }], {
    duration: 260,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  });
}

/** Branch names as tags: they wrap, and a long name wraps inside its own tag. */
const BranchTags: React.FC<{ names: readonly string[] }> = ({ names }) => (
  <ul role="list" className="flex flex-wrap gap-1.5">
    {names.map((name, index) => (
      <li
        key={`${index}-${name}`}
        className="max-w-full break-words rounded-sm border border-warning/60 bg-white px-2 py-0.5 text-xs font-medium text-black dark:border-warning/40 dark:bg-boxdark dark:text-white"
      >
        {name}
      </li>
    ))}
  </ul>
);

/** One line of the card's list: a small label, and what it says, side by side from sm up. */
const Detail: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="sm:grid sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-x-4">
    {/* text-black, not text-body: the muted grey is under 4.5:1 on the amber tint. */}
    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black dark:text-bodydark">{label}</dt>
    <dd className="mt-1.5 min-w-0 space-y-1.5 sm:mt-0">{children}</dd>
  </div>
);

/** The worst of the problem accounts that matched, on the side or sides that are flagged. */
const worstCutoffs = (match: LoanApplicationBorrowerMatch): number =>
  Math.max(match.myBranchIsProblem ? match.myBranchWorstCutoffs ?? 0 : 0, match.isProblem ? match.worstCutoffsMissed ?? 0 : 0);

/**
 * The danger line: red edge and icon, ink text (the red is under 4.5:1 as small text on the amber
 * tint). A group of the list like any other, so its term and its description are the only
 * children of the group: the icon belongs to the term.
 */
const ProblemAccount: React.FC<{ worst: number }> = ({ worst }) => (
  <div className="rounded-sm border border-danger/50 bg-danger/10 px-3 py-2.5">
    <dt className="flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white">
      <AlertOctagon aria-hidden="true" size={16} className="shrink-0 text-danger" />
      Problem account
    </dt>
    {/* 1.625rem: the icon's 16px and the 10px gap, so the line sits under the words. */}
    <dd className="mt-0.5 pl-[1.625rem] text-sm text-black dark:text-bodydark">
      {worst > 0 ? `Worst: ${plural(worst, 'cut-off')} missed` : 'Flagged as a problem account'}
    </dd>
  </div>
);

/**
 * The warning itself: an amber card with hazard tape on its edge. A labelled section with a
 * real heading, not an alert: it is announced once by RepeatApplicantCheck, and read in its
 * place in the page. It warns and never blocks; nothing else on the page depends on it.
 * `focusOnMount`: the card is the answer to a Retry, so its heading takes the focus the Retry
 * button has just lost.
 */
const RepeatApplicantCard: React.FC<{ match: LoanApplicationBorrowerMatch; focusOnMount: boolean }> = ({ match, focusOnMount }) => {
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);
  const unfolding = useRef<Animation | null>(null);
  const heading = useFocusOnMount<HTMLHeadingElement>(focusOnMount, unfolding);
  const problem = match.myBranchIsProblem || match.isProblem;
  const mine = match.myBranches ?? [];
  const elsewhere = match.branches ?? [];

  useLayoutEffect(() => {
    // One animation per card: React's Strict Mode runs a new component's effects twice in development.
    if (ref.current && !unfolding.current) unfolding.current = unfold(ref.current);
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      className="relative overflow-hidden rounded-sm border border-warning/60 bg-warning/10 shadow-default"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${CAUTION_TAPE}`} />
      <div className="px-5 py-4 pl-7 sm:px-8 sm:py-5">
        <div className="flex items-start gap-3.5">
          <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning text-black">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <h3 ref={heading} id={titleId} tabIndex={-1} className={`text-title-xsm font-semibold text-black dark:text-white ${FOCUS_RING}`}>
              {TITLE}
            </h3>
            <p className="mt-1 text-sm text-black dark:text-bodydark">{BODY}</p>
          </div>
        </div>
        <dl className="mt-4 space-y-3 border-t border-warning/40 pt-4">
          {match.existsInMyBranches && (
            <Detail label="In your branches">
              <p className="text-sm font-semibold text-black dark:text-white">{plural(Math.max(match.myBranchMatchCount, 1), 'borrower')}</p>
              {mine.length > 0 && <BranchTags names={mine} />}
            </Detail>
          )}
          {match.existsElsewhere && (
            <Detail label="Other branches">
              {elsewhere.length > 0 ? <BranchTags names={elsewhere} /> : <p className="text-sm text-black dark:text-white">Another branch</p>}
            </Detail>
          )}
          {problem && <ProblemAccount worst={worstCutoffs(match)} />}
        </dl>
      </div>
    </section>
  );
};

/**
 * The check could not be made. A quiet note, in the page's neutral colours, never a statement
 * that the applicant is new: nothing is known. Retry keeps its place while the check is out
 * (aria-disabled, as Print does) so a keyboard user is not dropped.
 */
const CheckFailedNote: React.FC<{ checking: boolean; onRetry: () => void }> = ({ checking, onRetry }) => (
  <div className="flex flex-col gap-3 rounded-sm border border-stroke bg-whiten px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-strokedark dark:bg-meta-4">
    <p className="flex min-w-0 items-start gap-2 text-black dark:text-bodydark">
      <HelpCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-bodydark2" />
      <span className="min-w-0 break-words">{CHECK_FAILED}</span>
    </p>
    <button
      type="button"
      aria-disabled={checking}
      onClick={() => {
        if (!checking) onRetry();
      }}
      className="inline-flex min-h-12 shrink-0 items-center justify-center rounded border border-stroke bg-white px-5 font-medium text-black transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-disabled:cursor-progress dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus-visible:ring-offset-boxdark md:min-h-9"
    >
      {checking ? 'Checking…' : 'Retry'}
    </button>
  </div>
);

/**
 * A Retry that found nothing: the note, and the Retry button the keyboard was on, are gone and
 * nothing replaces them (no "all clear", ever), so the focus goes to a stable place: the page's
 * own heading, which says whose application this is. It mounts when that answer arrives and
 * focuses once, as it does; a later check never mounts it again.
 */
const FocusAfterRetry: React.FC<{ target: React.RefObject<HTMLElement> }> = ({ target }) => {
  useEffect(() => {
    target.current?.focus();
  }, [target]);
  return null;
};

/**
 * What the page says about a repeat applicant: the card when the applicant matches a borrower
 * already in Fuerte (a fraud signal: they may be posing as new to get better rates), a quiet
 * note when the check could not be made, and nothing at all otherwise. Loading shows nothing and
 * an answer of "no match" shows nothing: there is no "all clear" text, ever.
 *
 * The polite announcement lives in a region that is always in the page (empty until there is a
 * card), and its text is set while the card is shown, not each time the check answers: a
 * re-check that still matches says nothing more. The region is a div, so it is not mistaken for
 * the form's own notes, which are paragraphs.
 *
 * After a Retry that succeeds the focus goes to the card's heading, or, with no match, to
 * `fallbackFocus` (the page's heading): never after any other check.
 */
export const RepeatApplicantCheck: React.FC<{ check: BorrowerMatchCheck; fallbackFocus: React.RefObject<HTMLElement> }> = ({
  check,
  fallbackFocus,
}) => {
  const match = hasMatch(check.match) ? check.match : null;
  return (
    <>
      <div role="status" className="sr-only">
        {match ? ANNOUNCEMENT : ''}
      </div>
      {match && <RepeatApplicantCard match={match} focusOnMount={check.viaRetry} />}
      {check.failed && <CheckFailedNote checking={check.checking} onRetry={check.retry} />}
      {check.viaRetry && !match && <FocusAfterRetry target={fallbackFocus} />}
    </>
  );
};
