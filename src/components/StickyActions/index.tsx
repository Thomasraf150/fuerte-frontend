import React from 'react';

interface Props {
  /** The form has changes not saved yet (react-hook-form `formState.isDirty`). */
  dirty?: boolean;
  children: React.ReactNode;
}

/**
 * A long form's own buttons, kept on screen while the form scrolls (UI modernisation B,
 * 2026-10-07). The SAME buttons, in the same order and place (bottom-right), so nothing is learnt
 * again; it only stops the page from hiding them. "Not saved yet" tells the user the state
 * ("always keep users informed", NN/g heuristic 1).
 *
 * WCAG 2.4.11 (Focus Not Obscured) names sticky footers as a cause of hidden focus: the scrolling
 * container (components/Layouts/DefaultLayout.tsx) carries a bottom scroll padding taller than
 * this bar, so a field scrolled into view for focus stops above it. One row on phones too, to
 * keep the screen mostly content.
 */
const StickyActions: React.FC<Props> = ({ dirty = false, children }) => (
  <div className="sticky bottom-0 z-20 mt-4 border-t border-stroke bg-white/95 px-3 py-2.5 shadow-[0_-4px_14px_rgba(40,38,26,0.08)] backdrop-blur-sm dark:border-strokedark dark:bg-boxdark/95 sm:px-4">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      {/* A div, not a <p>: form code and tests read a form's <p>s as its error messages. */}
      <div role="status" className="flex items-center gap-2 text-sm text-body dark:text-bodydark">
        {dirty && (
          <>
            <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            Not saved yet
          </>
        )}
      </div>
      <div className="ml-auto flex flex-1 justify-end gap-2 sm:flex-none sm:gap-3 [&>*]:flex-1 sm:[&>*]:flex-none">
        {children}
      </div>
    </div>
  </div>
);

export default StickyActions;
