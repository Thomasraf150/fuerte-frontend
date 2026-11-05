"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { Calendar, Check, ChevronLeft, FileText, Home, Phone, Slash, UserPlus, X } from "react-feather";
import BranchBadge, { branchLabel } from "@/components/BranchBadge";
import PayerBadge from "@/components/PayerBadge";
import { showDecisionNotePrompt, showProcessingModal } from "@/components/ConfirmationModal";
import useBorrowerDecision, { ALREADY_APPROVED } from "@/hooks/useBorrowerDecision";
import type { BorrowerDecision, BorrowerOrigin, BorrowerRowInfo } from "@/utils/DataTypes";
import { CHANNEL_LABELS } from "@/utils/applicationForm";
import { applicationNumber } from "@/utils/convertApplication";
import { manilaToday } from "@/utils/sourceTracker";
import BorrowerMoreMenu from "./BorrowerMoreMenu";
import BranchRecords from "./BranchRecords";
import { LINK_FOCUS, SECTION_LABEL } from "./styles";
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


/** Approve when the server would refuse it: reachable by keyboard (aria-disabled), dashed and muted, as Link to borrower is. */
const UNAVAILABLE = "cursor-not-allowed border-dashed text-black/50 hover:border-stroke hover:text-black/50 dark:text-white/50";

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
  // Reject on a borrower already rejected (2026-11-05): the same decision with a new reason.
  reason: {
    title: "Change the rejection reason?",
    label: "New reason",
    confirm: "Save reason",
    working: "Saving…",
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

/** "A", "A and B", "A, B and C". */
const listBranches = (names: string[]): string =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/**
 * What Approve / Reject does, said right under the buttons (Rafael 2026-11-04: "the Reject here is for
 * the Call Center right?"). Research: name the outcome before the click (NN/g, GNOME HIG), and keep
 * information about the task in the page itself, not a banner (GOV.UK notification banner guidance).
 * Who hears about it, where the decision lands, and what Reject stops. Read for both buttons.
 */
const decisionEffect = (origin: BorrowerOrigin | null | undefined, branches: string[] | null | undefined): string => {
  const where = branches && branches.length > 1 ? ` at ${listBranches(branches)}` : "";
  return origin
    ? `Tells Call Center whether this application went through, and allows or stops new loans${where}. A rejection stays until they are approved again.`
    : `Allows or stops new loans${where}. A rejection stays until they are approved again.`;
};

/** What the decision group is about, said above its buttons: the Call Center application, or the borrower. */
const decisionLabel = (origin: BorrowerOrigin | null | undefined): string =>
  origin ? `Call Center application ${applicationNumber(origin.application_id)}` : "Borrower decision";

/**
 * When the person has records at other branches, a decision is written to all of them (2026-11-04):
 * the prompt says where, and its button names the count. Null for one branch: today's prompt.
 */
const decisionReach = (status: BorrowerDecision["status"], name: string, branches: string[] | null | undefined) => {
  if (!branches || branches.length < 2) return null;
  const verb = status === "approved" ? "approves" : "rejects";
  const count = branches.length === 2 ? "both" : `all ${branches.length}`;
  return {
    text: `This ${verb} ${name} at ${listBranches(branches)}.`,
    confirm: `${PROMPT[status].confirm} at ${count} branches`,
  };
};

/**
 * Approve / Reject through Fuerte's decision prompt. The decision is held here, not written into the
 * page's borrower: a new borrower object would re-run the Details form's load and overwrite edits
 * that have not been saved yet.
 */
const useDecisionPrompt = (
  borrowerId: number,
  initial: BorrowerDecision | null,
  onDecided?: (decision: BorrowerDecision) => void,
  reach: { name: string; branches?: string[] | null } = { name: "" },
) => {
  const { decide } = useBorrowerDecision();
  const [decision, setDecision] = useState<BorrowerDecision | null>(initial);
  const [busy, setBusy] = useState<BorrowerDecision["status"] | null>(null);
  const [staleApproved, setStaleApproved] = useState(false);

  const record = async (status: BorrowerDecision["status"]) => {
    if (busy) return;
    const changingReason = status === "rejected" && decision?.status === "rejected";
    const prompt = changingReason ? PROMPT.reason : PROMPT[status];
    const wide = changingReason ? null : decisionReach(status, reach.name, reach.branches);
    const reason = await showDecisionNotePrompt(
      prompt.title,
      prompt.label,
      wide?.confirm ?? prompt.confirm,
      wide ? { ...prompt.options, text: wide.text, focusCancel: true } : prompt.options,
    );
    if (reason === null) return;
    setBusy(status);
    const closeProcessing = showProcessingModal(prompt.working);
    try {
      const saved = await decide(borrowerId, status, reason);
      if (saved === ALREADY_APPROVED) {
        // Approved meanwhile (another tab or user): say so here, instead of leaving Approve on a stale page.
        setStaleApproved(true);
      } else if (saved) {
        setDecision(saved);
        onDecided?.(saved);
      }
    } finally {
      closeProcessing();
      setBusy(null);
    }
  };

  return { decision, busy, record, staleApproved };
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
const RejectedNotice: React.FC<{ decision: BorrowerDecision; onlyRejectingBranchMayApprove?: boolean }> = ({ decision, onlyRejectingBranchMayApprove = false }) => {
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
          {/* Staff who may not lift it are not told to approve: the branch that rejected must (2026-11-04). */}
          {onlyRejectingBranchMayApprove
            ? "To give a loan, the branch that rejected this borrower, or the Owner, must approve them first."
            : "To give a loan, approve this borrower first."}
        </p>
      </div>
    </section>
  );
};

/**
 * Where the borrower came from (Rafael 2026-10-23): made from an application -- Marketing's
 * applicant, through Call Center -- with the way to that application, or created directly. It is
 * why Approve / Reject is there or not: those tell Call Center whether its applicant pushed through.
 */
const OriginTag: React.FC<{ origin: BorrowerOrigin | null | undefined }> = ({ origin }) => {
  if (!origin) {
    return (
      <span data-testid="borrower-origin" className="inline-flex items-center gap-1.5 text-sm text-black/70 dark:text-bodydark">
        <UserPlus aria-hidden="true" size={15} className="shrink-0" />
        Created directly
      </span>
    );
  }
  const number = applicationNumber(origin.application_id);
  const channel = origin.channel ? CHANNEL_LABELS[origin.channel] : undefined;
  return (
    <Link
      data-testid="borrower-origin"
      href={`/applications/${origin.application_id}`}
      prefetch={false}
      className={`${TARGET} ${LINK_FOCUS} inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:underline dark:text-white`}
    >
      <FileText aria-hidden="true" size={15} className="shrink-0" />
      <span className="break-words">
        From application <span className="tabular-nums">{number}</span>
        {channel && <span className="font-normal text-black/70 dark:text-bodydark"> · {channel}</span>}
      </span>
    </Link>
  );
};

/** The branch as its small chip plus its name in plain text, the Payer stamp, the decision stamp, and the decision's line. */
const StatusLine: React.FC<{ borrower: BorrowerRowInfo; decision: BorrowerDecision | null }> = ({ borrower, decision }) => {
  const onlyRejectingBranchMayApprove = Boolean(borrower.approve_refusal);
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
        <OriginTag origin={borrower.origin} />
      </div>
      {decision?.status === "rejected" && <RejectedNotice decision={decision} onlyRejectingBranchMayApprove={onlyRejectingBranchMayApprove} />}
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
 * line (branch, Payer, decision, where the borrower came from), up to three facts, and the actions.
 * Everything wraps and nothing is cut at 360px. Approve / Reject record a decision, on a borrower
 * made from an application (or one already decided). A rejected borrower cannot borrow: the server
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
  const name = borrowerDisplayName(borrower);
  const { decision, busy, record, staleApproved } = useDecisionPrompt(Number(borrower.id), borrower.decision ?? null, onDecided, {
    name,
    branches: borrower.decision_branches,
  });
  // Approve / Reject is for borrowers made from an application (Rafael 2026-10-23): a borrower created
  // directly gets none, unless it already has a decision from before, which can still be changed (the
  // server's BorrowerDecisionService::DIRECT says the same).
  const mayDecide = Boolean(borrower.origin) || decision !== null;
  // Rejected at a branch this user cannot work: the server would refuse Approve, so it is shown
  // unavailable with the server's own sentence, before anyone confirms (Rafael 2026-11-04).
  const approveRefusal = borrower.approve_refusal ?? null;
  const refusalId = useId();
  const effectId = useId();
  const labelId = useId();

  return (
    <HeaderShell name={name} back={back}>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 grow basis-[28rem]">
          <h2 className={TITLE}>{name}</h2>
          <StatusLine borrower={borrower} decision={decision} />
          <Facts borrower={borrower} />
          <BranchRecords records={borrower.branch_records} person={borrower} />
        </div>

        {/* `relative`: the More menu opens against this row, so it never leaves the screen. No `disabled`
            while saving: the processing modal already blocks the page, and a disabled button would drop
            the focus the prompt hands back; `busy` stops a second click. Two groups of actions, each
            named for what it acts on (Rafael 2026-11-04): this one decides the borrower; the branch
            records box under the name has its own (Open, Remove copy). */}
        <div className="relative flex flex-wrap items-center gap-2">
          {mayDecide && (
            // `contents`: the group names only the decision (label and buttons), not More, while its
            // children still lay out in this row.
            <div role="group" aria-labelledby={labelId} className="contents">
              <p id={labelId} data-testid="decision-label" className={`w-0 min-w-full ${SECTION_LABEL}`}>
                {decisionLabel(borrower.origin)}
              </p>
              {/* Already approved: no Approve. The pill beside the name says so; the server refuses a second. */}
              {decision?.status === "approved" || staleApproved ? null : approveRefusal ? (
                <button type="button" aria-disabled="true" aria-describedby={`${refusalId} ${effectId}`} className={`${BUTTON} ${UNAVAILABLE}`}>
                  <Check aria-hidden="true" size={16} strokeWidth={2.75} className="shrink-0" />
                  Approve borrower
                </button>
              ) : (
                <button type="button" className={BUTTON} onClick={() => record("approved")} aria-busy={busy === "approved"} aria-describedby={effectId}>
                  <Check aria-hidden="true" size={16} strokeWidth={2.75} className="shrink-0 text-success dark:text-meta-3" />
                  Approve borrower
                </button>
              )}
              {/* Already rejected: rejecting again is how the reason is changed, so the button says that. */}
              <button type="button" className={BUTTON} onClick={() => record("rejected")} aria-busy={busy === "rejected"} aria-describedby={effectId}>
                <X aria-hidden="true" size={16} strokeWidth={2.75} className="shrink-0 text-danger" />
                {decision?.status === "rejected" ? "Change reason" : "Reject borrower"}
              </button>
            </div>
          )}
          {/* On a copy, its delete lives in the branch records box as "Remove this copy": one button, not two. */}
          <BorrowerMoreMenu
            borrower={borrower}
            summaryClassName={BUTTON}
            showDelete={!borrower.branch_records?.some((r) => r.is_this && !r.is_original)}
          />
          {mayDecide && (
            // `w-0 min-w-full`: the sentence wraps to the buttons' width instead of widening the column,
            // which would push the whole action group under the name (review 2026-11-04).
            <p id={effectId} data-testid="decision-effect" className="w-0 min-w-full text-sm text-body dark:text-bodydark">
              {decisionEffect(borrower.origin, borrower.decision_branches)}
            </p>
          )}
          {staleApproved && (
            <p role="status" data-testid="decision-stale" className="w-0 min-w-full text-sm font-medium text-black dark:text-white">
              Someone approved this person meanwhile. Reload the page to see it.
            </p>
          )}
          {mayDecide && approveRefusal && (
            <p id={refusalId} data-testid="approve-refusal" className="w-0 min-w-full text-sm text-body dark:text-bodydark">
              {approveRefusal}
            </p>
          )}
        </div>
      </div>
    </HeaderShell>
  );
};

export default BorrowerHeader;
