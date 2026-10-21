import React from 'react';
import { PlusCircle, RefreshCw, type Icon } from 'react-feather';
import { KIND_LABELS } from '@/utils/applicationForm';
import type { LoanApplicationKind } from '@/utils/DataTypes';

/** The glyph each returning-borrower kind carries; a new applicant shows no badge at all. */
export const KIND_ICONS: Readonly<Record<Exclude<LoanApplicationKind, 'new'>, Icon>> = {
  renewal: RefreshCw,
  additional: PlusCircle,
};

/*
 * A squared tag, not a round pill: the round pills are statuses (where it stands), this is what
 * was asked for, and the two sit side by side. The glyph and the word carry it, never the colour
 * alone; the label stays black or white for contrast, the colour lives in the glyph and the ring.
 */
const LOOK: Readonly<Record<Exclude<LoanApplicationKind, 'new'>, string>> = {
  // The brand's two colours: the green loop goes round again, the gold plus adds on top.
  renewal: 'text-primary ring-primary/40',
  additional: 'text-accent ring-accent/60',
};

/**
 * "Renewal" or "Additional" beside an applicant: a borrower already, applying again. Nothing for a
 * new applicant, so the list reads exactly as before for them. data-tag lets a click on it open the
 * row in the Applications list, as the status pill does.
 */
const KindBadge: React.FC<{ kind: LoanApplicationKind | null | undefined }> = ({ kind }) => {
  if (!kind || kind === 'new') return null;
  const KindIcon = KIND_ICONS[kind];
  return (
    <span
      data-tag="allowRowEvents"
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm bg-white px-1.5 py-0.5 text-[11px] font-semibold uppercase leading-none tracking-wide ring-1 ring-inset dark:bg-boxdark ${LOOK[kind]}`}
    >
      <KindIcon aria-hidden="true" size={11} strokeWidth={2.5} className="pointer-events-none shrink-0" />
      <span className="pointer-events-none text-black dark:text-white">{KIND_LABELS[kind]}</span>
    </span>
  );
};

export default KindBadge;
