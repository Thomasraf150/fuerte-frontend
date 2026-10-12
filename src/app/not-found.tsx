import Link from 'next/link';
import BrandLockup from '@/components/Brand/BrandLockup';

/**
 * The branded 404 (an unknown URL, or notFound() from a page). Renders inside the root layout's
 * AppShell, so there is no sidebar here: the lockup sits on an ink tile because it is drawn in
 * cream for the dark sidebar and would vanish on the cream page ground.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-whiten px-4 py-10 text-center dark:bg-boxdark-2">
      <span className="inline-flex bg-black px-5 py-4 dark:ring-1 dark:ring-strokedark">
        <BrandLockup />
      </span>

      <p aria-hidden="true" className="mt-10 font-display text-7xl font-semibold leading-none text-secondary sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 max-w-md font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-black sm:text-[34px] dark:text-white">
        We can&apos;t find that page
      </h1>
      <p className="mt-3 max-w-sm text-base text-body dark:text-bodydark">
        The link may be old or mistyped. Head back to the dashboard and pick up from there.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center border border-primary bg-primary px-6 text-sm font-semibold text-white transition-colors hover:border-olive-700 hover:bg-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 lg:min-h-10"
      >
        Back to the Dashboard
      </Link>
    </main>
  );
}
