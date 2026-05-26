"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store";
import DeletionRequestsQueryMutation from "@/graphql/DeletionRequestsQueryMutation";
import { graphqlFetch } from "@/utils/graphqlFetch";

export interface PendingDeletionInfo {
  request_id: string;
  entity_type: string;
  entity_id: number;
  requested_by_user_id: number;
  requested_by_name: string | null;
  reason: string | null;
  created_at: string;
  is_mine: boolean;
}

/**
 * For a list page, ask the backend which of the currently-displayed
 * entity ids have a pending deletion request. Returns a Map keyed by
 * entity_id for O(1) lookup in the row renderer.
 *
 * Usage:
 *   const ids = rows.map(r => Number(r.id));
 *   const { pendingByEntityId, refresh } = usePendingDeletions('borrower', ids);
 *   const pending = pendingByEntityId.get(rowId);
 *
 * The hook deduplicates rapid id-list changes by hashing the sorted ids,
 * so paginating through the same page doesn't refetch.
 */
export const usePendingDeletions = (
  entityType: string,
  entityIds: number[]
) => {
  const [pendingByEntityId, setPendingByEntityId] = useState<Map<number, PendingDeletionInfo>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);

  // Hash the ids so we only re-fetch when the actual list content changes.
  const hash = entityIds.length === 0 ? "" : [...entityIds].sort((a, b) => a - b).join(",");
  const lastHashRef = useRef<string>("__init__");

  const fetchNow = useCallback(async () => {
    if (entityIds.length === 0) {
      setPendingByEntityId(new Map());
      return;
    }

    const token = useAuthStore.getState().GET_AUTH_TOKEN();
    if (!token) return;

    setLoading(true);
    try {
      const json = await graphqlFetch(
        DeletionRequestsQueryMutation.PENDING_DELETIONS_FOR_ENTITIES,
        { entity_type: entityType, entity_ids: entityIds.slice(0, 200) },
      );
      const rows: PendingDeletionInfo[] = json?.data?.pendingDeletionsForEntities ?? [];
      const next = new Map<number, PendingDeletionInfo>();
      for (const r of rows) next.set(r.entity_id, r);
      setPendingByEntityId(next);
    } catch {
      // best-effort; UI shouldn't break if this call fails
    } finally {
      setLoading(false);
    }
  }, [entityType, hash]);

  useEffect(() => {
    if (lastHashRef.current === hash) return;
    lastHashRef.current = hash;
    fetchNow();
  }, [hash, fetchNow]);

  return { pendingByEntityId, loading, refresh: fetchNow };
};

export default usePendingDeletions;
