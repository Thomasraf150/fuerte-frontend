import { showAlreadyPendingModal, showProcessingModal } from '@/components/ConfirmationModal';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import type { UseDeleteWithApprovalConfig } from '@/hooks/useDeleteWithApproval';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import type { BorrowerRowInfo } from '@/utils/DataTypes';

/**
 * Deleting a borrower: bypass-eligible roles (ADMIN/OWNER/BRANCH_ADMIN) soft-delete
 * immediately; everyone else files a request. One definition for both places that
 * delete a borrower: the Borrowers list (useBorrower) and the borrower page's More menu.
 */
export const BORROWER_DELETE: UseDeleteWithApprovalConfig<{ id: string | number }> = {
  mutation: BorrowerQueryMutations.DELETE_BORROWER_MUTATION,
  responseKey: 'deleteBorrower',
  promptTitle: 'Delete this borrower?',
  promptText: 'If you are an admin or owner, this happens immediately. Otherwise a branch admin will review your request.',
  buildVariables: (args, reason) => ({ id: args.id, reason }),
  errorLabel: 'Failed to delete borrower',
};

interface PendingDeletionActions {
  /** "View in Approvals". */
  onView: () => void;
  /** Withdraws the user's own request; true when it was withdrawn. */
  cancel: (requestId: string) => Promise<boolean>;
  /** Re-reads what is pending, after a withdrawal. */
  refresh: () => Promise<void> | void;
}

/**
 * A borrower that already has a deletion request: the "Already in the queue" modal, then View
 * (to Approvals) or, for the user's own request, Delete request. Shared by the Borrowers list
 * and the borrower page's More menu; the modal names the borrower in full ("Juana Santos Dela Cruz").
 */
export async function showPendingBorrowerDeletion(
  info: PendingDeletionInfo,
  borrower: Pick<BorrowerRowInfo, 'firstname' | 'middlename' | 'lastname'>,
  actions: PendingDeletionActions,
): Promise<void> {
  const entityLabel = [borrower.firstname, borrower.middlename, borrower.lastname].filter(Boolean).join(' ');
  const action = await showAlreadyPendingModal({
    request_id: info.request_id,
    requested_by_name: info.requested_by_name,
    reason: info.reason,
    created_at: info.created_at,
    is_mine: info.is_mine,
    entity_label: entityLabel,
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
