import { showAlreadyPendingModal, showProcessingModal } from '@/components/ConfirmationModal';
import LoansQueryMutation from '@/graphql/LoansQueryMutation';
import type { UseDeleteWithApprovalConfig } from '@/hooks/useDeleteWithApproval';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import type { BorrLoanRowData } from '@/utils/DataTypes';

/**
 * Deleting a loan, one definition for both places that do it: the Loans list (useLoans) and the
 * loan page's More menu. Mirrors hooks/borrowerDelete.ts. Only the Owner deletes immediately
 * (User::canBypassDeletionApproval); everyone else files a request for approval.
 */
export const LOAN_DELETE: UseDeleteWithApprovalConfig<{ loan_id: string }> = {
  mutation: LoansQueryMutation.DELETE_LOANS,
  responseKey: 'removeLoans',
  promptTitle: 'Delete this loan?',
  promptText: 'If you are the owner, this happens immediately. Otherwise an approver will review your request.',
  buildVariables: (args, reason) => ({
    input: { loan_id: args.loan_id, type: 'rm_loans', ...(reason ? { reason } : {}) },
  }),
  errorLabel: 'Failed to delete loan',
};

type DeletableFields = Pick<BorrLoanRowData, 'acctg_entry' | 'is_closed' | 'status'>;

/**
 * Whether a loan offers Delete: not posted to accounting (the server refuses those: "Loan is
 * already posted to accounting."), not closed, and For Approval through Released. The list's rule.
 */
export const isLoanDeletable = (loan: DeletableFields | null | undefined): boolean =>
  !!loan && loan.acctg_entry === null && String(loan.is_closed) !== '1' && Number(loan.status) <= 3;

/** "Loan MA-0512 — TESTPLAN, ANA", as the "Already in the queue" modal names it. */
const loanLabel = (loan: Pick<BorrLoanRowData, 'id' | 'loan_ref' | 'borrower'>): string =>
  `Loan ${loan.loan_ref ?? `#${loan.id}`}${loan.borrower?.lastname ? ` — ${loan.borrower.lastname}, ${loan.borrower.firstname ?? ''}` : ''}`;

interface PendingDeletionActions {
  /** "View in Approvals". */
  onView: () => void;
  /** Withdraws the user's own request; true when it was withdrawn. */
  cancel: (requestId: string) => Promise<boolean>;
  /** Re-reads what is pending, after a withdrawal. */
  refresh: () => Promise<void> | void;
}

/**
 * A loan that already has a deletion request: the "Already in the queue" modal, then View (to
 * Approvals) or, for the user's own request, withdraw it. Shared by the Loans list and the loan page.
 */
export async function showPendingLoanDeletion(
  info: PendingDeletionInfo,
  loan: Pick<BorrLoanRowData, 'id' | 'loan_ref' | 'borrower'>,
  actions: PendingDeletionActions,
): Promise<void> {
  const action = await showAlreadyPendingModal({
    request_id: info.request_id,
    requested_by_name: info.requested_by_name,
    reason: info.reason,
    created_at: info.created_at,
    is_mine: info.is_mine,
    entity_label: loanLabel(loan),
  });
  if (action === 'view') {
    actions.onView();
  } else if (action === 'withdraw' && info.is_mine) {
    const closeProcessing = showProcessingModal('Deleting request…');
    try {
      const ok = await actions.cancel(String(info.request_id));
      if (ok) await actions.refresh();
    } finally {
      closeProcessing();
    }
  }
}
