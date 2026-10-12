'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import BrandLockup from '@/components/Brand/BrandLockup';

/**
 * Catches an error thrown while rendering any page below the root layout. Logs the digest and the
 * error NAME only: messages can carry record data, and the digest is what ties this tab to the
 * server log.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[page error]', { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center bg-whiten px-4 py-10 text-center dark:bg-boxdark-2"
    >
      <span className="inline-flex bg-black px-5 py-4 dark:ring-1 dark:ring-strokedark">
        <BrandLockup />
      </span>

      <h1 className="mt-10 max-w-md font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-black sm:text-[34px] dark:text-white">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-base text-body dark:text-bodydark">
        This page hit a problem. Nothing you saved was lost. Try again, or go back to the dashboard.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-12 items-center justify-center border border-primary bg-primary px-6 text-sm font-semibold text-white transition-colors hover:border-olive-700 hover:bg-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 lg:min-h-10"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center border border-field bg-white px-6 text-sm font-semibold text-black transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 lg:min-h-10 dark:border-field-dark dark:bg-boxdark dark:text-white"
        >
          Back to the Dashboard
        </Link>
      </div>
    </main>
  );
}
