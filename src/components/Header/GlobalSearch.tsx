"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useStore } from 'zustand';
import { Search } from 'react-feather';
import { useAuthStore } from '@/store';
import Button from '@/components/Button';

/**
 * The top bar's universal search (UI modernisation B, Phase 5; after CHR's). Not for Call Center:
 * its server gate refuses the search anyway, and its pages are the Applications pages only.
 */
const useShowsSearch = (): boolean => useStore(useAuthStore, (state) => state.user?.role?.code !== 'CALLCTR');

/**
 * From `lg`, on the top bar's left: a labelled search box and a visible Search button, as in CHR
 * (Rafael 2026-10-07). Enter or the button opens /search?q=. A box wide enough for a full name
 * (NN/g: a box too narrow makes the query scroll).
 */
export const GlobalSearchBox: React.FC = () => {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const shows = useShowsSearch();
  if (!shows) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <form role="search" onSubmit={submit} className="hidden items-center gap-2 lg:flex">
      <label htmlFor="global-search" className="sr-only">Search borrowers, loans and vouchers</label>
      <div className="relative">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body dark:text-bodydark" />
        <input
          id="global-search"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search borrowers, loans, vouchers"
          className="h-10 w-64 rounded-lg border border-field bg-white pl-9 pr-3 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:w-96 dark:border-field-dark dark:bg-form-input dark:text-white"
        />
      </div>
      <Button type="submit" variant="secondary">Search</Button>
    </form>
  );
};

/**
 * Below `lg`, beside the bell: a 48px "Search" link to /search, the magnifier AND the word (NN/g
 * icon usability: a label beside the icon), as CHR does below lg.
 */
export const GlobalSearchLink: React.FC = () => {
  const shows = useShowsSearch();
  if (!shows) return null;
  return (
    <Link
      href="/search"
      className="flex h-12 items-center gap-1.5 border border-field bg-white px-2.5 text-sm font-semibold text-black hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden dark:border-field-dark dark:bg-boxdark dark:text-white"
    >
      <Search size={18} aria-hidden="true" className="shrink-0" />
      Search
    </Link>
  );
};
