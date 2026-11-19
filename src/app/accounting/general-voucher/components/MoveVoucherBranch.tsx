"use client";

import React, { useId, useMemo, useState } from 'react';
import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import { BranchChooser, VoucherBranch, numberToken, useMyVoucherBranches } from '@/components/VoucherBranchField';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import GeneralVoucherQueryMutations from '@/graphql/GeneralVoucherQueryMutations';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { escapeHtml } from '@/utils/html';
import { toast } from '@/utils/notify';
import { RowAcctgEntry } from '@/utils/DataTypes';

interface MoveVoucherBranchProps {
  voucher: RowAcctgEntry;
  /** Offer the move: the server decides in the end, this only hides a button that would be refused. */
  canMove: boolean;
  /** Reload the voucher after it moved: its number and branch changed. */
  onMoved: () => void;
}

/**
 * The branch a saved voucher is filed under, and (for Accounting, Admin and Owner) a way to move
 * it to the branch it really belongs to. Vouchers keyed in before the branch picker took the
 * poster's home branch, so FC Main's printed as "Cost Center: FB Main" (FC Accounting,
 * 2026-11-19). A moved voucher gets the new branch's next number; the server refuses vouchers
 * that other records point at by number (loan releases, reversals, payments, UDI, ATM).
 */
const MoveVoucherBranch: React.FC<MoveVoucherBranchProps> = ({ voucher, canMove, onMoved }) => {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<VoucherBranch | null>(null);
  const [saving, setSaving] = useState(false);
  const labelId = useId();
  const promptId = `${labelId}-prompt`;
  const { branches, loadFailed, load } = useMyVoucherBranches(canMove);

  const others = useMemo(
    () => (branches ?? []).filter((b) => b.id !== String(voucher.branch_sub_id ?? '')),
    [branches, voucher.branch_sub_id],
  );
  const prefix = voucher.journal_name === 'Journal Voucher' ? 'JV' : 'CHKV';

  const close = () => { setOpen(false); setTarget(null); };

  const move = async () => {
    if (!target || !voucher.id) return;
    const confirmed = await showConfirmationModal(
      // The title is HTML in SweetAlert2 (ConfirmationModal): escape the stored text in it.
      `Move ${escapeHtml(voucher.journal_ref)} to ${escapeHtml(target.name)}?`,
      `It gets the next ${target.name} number, starting with ${prefix}-${numberToken(target.code)}-. ` +
        `The old number ${voucher.journal_ref} is retired and kept in the audit log. The amounts and accounts do not change.`,
      'Yes, move it',
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const result = await graphqlFetch(GeneralVoucherQueryMutations.RETAG_VOUCHER_MUTATION, {
        input: { id: String(voucher.id), branch_sub_id: target.id },
      });
      const answer = result.data?.retagVoucher;
      if (result.errors || !answer?.status) {
        toast.error(answer?.message ?? result.errors?.[0]?.message ?? 'The voucher was not moved.');
        return;
      }
      toast.success(`${answer.message} Print it again so the paper copy matches.`);
      close();
      onMoved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'The voucher was not moved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby={labelId} className="border-l-4 border-primary bg-white px-4 py-3 dark:bg-boxdark">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p id={labelId} className="text-sm font-semibold text-black dark:text-white">Branch</p>
          <p className="font-display text-2xl font-semibold leading-tight text-ink dark:text-white">
            {voucher.branch_sub_name || 'No branch'}
          </p>
        </div>
        {canMove && !open && (
          <Button variant="secondary" type="button" onClick={() => setOpen(true)}>
            Move to another branch
          </Button>
        )}
      </div>

      {canMove && open && (
        <div className="mt-3 space-y-3">
          <p id={promptId} className="max-w-prose text-sm text-body dark:text-bodydark">
            Which branch does this voucher really belong to? It gets that branch&apos;s next number, and{' '}
            {voucher.journal_ref} is retired. The amounts and accounts stay the same.
          </p>
          {loadFailed ? (
            <ErrorAlert title="Your branches didn't load." detail={loadFailed} onRetry={load} />
          ) : !branches ? (
            <p className="text-sm text-body dark:text-bodydark" aria-live="polite">Loading your branches…</p>
          ) : others.length === 0 ? (
            <p className="text-sm text-body dark:text-bodydark">You have no other branch to move it to.</p>
          ) : (
            <BranchChooser
              branches={others}
              value={target?.id ?? ''}
              onPick={setTarget}
              labelledBy={promptId}
              selectId={`${labelId}-select`}
            />
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" type="button" onClick={move} disabled={!target || saving}>
              {saving ? 'Moving…' : target ? `Move to ${target.name}` : 'Move'}
            </Button>
            <Button variant="secondary" type="button" onClick={close} disabled={saving}>
              Keep it in {voucher.branch_sub_name || 'this branch'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MoveVoucherBranch;
