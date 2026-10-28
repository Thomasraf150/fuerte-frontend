import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import type { UseDeleteWithApprovalConfig } from '@/hooks/useDeleteWithApproval';

/**
 * Deleting a loan application (2026-10-28): the Owner deletes it at once; everyone else who may work on
 * it files a request for approval, as every other delete does (useDeleteWithApproval). The reason is
 * required: the server refuses one under 3 characters, the Owner's too.
 */
export const APPLICATION_DELETE: UseDeleteWithApprovalConfig<{ id: number }> = {
  mutation: LoanApplicationQueries.DELETE_LOAN_APPLICATION_MUTATION,
  responseKey: 'deleteLoanApplication',
  promptTitle: 'Delete this application?',
  promptText: 'If you are the owner, it is deleted right away. Otherwise an approver reviews your request first.',
  buildVariables: (args, reason) => ({ id: args.id, reason: reason ?? '' }),
  errorLabel: 'Could not delete the application.',
  reasonRequired: true,
};
