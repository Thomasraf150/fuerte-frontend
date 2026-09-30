"use client";

import React from 'react';

/** A load that failed, in words the page can show, with a way to try again. Used by the list and New application. */
const LoadError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex flex-col gap-3 rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-black dark:text-white sm:flex-row sm:items-center sm:justify-between">
    <p className="min-w-0 break-words">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="min-h-12 shrink-0 rounded bg-danger px-5 font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark md:min-h-9"
    >
      Retry
    </button>
  </div>
);

export default LoadError;
