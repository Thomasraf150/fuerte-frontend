"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import ReactSelect from '@/components/ReactSelect';
import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { useAuthStore } from '@/store';
import { SelectOption } from '@/utils/DataTypes';

export interface VoucherBranch {
  id: string;
  name: string;
  code: string;
}

interface VoucherBranchFieldProps {
  /** The chosen branch id ('' when none yet). */
  value: string;
  onChange: (branch: VoucherBranch | null) => void;
  /** The voucher's number prefix, for the "its number will start …" line: CHKV or JV. */
  prefix: 'CHKV' | 'JV';
  error?: string;
}

/**
 * Up to this many branches show as buttons to tap; more as a searchable list. Radio-style
 * choices beat a dropdown when there are only a few (NN/g, "Dropdowns: Design Guidelines";
 * USWDS: fewer than 7), and an accountant with Cross-Branch Access may reach a dozen.
 */
const TILE_LIMIT = 5;

/** The signed-in user's id, read when needed (as AcctDefaultPage does): the key is per user. */
const storageKey = (): string => {
  const userId = (useAuthStore.getState() as { user?: { id?: number } }).user?.id;
  return `fuerte.voucherBranch.${userId ?? 'anon'}`;
};

/** The number token AcctgEntry::normalizeBranchCode builds: "FC Main" code "FCMain" → FCMAIN. */
export const numberToken = (code: string) => code.replace(/\s+/g, '').toUpperCase() || 'HQ';

/**
 * Remember the branch of a voucher that just saved, so the next voucher starts there (Raf
 * 2026-11-19: "use the last picked branch until it's changed", as Restaurant365 and Sage Intacct
 * carry the location forward). Per user, on this computer only; harmless if storage is blocked.
 */
export function rememberVoucherBranch(branchId: string): void {
  try {
    window.localStorage.setItem(storageKey(), branchId);
  } catch {
    /* private window or blocked storage: the next voucher just starts empty */
  }
}

function recalledBranch(): string | null {
  try {
    return window.localStorage.getItem(storageKey());
  } catch {
    return null;
  }
}

interface BranchChooserProps {
  branches: VoucherBranch[];
  value: string;
  onPick: (branch: VoucherBranch | null) => void;
  /** The id of the visible text that names this choice. */
  labelledBy: string;
  describedBy?: string;
  selectId: string;
}

