"use client";

import { useCallback } from "react";
import { toast } from "react-toastify";
import { showDeletionRequestPrompt, showProcessingModal } from "@/components/ConfirmationModal";
import { graphqlFetch } from "@/utils/graphqlFetch";

/**
 * Shape of the response from the 6 in-scope delete mutations.
 * `status` may arrive as boolean OR string ("true"/"false") depending on
 * the entity — PaymentPostingRes returns it as a string.
 */
export interface DeleteMutationResult {
  status: boolean | string;
  message?: string | null;
  immediate?: boolean | null;
  request_id?: string | null;
}

export interface UseDeleteWithApprovalConfig<TArgs> {
  /** GraphQL mutation string */
  mutation: string;
  /** Build the variables payload from the row args + captured reason */
  buildVariables: (args: TArgs, reason: string | null) => Record<string, unknown>;
  /** Top-level field name in result.data, e.g. "deleteBorrower" */
  responseKey: string;
  promptTitle: string;
  promptText: string;
  errorLabel?: string;
}

/** Per-call callbacks; vary by row click so they're passed at invocation. */
export interface DeleteCallbacks {
  /** Runs after a non-bypass request succeeds, BEFORE the spinner closes.
   *  Use to refresh badge state so the row updates atomically. */
  onAfterRequest?: () => void | Promise<void>;
  /** Runs after a bypass (immediate) delete succeeds — refresh the list. */
  onImmediateSuccess?: () => void | Promise<void>;
}

/**
 * Single source of truth for the bypass-or-request delete flow used by
 * the 6 in-scope entities. Each entity hook wires this once with its
 * static config; per-row callbacks are passed at the call site.
 *
 * Usage:
 *   const submitDelete = useDeleteWithApproval<{ id: number }>({
 *     mutation: DELETE_BORROWER_MUTATION,
 *     responseKey: 'deleteBorrower',
 *     promptTitle: 'Delete this borrower?',
 *     promptText: '…',
 *     buildVariables: (args, reason) => ({ id: args.id, reason }),
 *     errorLabel: 'Failed to delete borrower',
 *   });
 *
 *   const handleRmBorrower = (row, onAfterRequest) =>
 *     submitDelete({ id: row.id }, { onAfterRequest, onImmediateSuccess: refresh });
 */
export function useDeleteWithApproval<TArgs>(config: UseDeleteWithApprovalConfig<TArgs>) {
  return useCallback(
    async (args: TArgs, callbacks: DeleteCallbacks = {}): Promise<void> => {
      const reason = await showDeletionRequestPrompt(
        config.promptTitle,
        config.promptText,
        "Delete"
      );
      if (reason === null) return; // user cancelled

      const closeProcessing = showProcessingModal("Submitting…");
      try {
        const json = await graphqlFetch(
          config.mutation,
          config.buildVariables(args, reason || null),
        );

        if (json.errors) {
          closeProcessing();
          toast.error(json.errors[0].message);
          return;
        }

        const payload: DeleteMutationResult | undefined = json?.data?.[config.responseKey];
        if (!payload) {
          closeProcessing();
          toast.error(config.errorLabel ?? "Unexpected empty response from server.");
          return;
        }

        const ok = payload.status === true || payload.status === "true";
        if (!ok) {
          closeProcessing();
          toast.error(payload.message || config.errorLabel || "Failed.");
          return;
        }

        // Non-bypass: a deletion request was created. Refresh badge state
        // BEFORE the spinner closes so the row updates atomically.
        if (payload.immediate === false) {
          if (callbacks.onAfterRequest) {
            try { await callbacks.onAfterRequest(); } catch { /* best-effort */ }
          }
          closeProcessing();
          toast.info(payload.message || "Deletion request submitted for approval.");
          return;
        }

        // Bypass path: entity was deleted immediately.
        if (callbacks.onImmediateSuccess) {
          try { await callbacks.onImmediateSuccess(); } catch { /* best-effort */ }
        }
        closeProcessing();
        toast.success(payload.message || "Deleted successfully.");
      } catch {
        closeProcessing();
        toast.error(config.errorLabel ?? "Network error occurred.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.mutation, config.responseKey, config.promptTitle, config.promptText, config.errorLabel]
  );
}

export default useDeleteWithApproval;
