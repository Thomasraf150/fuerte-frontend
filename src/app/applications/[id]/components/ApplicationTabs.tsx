"use client";

import React, { useId, useRef } from 'react';
import { Clock, FileText } from 'react-feather';

export type ApplicationTab = 'application' | 'history';

const TABS: { key: ApplicationTab; label: string; Icon: typeof Clock }[] = [
  { key: 'application', label: 'Application', Icon: FileText },
  { key: 'history', label: 'History', Icon: Clock },
];

/** Where each key moves the focus to, from the open tab's index. */
const KEY_MOVES: Record<string, (index: number, last: number) => number> = {
  ArrowRight: (index, last) => (index === last ? 0 : index + 1),
  ArrowLeft: (index, last) => (index === 0 ? last : index - 1),
  Home: () => 0,
  End: (_index, last) => last,
};

interface TabButtonProps {
  base: string;
  tab: (typeof TABS)[number];
  active: boolean;
  /** How many History lines there are, shown beside its name. */
  count: number;
  onSelect: (tab: ApplicationTab) => void;
  buttonRef: (element: HTMLButtonElement | null) => void;
}

/** One tab: 48px tall, half the width on a phone; only the open one is a tab stop. */
const TabButton: React.FC<TabButtonProps> = ({ base, tab: { key, label, Icon }, active, count, onSelect, buttonRef }) => (
  <button
    ref={buttonRef}
    type="button"
    role="tab"
    id={`${base}-${key}-tab`}
    aria-selected={active}
    aria-controls={`${base}-${key}-panel`}
    tabIndex={active ? 0 : -1}
    onClick={() => onSelect(key)}
    className={`-mb-px flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 px-4 text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 sm:flex-none sm:justify-start ${
      active
        ? 'border-primary font-semibold text-primary dark:border-olive-300 dark:text-olive-300'
        : 'border-transparent text-body hover:text-primary dark:text-bodydark dark:hover:text-olive-300'
    }`}
  >
    <Icon aria-hidden="true" size={16} />
    {label}
    {key === 'history' && count > 0 && (
      <span className="rounded-full bg-whiten px-2 py-0.5 text-xs font-semibold tabular-nums text-body dark:bg-meta-4 dark:text-bodydark">
        <span className="sr-only">, </span>
        {count}
        <span className="sr-only"> {count === 1 ? 'line' : 'lines'}</span>
      </span>
    )}
  </button>
);

interface ApplicationTabsProps {
  selected: ApplicationTab;
  onSelect: (tab: ApplicationTab) => void;
  /** How many History lines there are, shown beside its name. */
  historyCount: number;
  application: React.ReactNode;
  history: React.ReactNode;
}

/**
 * The application page's two tabs (2026-10-14): the application itself -- the form, or the record once
 * it is a borrower, with its side panel -- and its History. WAI-ARIA tabs: one tab stop, Left / Right /
 * Home / End move between the tabs and open them (automatic activation), and Tab goes on into the open
 * panel. Both panels stay mounted, so the form keeps what was typed and not yet saved while History is
 * open; the closed one is hidden.
 */
export const ApplicationTabs: React.FC<ApplicationTabsProps> = ({ selected, onSelect, historyCount, application, history }) => {
  const base = useId();
  const buttons = useRef<Partial<Record<ApplicationTab, HTMLButtonElement | null>>>({});

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const move = KEY_MOVES[event.key];
    if (!move) return;
    event.preventDefault();
    const next = TABS[move(TABS.findIndex((tab) => tab.key === selected), TABS.length - 1)].key;
    onSelect(next);
    buttons.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Application sections" onKeyDown={onKeyDown} className="flex border-b border-stroke dark:border-strokedark">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            base={base}
            tab={tab}
            active={tab.key === selected}
            count={historyCount}
            onSelect={onSelect}
            buttonRef={(element) => {
              buttons.current[tab.key] = element;
            }}
          />
        ))}
      </div>
      {TABS.map(({ key }) => (
        <div
          key={key}
          role="tabpanel"
          id={`${base}-${key}-panel`}
          aria-labelledby={`${base}-${key}-tab`}
          hidden={key !== selected}
          // History holds nothing to focus, so the panel itself takes the Tab after the tabs (WAI-ARIA).
          tabIndex={key === 'history' ? 0 : undefined}
          className="pt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {key === 'application' ? application : history}
        </div>
      ))}
    </div>
  );
};