/** A few branches as buttons to tap (48px), more as a list you can type into. */
export const BranchChooser: React.FC<BranchChooserProps> = ({ branches, value, onPick, labelledBy, describedBy, selectId }) => {
  const options = useMemo<SelectOption[]>(() => branches.map((b) => ({ value: b.id, label: b.name })), [branches]);

  if (branches.length <= TILE_LIMIT) {
    return (
      <div role="radiogroup" aria-labelledby={labelledBy} aria-describedby={describedBy} className="flex flex-wrap gap-2">
        {branches.map((b) => {
          const on = b.id === value;
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(b)}
              className={`min-h-12 border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                on
                  ? 'border-primary bg-primary text-white'
                  : 'border-field bg-white text-black hover:border-primary hover:text-primary dark:border-field-dark dark:bg-boxdark dark:text-white'
              }`}
            >
              {b.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <ReactSelect
        inputId={selectId}
        aria-label="Branch"
        aria-invalid={Boolean(describedBy)}
        aria-errormessage={describedBy}
        options={options}
        value={options.find((o) => o.value === value) ?? null}
        onChange={(o: SelectOption | null) => onPick(branches.find((b) => b.id === o?.value) ?? null)}
        placeholder="Type or pick a branch"
      />
    </div>
  );
};

/**
 * Which branch a new voucher is filed under. The branch is what prints as Cost Center and the
 * prefix of the voucher number, and it used to be taken silently from the person's home branch,
 * so an FB Main accountant's FC Main vouchers printed "FB Main" (FC Accounting, 2026-11-19).
 *
 * - One branch: filled in and shown, nothing to choose.
 * - Several: the branch of the last saved voucher is filled in, with a line saying so, because a
 *   remembered value that is wrong and goes unnoticed becomes a mistake. The very first time,
 *   nothing is filled in and the choice is open. The server refuses a voucher with no branch.
 */
/** The live branches the signed-in user may file vouchers under (the list the server checks against). */
export function useMyVoucherBranches(enabled = true): { branches: VoucherBranch[] | null; loadFailed: string | null; load: () => Promise<void> } {
  const [branches, setBranches] = useState<VoucherBranch[] | null>(null);
  const [loadFailed, setLoadFailed] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadFailed(null);
    try {
      const result = await graphqlFetch(BranchQueryMutations.GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY);
      const rows = result.data?.getMyAccessibleBranchSubs;
      if (!rows) {
        setLoadFailed(result.errors?.[0]?.message ?? 'No branches came back.');
        return;
      }
      setBranches(rows.map((b: { id: string | number; name: string; code?: string | null }) => ({
        id: String(b.id), name: b.name, code: b.code ?? '',
      })));
    } catch (e) {
      setLoadFailed(e instanceof Error ? e.message : 'Network error');
    }
  }, []);

  useEffect(() => { if (enabled) load(); }, [load, enabled]);

  return { branches, loadFailed, load };
}

const VoucherBranchField: React.FC<VoucherBranchFieldProps> = ({ value, onChange, prefix, error }) => {
  const { branches, loadFailed, load } = useMyVoucherBranches();
  const [choosing, setChoosing] = useState(false);
  const [carriedOver, setCarriedOver] = useState(false);
  const groupId = useId();
  const selectId = `${groupId}-select`;
  const errorId = `${groupId}-error`;

  // Once the list is in: fill in the only branch, or the remembered one if it is still allowed.
  useEffect(() => {
    if (!branches || value) return;
    if (branches.length === 1) {
      onChange(branches[0]);
      return;
    }
    const remembered = branches.find((b) => b.id === recalledBranch());
    if (remembered) {
      setCarriedOver(true);
      onChange(remembered);
    } else {
      setChoosing(true);
    }
    // onChange is the parent's setter; re-running on its identity would re-pick after a change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  const chosen = useMemo(() => branches?.find((b) => b.id === value) ?? null, [branches, value]);

  const pick = (branch: VoucherBranch | null) => {
    setCarriedOver(false);
    setChoosing(false);
    onChange(branch);
  };

  if (loadFailed) {
    return (
      <ErrorAlert title="Your branches didn't load, so this voucher can't be saved yet." detail={loadFailed} onRetry={load} />
    );
  }
  if (!branches) {
    return <p className="text-sm text-body dark:text-bodydark" aria-live="polite">Loading your branches…</p>;
  }
  if (branches.length === 0) {
    return (
      <ErrorAlert title="Your account has no branch to file vouchers under.">
        Ask an Admin to give your account a branch, then open this page again.
      </ErrorAlert>
    );
  }

  const single = branches.length === 1;
  const showChooser = !single && (choosing || !chosen);

  return (
    <section
      aria-labelledby={`${groupId}-label`}
      className={`border-l-4 bg-white px-4 py-3 dark:bg-boxdark ${
        error ? 'border-danger' : carriedOver ? 'border-accent' : 'border-primary'
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p id={`${groupId}-label`} className="text-sm font-semibold text-black dark:text-white">
            Branch
          </p>
          {chosen ? (
            <p className="font-display text-2xl font-semibold leading-tight text-ink dark:text-white" aria-live="polite">
              {chosen.name}
            </p>
          ) : (
            <p className="font-display text-2xl font-semibold leading-tight text-body dark:text-bodydark">
              Which branch is this voucher for?
            </p>
          )}
        </div>
        {!single && chosen && !choosing && (
          <Button variant="secondary" type="button" onClick={() => setChoosing(true)}>
            Change branch
          </Button>
        )}
      </div>

      {chosen && (
        <p className="mt-1 text-sm text-body dark:text-bodydark">
          {single
            ? 'You work in one branch, so it is filled in. '
            : carriedOver
              ? 'Same branch as your last voucher. Change it if this one is for a different branch. '
              : ''}
          {/* The sequence part is only given out on Save, so the start is what can be shown. */}
          It prints with Cost Center {chosen.name}, and its number will start with {prefix}-{numberToken(chosen.code)}-.
        </p>
      )}

      {showChooser && (
        <div className="mt-3">
          <BranchChooser
            branches={branches}
            value={value}
            onPick={pick}
            labelledBy={`${groupId}-label`}
            describedBy={error ? errorId : undefined}
            selectId={selectId}
          />
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </section>
  );
};

export default VoucherBranchField;
