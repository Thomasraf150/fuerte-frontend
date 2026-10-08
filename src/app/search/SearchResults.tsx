"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import { ChevronRight, Search } from 'react-feather';
import Button from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { GLOBAL_SEARCH_MIN_LENGTH, globalSearchHref, type GlobalSearchHit } from '@/graphql/GlobalSearchQuery';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

/** One titled group of hits: Borrowers, Loans or Vouchers. Each row is one link to its record. */
const Group: React.FC<{ title: string; empty: string; hits: GlobalSearchHit[] }> = ({ title, empty, hits }) => (
  <Card aria-labelledby={`search-${title}`}>
    <CardHeader as="h2" id={`search-${title}`} title={title} />
    {hits.length === 0 ? (
      <p className="px-4 py-4 text-sm text-body dark:text-bodydark">{empty}</p>
    ) : (
      <ul className="divide-y divide-stroke dark:divide-strokedark">
        {hits.map((hit) => (
          <li key={`${hit.kind}-${hit.id}`}>
            <Link href={globalSearchHref(hit)} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-whiten focus-visible:bg-whiten focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 dark:hover:bg-meta-4">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-black dark:text-white">{hit.title}</span>
                {hit.detail && <span className="block text-sm text-body dark:text-bodydark">{hit.detail}</span>}
              </span>
              <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-body dark:text-bodydark" />
            </Link>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

/** Placeholder rows while the search runs (it is a list, so a skeleton fits: Carbon / NN/g). */
const Loading: React.FC = () => (
  <div role="status" className="space-y-3">
    <span className="sr-only">Searching…</span>
    {[0, 1, 2].map((i) => (
      <div key={i} aria-hidden="true" className="h-14 animate-pulse rounded-lg bg-stroke motion-reduce:animate-none dark:bg-meta-4" />
    ))}
  </div>
);

/**
 * The /search page body: a labelled search box (the same term as the top bar's) and three titled
 * groups. The term lives in the URL (?q=), so Back and a shared link both work.
 */
const SearchResults: React.FC = () => {
  const router = useRouter();
  const q = useSearchParams()?.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const { result, loading, error, retry } = useGlobalSearch(q);
  useEffect(() => setDraft(q), [q]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(draft.trim())}`);
  };

  return (
    <div className="space-y-5">
      <form role="search" onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="search-page-term" className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
            Search borrowers, loans and vouchers
          </label>
          <input
            id="search-page-term"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Name, mobile no., chief, loan ref or voucher no."
            className="h-12 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:h-11 dark:border-field-dark dark:bg-form-input dark:text-white"
          />
        </div>
        <Button variant="primary" type="submit"><Search size={16} aria-hidden="true" />Search</Button>
      </form>

      {q.trim().length < GLOBAL_SEARCH_MIN_LENGTH ? (
        <p className="text-sm text-body dark:text-bodydark">Type at least {GLOBAL_SEARCH_MIN_LENGTH} letters or numbers, then press Search.</p>
      ) : loading && !result ? (
        <Loading />
      ) : error ? (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-danger bg-danger/10 p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button variant="danger" onClick={retry}>Retry</Button>
        </div>
      ) : result ? (
        <div className="space-y-4" aria-busy={loading}>
          <Group title="Borrowers" empty="No borrowers found." hits={result.borrowers} />
          <Group title="Loans" empty="No loans found." hits={result.loans} />
          {result.vouchers_included && <Group title="Vouchers" empty="No vouchers found." hits={result.vouchers} />}
        </div>
      ) : null}
    </div>
  );
};

export default SearchResults;
