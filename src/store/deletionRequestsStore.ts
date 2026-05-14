import { create } from "zustand";

/**
 * Lightweight slice for the bell-icon badge.
 *
 * The /approvals page owns the heavy fetching via useDeletionRequests.
 * This store keeps a synchronized list of pending-request IDs (and a
 * derived count) so the bell can show only the items the user hasn't
 * "seen" yet — matching the universal mark-as-read mental model.
 */
interface DeletionRequestsBadgeState {
  pendingIds: string[];
  pendingCount: number;
  lastFetchedAt: number | null;
  fetchPendingCount: (token: string | null | undefined) => Promise<void>;
  setPendingIds: (ids: string[]) => void;
}

const PENDING_QUERY = `
  query PendingForMeCount {
    pendingDeletionRequestsForMe { id }
  }
`;

export const useDeletionRequestsStore = create<DeletionRequestsBadgeState>((set) => ({
  pendingIds: [],
  pendingCount: 0,
  lastFetchedAt: null,

  setPendingIds: (ids: string[]) =>
    set({ pendingIds: ids, pendingCount: ids.length, lastFetchedAt: Date.now() }),

  fetchPendingCount: async (token) => {
    if (!token) {
      set({ pendingIds: [], pendingCount: 0, lastFetchedAt: Date.now() });
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: PENDING_QUERY }),
      });
      const json = await res.json();
      const rows = Array.isArray(json?.data?.pendingDeletionRequestsForMe)
        ? json.data.pendingDeletionRequestsForMe
        : [];
      const ids: string[] = rows.map((r: { id: string | number }) => String(r.id));
      set({ pendingIds: ids, pendingCount: ids.length, lastFetchedAt: Date.now() });
    } catch {
      // Silent — badge is best-effort.
    }
  },
}));
