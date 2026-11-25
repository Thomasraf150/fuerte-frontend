"use client";

import React, { useMemo, useState } from 'react';
import { ChevronRight, Globe } from 'react-feather';
import BranchBadge from '@/components/BranchBadge';
import { SkeletonBlock } from '@/components/LoadingStates';
import { DataLoanProceedAcctData } from '@/utils/DataTypes';

/** The accounts the form requires (LoanProcSettingsForm), by the description they are saved under. */
const REQUIRED = [
  'notes receivable', 'outstanding balance', 'udi', 'processing', 'insurance', 'insurance mfee', 'collection',
  'notarial', 'rebates', 'agent fee', 'penalty', 'addon amount', 'addon udi', 'cash in bank', 'cash on hand',
];

interface BranchRow {
  key: string;             // branch_sub_id, or 'global'
  branchName: string | null;
  subName: string | null;
  own: Set<string>;        // descriptions this branch maps itself
}

type Source = 'own' | 'global' | 'none';

/**
 * Loan Proceed Settings, one row per branch (Raf, 2026-11-25): the old list had a row per account,
 * so a branch's fifteen accounts were spread over fifteen rows. Global Defaults is pinned on top;
 * a branch with no account of its own for something uses the Global Default (LoanProceedAccountResolver).
 */
const LoanProcBranchList: React.FC<{ rows: DataLoanProceedAcctData[] | undefined; loading: boolean; onOpen: (key: string) => void }> = ({ rows, loading, onOpen }) => {
  const [search, setSearch] = useState('');

  const { global, branches } = useMemo(() => {
    const byKey = new Map<string, BranchRow>();
    (rows ?? []).forEach((r) => {
      const key = r.branch_sub_id ? String(r.branch_sub_id) : 'global';
      const row = byKey.get(key) ?? {
        key,
        branchName: (r.branch_sub as unknown as { branch?: { name?: string } } | null)?.branch?.name ?? null,
        subName: r.branch_sub?.name ?? null,
        own: new Set<string>(),
      };
      row.own.add(r.description);
      byKey.set(key, row);
    });
    const list = Array.from(byKey.values()).filter((b) => b.key !== 'global')
      .sort((a, b) => (a.subName ?? '').localeCompare(b.subName ?? ''));
    return { global: byKey.get('global') ?? null, branches: list };
  }, [rows]);

  const source = (b: BranchRow, description: string): Source =>
    b.own.has(description) ? 'own' : global?.own.has(description) ? 'global' : 'none';

  const term = search.trim().toLowerCase();
  const shown = term
    ? branches.filter((b) => `${b.subName ?? ''} ${b.branchName ?? ''}`.toLowerCase().includes(term))
    : branches;

  if (loading && !rows) return <SkeletonBlock rows={6} label="Loading the loan proceed settings…" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <label htmlFor="lps-branch-search" className="sr-only">Search branches</label>
        <input id="lps-branch-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search branches…"
          className="w-full max-w-xs rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm dark:border-strokedark" />
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-stroke dark:border-strokedark">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-1 bg-gray-2 text-xs uppercase tracking-wide text-body dark:bg-meta-4">
            <tr>
              <th scope="col" className="px-4 py-3">Branch</th>
              <th scope="col" className="px-4 py-3">Accounts</th>
              <th scope="col" className="px-4 py-3">ATM refunds (Refund Payable)</th>
              <th scope="col" className="w-10 px-4 py-3"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            <tr className="cursor-pointer border-t border-stroke bg-primary/5 hover:bg-primary/10 dark:border-strokedark"
              onClick={() => onOpen('global')} onKeyDown={(e) => { if (e.key === 'Enter') onOpen('global'); }} tabIndex={0}
              aria-label="Open Global Defaults">
              <td className="px-4 py-3 font-semibold text-black dark:text-white">
                <span className="inline-flex items-center gap-2"><Globe size={14} aria-hidden="true" />Global Defaults</span>
                <p className="text-xs font-normal text-body">Used by any branch without its own account</p>
              </td>
              <td className="px-4 py-3">
                {global ? <Count set={REQUIRED.filter((d) => global.own.has(d)).length} /> : <span className="text-danger">Not set up</span>}
              </td>
              <td className="px-4 py-3"><SourceTag source={global?.own.has('refund payable') ? 'own' : 'none'} /></td>
              <td className="px-4 py-3 text-body"><ChevronRight size={16} aria-hidden="true" /></td>
            </tr>
            {shown.map((b) => {
              const own = REQUIRED.filter((d) => b.own.has(d)).length;
              const fromGlobal = REQUIRED.filter((d) => source(b, d) === 'global').length;
              return (
                <tr key={b.key} className="cursor-pointer border-t border-stroke hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                  onClick={() => onOpen(b.key)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(b.key); }} tabIndex={0}
                  aria-label={`Open ${b.subName ?? 'branch'} settings`}>
                  <td className="px-4 py-3"><BranchBadge branchName={b.branchName} subBranchName={b.subName} /></td>
                  <td className="px-4 py-3">
                    <Count set={own} />
                    {fromGlobal > 0 && <p className="text-xs text-body">{fromGlobal} from Global Defaults</p>}
                  </td>
                  <td className="px-4 py-3"><SourceTag source={source(b, 'refund payable')} /></td>
                  <td className="px-4 py-3 text-body"><ChevronRight size={16} aria-hidden="true" /></td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-body">{term ? 'No branch matches.' : 'No branch has its own settings yet.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Count: React.FC<{ set: number }> = ({ set }) => (
  <span className="font-semibold text-black dark:text-white">{set} of {REQUIRED.length} set</span>
);

const SourceTag: React.FC<{ source: Source }> = ({ source }) => {
  if (source === 'own') return <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">Set</span>;
  if (source === 'global') return <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">From Global Defaults</span>;
  return <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">Not set: ATM posting fails</span>;
};

export default LoanProcBranchList;
