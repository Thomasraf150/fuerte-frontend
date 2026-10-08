"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { Calendar, Check, ChevronLeft, Home, Phone, Slash, X } from "react-feather";
import BranchBadge, { branchLabel } from "@/components/BranchBadge";
import PayerBadge from "@/components/PayerBadge";
import { showDecisionNotePrompt, showProcessingModal } from "@/components/ConfirmationModal";
import useBorrowerDecision from "@/hooks/useBorrowerDecision";
import type { BorrowerDecision, BorrowerRowInfo } from "@/utils/DataTypes";
import { manilaToday } from "@/utils/sourceTracker";
import BorrowerMoreMenu from "./BorrowerMoreMenu";
import DecisionPill, { decisionLine, formatDecidedOn } from "@/components/DecisionPill";
import { CONFIRM_COLORS } from "@/utils/brandColors";

type BackTo = { href: string; label: string };

interface BorrowerHeaderProps {
  /** The saved borrower; absent on New Borrower, which gets the back link and the title only. */
  borrower?: BorrowerRowInfo;
  /** Where the back link goes and what it reads: the page's own closeForm destination. */
  back: BackTo;
  /** The heading when there is no borrower yet ("New Borrower"). */
  title?: string;
  /** Told each decision once it is saved, so the rest of the page (the Loans tab) follows it without a reload. */
  onDecided?: (decision: BorrowerDecision) => void;
}

/** A control's height: 48px below lg (a finger), 40px from lg (a mouse). */
const TARGET = "min-h-[48px] lg:min-h-[40px]";

/** Approve, Reject and More: one quiet button, white on a stroke outline; the icon carries the colour. */
const BUTTON = `${TARGET} inline-flex items-center justify-center gap-2 rounded border border-stroke bg-white px-3 text-sm font-medium text-black shadow-1 transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-strokedark dark:bg-boxdark dark:text-white sm:px-4`;

const LINK_FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

const PROMPT = {
  approved: {
    title: "Approve this borrower?",
    label: "Why? (optional)",
    confirm: "Approve",
    working: "Approving…",
    // 500: the server's cap on a reason.
    options: { confirmColor: CONFIRM_COLORS.approve, maxLength: 500 },
  },
  rejected: {
    title: "Reject this borrower?",
    label: "Why?",
    confirm: "Reject",
    working: "Rejecting…",
    options: { confirmColor: CONFIRM_COLORS.reject, requiredMessage: "Write why the borrower is rejected.", maxLength: 500 },
  },
} as const;

const TITLE = "break-words font-display text-title-sm font-semibold text-black dark:text-white md:text-title-md2";

/** "DELA CRUZ, JUANA S.": the last name, the first name and the middle initial, as stored. */
const borrowerDisplayName = (b: Pick<BorrowerRowInfo, "firstname" | "middlename" | "lastname">): string => {
  const initial = (b.middlename ?? "").trim().charAt(0).toUpperCase();
  const given = [(b.firstname ?? "").trim(), initial && `${initial}.`].filter(Boolean).join(" ");
  return [(b.lastname ?? "").trim(), given].filter(Boolean).join(", ");
};

/** "1990-01-15" → "Jan 15, 1990": a calendar day, read in no zone. '' for anything else. */
const formatDob = (dob?: string | null): string => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob ?? "");
  if (!parts) return "";
  const date = new Date(Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])));
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(parts[3])) return "";
  return date.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
};

/**
 * Whole years from a Y-m-d birthday to `today` (a Manila Y-m-d); null when either is not a date or
 * the birthday is after today. Computed, not read from borrower_details.age: that is typed in by
 * hand once and goes stale. The birthday is passed when today's month-day reaches it, so a
 * 29 February birthday turns over on 1 March in a common year (2000-02-29 is 25 on 2026-02-28
 * and 26 on 2026-03-01).
 */
const ageOn = (dob: string, today: string): number | null => {
  const born = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob);
  const now = /^(\d{4})-(\d{2})-(\d{2})/.exec(today);
  if (!born || !now) return null;
  const beforeBirthday = `${now[2]}${now[3]}` < `${born[2]}${born[3]}`;
  const age = Number(now[1]) - Number(born[1]) - (beforeBirthday ? 1 : 0);
  return age >= 0 ? age : null;
};

