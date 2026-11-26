"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import { ChevronRight, Search } from 'react-feather';
import Button from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import {
  GLOBAL_SEARCH_MIN_LENGTH,
  GLOBAL_SEARCH_MORE_LIMIT,
  GLOBAL_SEARCH_PLACEHOLDER,
  globalSearchHref,
  type GlobalSearchGroup,
} from '@/graphql/GlobalSearchQuery';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

const groupId = (key: string) => `search-group-${key}`;

/** "+" after the count when the server holds more rows than it sent. */
const countLabel = (group: GlobalSearchGroup) => `${group.hits.length}${group.has_more ? '+' : ''}`;

/**
 * The groups that found something, as a row of jump links with counts: with up to 15 record
 * types, a reader sees at a glance where the term matched before scrolling (results grouped by
 * type, each with its own "Show more": M-Files, Funnelback).
 */
const GroupIndex: React.FC<{ groups: GlobalSearchGroup[] }> = ({ groups }) => (
  <nav aria-label="Jump to a result group" className="flex flex-wrap gap-2">
    {groups.map((group) => (
      <a
        key={group.key}
        href={`#${groupId(group.key)}`}
        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-stroke bg-white px-4 text-sm font-semibold text-black hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:min-h-10 dark:border-strokedark dark:bg-boxdark dark:text-white"
      >
        {group.title}
        <span className="rounded-full bg-whiten px-2 text-xs tabular-nums text-body dark:bg-meta-4 dark:text-bodydark">{countLabel(group)}</span>
      </a>
    ))}
  </nav>
);

interface GroupProps {
  group: GlobalSearchGroup;
  onShowMore: (key: string) => void;
  loadingMore: boolean;
  moreError: string | null;
  /** Already reloaded at the maximum: more match than the server will list, so say so instead. */
  atMax: boolean;
}

/** The footer's sentence: there is more, or there is more than the page will ever list. */
const moreNote = (group: GlobalSearchGroup, atMax: boolean) =>
  atMax
    ? `Showing the first ${GLOBAL_SEARCH_MORE_LIMIT}. Add more of the name, number or ref to narrow it.`
    : `More ${group.title.toLowerCase()} match.`;

/** One titled group of hits. Each row is one link to its record; a state tag sits beside the title. */
const Group: React.FC<GroupProps> = ({ group, onShowMore, loadingMore, moreError, atMax }) => (
  <Card aria-labelledby={`${groupId(group.key)}-title`} id={groupId(group.key)} className="scroll-mt-24">
    <CardHeader as="h2" id={`${groupId(group.key)}-title`} title={`${group.title} (${countLabel(group)})`} />
    <ul className="divide-y divide-stroke dark:divide-strokedark">
      {group.hits.map((hit) => (
        <li key={`${hit.kind}-${hit.id}`}>
          <Link
            href={globalSearchHref(hit)}
            className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-whiten focus-visible:bg-whiten focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 dark:hover:bg-meta-4"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-black dark:text-white">{hit.title}</span>
                {hit.tag && <StatusBadge tone={hit.tag === 'Cancelled' ? 'closed' : 'neutral'}>{hit.tag}</StatusBadge>}
              </span>
              {hit.detail && <span className="block text-sm text-body dark:text-bodydark">{hit.detail}</span>}
            </span>
            <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-body dark:text-bodydark" />
          </Link>
        </li>
      ))}
    </ul>
    {(group.has_more || moreError) && (
      <div className="flex flex-col gap-2 border-t border-stroke px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-strokedark">
        {moreError ? <p role="alert" className="text-sm text-danger">{moreError}</p> : <span className="text-sm text-body dark:text-bodydark">{moreNote(group, atMax)}</span>}
        {group.has_more && !atMax && (
          <Button variant="secondary" onClick={() => onShowMore(group.key)} disabled={loadingMore} aria-busy={loadingMore} className="min-h-12 lg:min-h-10">
            {loadingMore ? 'Loading…' : `Show more ${group.title.toLowerCase()}`}
          </Button>
        )}
      </div>
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

/** Nothing anywhere: say what was searched and what else to try, never a blank page. */
const NothingFound: React.FC<{ term: string; searched: string[] }> = ({ term, searched }) => (
  <Card>
    <div className="space-y-2 px-4 py-5 text-sm text-body dark:text-bodydark">
      <p className="font-semibold text-black dark:text-white">Nothing matches “{term}”.</p>
      <p>Searched: {searched.join(', ')}.</p>
      <p>Try part of a name, the last 4 digits of a mobile number, or just the number part of a ref.</p>
    </div>
  </Card>
);

/**
 * The /search page body: a labelled search box (the same term as the top bar's), a jump row of the
 * groups that matched, and those groups. The term lives in the URL (?q=), so Back and a shared link
 * both work.
 */
const SearchResults: React.FC = () => {
  const router = useRouter();
  const q = useSearchParams()?.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const { result, loading, error, retry, showMore, moreLoading, moreError, expanded } = useGlobalSearch(q);
  useEffect(() => setDraft(q), [q]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(draft.trim())}`);
  };
  const found = result?.groups.filter((group) => group.hits.length > 0) ?? [];

  return (
    <div className="space-y-5">
      <form role="search" onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="search-page-term" className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
            Search everything
          </label>
          <input
            id="search-page-term"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={GLOBAL_SEARCH_PLACEHOLDER}
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
      ) : result && result.groups.length === 0 ? (
        <p role="status" className="text-sm text-body dark:text-bodydark">
          Your account has no branch to search yet. Ask an admin to give it branch access.
        </p>
      ) : result && found.length === 0 ? (
        <NothingFound term={result.term} searched={result.groups.map((group) => group.title.toLowerCase())} />
      ) : result ? (
        <div className="space-y-4" aria-busy={loading}>
          <GroupIndex groups={found} />
          {found.map((group) => (
            <Group
              key={group.key}
              group={group}
              onShowMore={showMore}
              loadingMore={moreLoading === group.key}
              moreError={moreError?.key === group.key ? moreError.message : null}
              atMax={expanded.includes(group.key)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SearchResults;
