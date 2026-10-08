"use client";

import React, { useId } from 'react';

interface Props {
  title: string;
  renderButton: () => React.ReactNode;
  searchQuery: string;
  onSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  enableSearch: boolean;
  placeholder: string;
  /** The plural noun, for the search box's name when no placeholder says what it searches. */
  plural: string;
  /** A visible label above the search box ("Search borrowers"); without it the box is named by aria-label. */
  label?: string;
}

/**
 * The list header (shared table v2 item 2): the optional title, then the search box and the
 * page's button slot. The old one used Bootstrap's row/col, which do not exist in this app.
 * The search box is full width on phones and 48px tall there, 40px from `lg`, and has an
 * accessible name.
 */
const TableHeader: React.FC<Props> = ({ title, renderButton, searchQuery, onSearch, enableSearch, placeholder, plural, label }) => {
  const id = useId();
  return (
    <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
      {title ? <h4 className="text-lg font-semibold text-black dark:text-white">{title}</h4> : <span className="hidden sm:block" />}
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        {enableSearch && (
          <div className="flex w-full flex-col gap-1.5 sm:w-auto">
            {label && <label htmlFor={id} className="text-sm font-medium text-black dark:text-white">{label}</label>}
            <input
              id={id}
              type="search"
              aria-label={label ? undefined : placeholder || `Search ${plural}`}
              placeholder={placeholder}
              value={searchQuery}
              onChange={onSearch}
              className="h-12 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-72 lg:h-10 dark:border-field-dark dark:bg-form-input dark:text-white dark:placeholder:text-bodydark"
            />
          </div>
        )}
        {renderButton()}
      </div>
    </div>
  );
};

export default React.memo(TableHeader);