/** What a tel: link dials: the number's digits and +, or '' when that is too short to be one. */
const dialable = (contact: string): string => {
  const digits = contact.replace(/[^\d+]/g, "");
  return digits.length >= 7 ? digits : "";
};

/**
 * Approve / Reject through Fuerte's decision prompt. The decision is held here, not written into the
 * page's borrower: a new borrower object would re-run the Details form's load and overwrite edits
 * that have not been saved yet.
 */
const useDecisionPrompt = (borrowerId: number, initial: BorrowerDecision | null, onDecided?: (decision: BorrowerDecision) => void) => {
  const { decide } = useBorrowerDecision();
  const [decision, setDecision] = useState<BorrowerDecision | null>(initial);
  const [busy, setBusy] = useState<BorrowerDecision["status"] | null>(null);

  const record = async (status: BorrowerDecision["status"]) => {
    if (busy) return;
    const prompt = PROMPT[status];
    const reason = await showDecisionNotePrompt(prompt.title, prompt.label, prompt.confirm, prompt.options);
    if (reason === null) return;
    setBusy(status);
    const closeProcessing = showProcessingModal(prompt.working);
    try {
      const saved = await decide(borrowerId, status, reason);
      if (saved) {
        setDecision(saved);
        onDecided?.(saved);
      }
    } finally {
      closeProcessing();
      setBusy(null);
    }
  };

  return { decision, busy, record };
};

/**
 * The breadcrumb stays on desktop. On a phone the back link does its job, and the name is not said
 * twice. A local copy of the shared Breadcrumb's trail: that component always prints its own h2
 * title, which here would repeat the name, and its links are not 48px tall on a tablet.
 */
const DesktopBreadcrumb: React.FC<{ name: string }> = ({ name }) => (
  <nav aria-label="Breadcrumb" className="mb-1 hidden md:block">
    <ol className="flex flex-wrap items-center gap-x-1 text-sm">
      {[{ label: "Dashboard", href: "/" }, { label: "Borrowers", href: "/borrowers" }].map((crumb) => (
        <li key={crumb.href} className="flex items-center">
          <Link className={`${LINK_FOCUS} inline-flex min-h-[48px] items-center font-medium text-bodydark2 transition-colors hover:text-primary lg:min-h-0`} href={crumb.href}>{crumb.label}</Link>
          <span aria-hidden="true" className="mx-1 text-bodydark2">/</span>
        </li>
      ))}
      <li className="flex min-w-0 items-center">
        <span aria-current="page" className="break-words font-medium text-primary">{name}</span>
      </li>
    </ol>
  </nav>
);

/**
 * A rejected borrower, said where nobody can miss it (Rafael 2026-10-08: the one grey line was
 * "super easy to miss"). Research (decision-banner-research): put the consequence in the heading,
 * the reason in full, then what to do next (Atlassian: "Describe the issue and any action the person
 * needs to take"); a business decision is not an error, so no red fill (GOV.UK: "Do not use error
 * messages to tell a user that they are not eligible"): a red edge and icon on the page's own
 * surface, the words carrying the meaning (WCAG 1.4.1). Present on page load, so a plain section
 * with a heading, not a live region. Approved stays the quiet line: it blocks nothing.
 */
const RejectedNotice: React.FC<{ decision: BorrowerDecision }> = ({ decision }) => {
  const titleId = useId();
  const reason = decision.reason?.trim();
  const day = formatDecidedOn(decision.decided_at);
  return (
    <section
      aria-labelledby={titleId}
      data-testid="borrower-rejected-notice"
      className="mt-4 flex max-w-3xl gap-3 rounded-lg border border-stroke border-l-4 border-l-danger bg-white px-4 py-3.5 shadow-sm dark:border-strokedark dark:border-l-danger dark:bg-boxdark"
    >
      <Slash aria-hidden="true" size={20} strokeWidth={2.5} className="mt-0.5 shrink-0 text-danger" />
      <div className="min-w-0 space-y-1.5">
        <h3 id={titleId} className="text-base font-semibold text-black dark:text-white">
          Rejected: no new loans for this borrower
        </h3>
        {reason && (
          <p className="break-words text-[15px] leading-6 text-black dark:text-white">
            <span className="font-semibold">Why: </span>&ldquo;{reason}&rdquo;
          </p>
        )}
        <p className="text-sm text-body dark:text-bodydark">
          {day ? <>Rejected on <span className="whitespace-nowrap">{day}</span>. </> : null}
          To give a loan, approve this borrower first.
        </p>
      </div>
    </section>
  );
};

