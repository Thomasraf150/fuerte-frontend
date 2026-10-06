import React from 'react';
import { AlertTriangle, Check, Clock, X, type Icon } from 'react-feather';
import { outcomeLabel, outcomeTone, type OutcomeTone } from '@/utils/applicationOutcome';

/*
 * One pill, five levels of loud. The word is always there, so colour is never the only signal,
 * and the icon gives each tone a shape too.
 *   - waiting and progress are quiet: an outline on white, a clock or an olive dot;
 *   - success is a green tint with a check (the label stays ink: success text on its tint is
 *     under 4.5:1 at text-xs, as ApplicationStatusPill found);
 *   - warning is an amber tint with a triangle;
 *   - danger is the one filled pill, white on danger (5.91:1), like the Rejected stamp.
 * Tokens only: the red-* and gray-* shades are dead in this Tailwind config.
 */
const TONE: Record<OutcomeTone, { box: string; icon: Icon | null; iconClass: string }> = {
  waiting: {
    box: 'bg-white text-black ring-stroke dark:bg-boxdark dark:text-white dark:ring-strokedark',
    icon: Clock,
    iconClass: 'text-bodydark2',
  },
  progress: {
    box: 'bg-primary/10 text-black ring-primary/40 dark:bg-primary/20 dark:text-white',
    icon: null,
    iconClass: '',
  },
  success: {
    box: 'bg-success/10 text-black ring-success/50 dark:text-white',
    icon: Check,
    iconClass: 'text-success dark:text-meta-3',
  },
  warning: {
    box: 'bg-warning/15 text-black ring-warning/60 dark:text-white',
    icon: AlertTriangle,
    iconClass: 'text-black dark:text-warning',
  },
  danger: {
    box: 'bg-danger text-white ring-danger',
    icon: X,
    iconClass: '',
  },
};

interface OutcomePillProps {
  /** The server's outcome key. Nothing is drawn without one (a reply from before the field existed). */
  outcome: string | null | undefined;
  /** The server's words ("Rejected by Marketing"); the key's own label when there are none. */
  label?: string | null;
}

/**
 * Where an application ended up: the Applications list's Outcome column and the application's
 * header. data-tag="allowRowEvents" lets a click on it open the row in the list (see CellText in
 * ApplicationColumns); its parts let clicks through to it. `data-outcome` names the key for tests
 * and for styling hooks.
 */
const OutcomePill: React.FC<OutcomePillProps> = ({ outcome, label }) => {
  if (!outcome) return null;
  const tone = TONE[outcomeTone(outcome)];
  const words = label?.trim() || outcomeLabel(outcome);
  const ToneIcon = tone.icon;
  return (
    <span
      data-tag="allowRowEvents"
      data-outcome={outcome}
      title={words}
      className={`inline-flex min-w-0 max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone.box}`}
    >
      {ToneIcon ? (
        <ToneIcon aria-hidden="true" size={12} strokeWidth={2.75} className={`pointer-events-none shrink-0 ${tone.iconClass}`} />
      ) : (
        <span aria-hidden="true" className="pointer-events-none h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      )}
      <span className="pointer-events-none min-w-0 overflow-hidden text-ellipsis">{words}</span>
    </span>
  );
};

export default OutcomePill;
