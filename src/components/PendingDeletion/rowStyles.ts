import type { ConditionalStyles } from "react-data-table-component";
import type { PendingDeletionInfo } from "@/hooks/usePendingDeletions";

/**
 * Row-level visual treatment for rows under a pending deletion request.
 * 3px left border + a barely-there tint — the "margin note" effect.
 *
 * Colours match the PendingDeletionBadge:
 *   amber → someone else's request
 *   cyan  → your own request
 *
 * Reads document.documentElement.classList for the `dark` class so the
 * stripe stays legible on Fuerte's dark surfaces (the tint is barely-
 * there in both modes).
 *
 * Pass into <CustomDatatable conditionalRowStyles={...} />.
 */
export function pendingDeletionRowStyles<T>(
  pendingByEntityId: Map<number, PendingDeletionInfo>
): ConditionalStyles<T>[] {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const amberStripe = isDark ? "#fbbf24" : "#b45309";
  const amberTint = isDark ? "rgba(251, 191, 36, 0.08)" : "rgba(245, 158, 11, 0.04)";
  const cyanStripe = isDark ? "#22d3ee" : "#0891b2";
  const cyanTint = isDark ? "rgba(34, 211, 238, 0.08)" : "rgba(8, 145, 178, 0.04)";

  return [
    {
      when: (row: T) => {
        const info = pendingByEntityId.get(Number((row as any).id));
        return !!info && !info.is_mine;
      },
      style: {
        borderLeft: `3px solid ${amberStripe}`,
        backgroundColor: amberTint,
      },
    },
    {
      when: (row: T) => {
        const info = pendingByEntityId.get(Number((row as any).id));
        return !!info && info.is_mine;
      },
      style: {
        borderLeft: `3px solid ${cyanStripe}`,
        backgroundColor: cyanTint,
      },
    },
  ];
}