/** The branch as its small chip plus its name in plain text, the Payer stamp, the decision stamp, and the decision's line. */
const StatusLine: React.FC<{ borrower: BorrowerRowInfo; decision: BorrowerDecision | null }> = ({ borrower, decision }) => {
  const branchName = borrower.branch_sub?.branch?.name ?? "";
  const subBranch = (borrower.branch_sub?.name ?? "").trim();
  // BranchBadge's chip shows the code; the plain name drops it, as the badge's own label does.
  const label = branchName ? branchLabel(branchName, subBranch) : "";

  return (
    <>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        {branchName && (
          <div className="flex min-w-0 items-center gap-2 text-sm text-black/80 dark:text-bodydark">
            {/* The chip alone (the small badge cuts its own label at 90px); the name follows in full. */}
            <BranchBadge branchName={branchName} />
            {label && <span className="min-w-0 break-words">{label}</span>}
          </div>
        )}
        <PayerBadge standing={borrower.payer_standing} borrowerId={borrower.id} size="lg" />
        <DecisionPill decision={decision} />
      </div>
      {decision?.status === "rejected" && <RejectedNotice decision={decision} />}
      {decision && decision.status !== "rejected" && (
        <p data-testid="borrower-decision-line" className="mt-1.5 break-words text-sm text-black/70 dark:text-bodydark">
          {decisionLine(decision)}
        </p>
      )}
    </>
  );
};

/** The mobile number as a tap-to-call link. Some records hold two ("0917… / 0918…"): the first is the link. */
const MobileFact: React.FC<{ contact: string }> = ({ contact }) => {
  const [mobile = "", ...others] = contact.split(/\s*[/,;]\s*/).filter(Boolean);
  const dial = dialable(mobile);
  if (!mobile) return null;

  return (
    <div className="flex min-w-0 items-center">
      <dt className="sr-only">Mobile</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-x-1.5">
        {dial ? (
          <a href={`tel:${dial}`} aria-label={`Call ${mobile}`} className={`${TARGET} ${LINK_FOCUS} inline-flex items-center gap-2 break-all font-medium text-primary hover:underline`}>
            <Phone aria-hidden="true" size={15} className="shrink-0" />
            {mobile}
          </a>
        ) : (
          <span className={`${TARGET} inline-flex items-center gap-2 break-all`}>
            <Phone aria-hidden="true" size={15} className="shrink-0 text-bodydark2" />
            {mobile}
          </span>
        )}
        {others.length > 0 && <span className="break-all">/ {others.join(" / ")}</span>}
      </dd>
    </div>
  );
};

/** At most three quiet facts: the mobile number, the date of birth with the age, the residence address. */
const Facts: React.FC<{ borrower: BorrowerRowInfo }> = ({ borrower }) => {
  const contact = (borrower.borrower_details?.contact_no ?? "").trim();
  const rawDob = borrower.borrower_details?.dob ?? "";
  const dob = formatDob(rawDob);
  // From the date of birth on Manila's today. The stored age only when there is no date of birth at
  // all: a date of birth that is not a date, or is in the future, shows no age rather than a stale one.
  const age = rawDob.trim()
    ? (dob ? ageOn(rawDob, manilaToday()) : null) ?? 0
    : Number(borrower.borrower_details?.age) || 0;
  const born = [dob, age > 0 ? `${age} years` : ""].filter(Boolean).join(" · ");
  const address = (borrower.residence_address ?? "").trim();
  if (!contact && !born && !address) return null;

  return (
    <dl className="mt-1 flex flex-wrap items-center gap-x-5 text-sm text-black/80 dark:text-bodydark">
      <MobileFact contact={contact} />
      {born && (
        <div className="flex min-w-0 items-center py-1">
          <dt className="sr-only">Date of birth</dt>
          <dd className="flex items-center gap-2">
            <Calendar aria-hidden="true" size={15} className="shrink-0 text-bodydark2" />
            {born}
          </dd>
        </div>
      )}
      {address && (
        <div className="flex min-w-0 items-start py-1">
          <dt className="sr-only">Residence address</dt>
          <dd className="flex min-w-0 items-start gap-2">
            <Home aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-bodydark2" />
            <span className="min-w-0 break-words">{address}</span>
          </dd>
        </div>
      )}
    </dl>
  );
};

/** The part every borrower page shares: the desktop breadcrumb and the labelled back link, then the rest. */
const HeaderShell: React.FC<{ name: string; back: BackTo; children: React.ReactNode }> = ({ name, back, children }) => (
  <header className="mx-auto mb-5 max-w-full px-2 sm:px-4 lg:max-w-7xl lg:px-0">
    <DesktopBreadcrumb name={name} />
    <Link href={back.href} aria-label={`Back to ${back.label}`} className={`${TARGET} ${LINK_FOCUS} -ml-1.5 inline-flex items-center gap-0.5 rounded pr-1 text-sm font-medium text-primary hover:underline`}>
      <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.5} className="shrink-0" />
      {back.label}
    </Link>
    {children}
  </header>
);

/**
 * The borrower page's read-first header (spec 2026-10-05 B2): back link, the name once, the status
 * line (branch, Payer, decision), up to three facts, and the actions. Everything wraps and nothing
 * is cut at 360px. Approve / Reject record a decision. A rejected borrower cannot borrow: the server
 * refuses every new loan, renewal, approval and release until they are approved again (spec E §1).
 * New Borrower (no borrower yet) gets the back link and its title only.
 */
const BorrowerHeader: React.FC<BorrowerHeaderProps> = ({ borrower, back, title = "New Borrower", onDecided }) =>
  borrower?.id ? (
    <SavedBorrowerHeader borrower={borrower} back={back} onDecided={onDecided} />
  ) : (
    <HeaderShell name={title} back={back}>
      <h2 className={TITLE}>{title}</h2>
    </HeaderShell>
  );

const SavedBorrowerHeader: React.FC<{ borrower: BorrowerRowInfo; back: BackTo; onDecided?: (decision: BorrowerDecision) => void }> = ({
  borrower,
  back,
  onDecided,
}) => {
  const { decision, busy, record } = useDecisionPrompt(Number(borrower.id), borrower.decision ?? null, onDecided);
  const name = borrowerDisplayName(borrower);

  return (
    <HeaderShell name={name} back={back}>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 grow basis-[28rem]">
          <h2 className={TITLE}>{name}</h2>
          <StatusLine borrower={borrower} decision={decision} />
          <Facts borrower={borrower} />
        </div>

        {/* `relative`: the More menu opens against this row, so it never leaves the screen. No `disabled`
            while saving: the processing modal already blocks the page, and a disabled button would drop
            the focus the prompt hands back; `busy` stops a second click. */}
        <div className="relative flex flex-wrap items-center gap-2">
          <button type="button" className={BUTTON} onClick={() => record("approved")} aria-busy={busy === "approved"}>
            <Check aria-hidden="true" size={16} strokeWidth={2.75} className="shrink-0 text-success dark:text-meta-3" />
            Approve
          </button>
          <button type="button" className={BUTTON} onClick={() => record("rejected")} aria-busy={busy === "rejected"}>
            <X aria-hidden="true" size={16} strokeWidth={2.75} className="shrink-0 text-danger" />
            Reject
          </button>
          <BorrowerMoreMenu borrower={borrower} summaryClassName={BUTTON} />
        </div>
      </div>
    </HeaderShell>
  );
};

export default BorrowerHeader;
