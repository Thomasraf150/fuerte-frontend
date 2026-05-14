"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckSquare } from "react-feather";
import { useAuthStore } from "@/store";
import { useDeletionRequestsStore } from "@/store/deletionRequestsStore";

const POLL_MS = 30_000;

const ROLE_NAME = (user: any): string => {
  if (!user) return "";
  if (typeof user?.role?.name === "string") return user.role.name;
  if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
  return "";
};

const IS_APPROVER_ROLE = (roleName: string): boolean => {
  const r = (roleName || "").toUpperCase();
  return r === "ADMIN" || r === "OWNER" || r === "BRANCH_ADMIN";
};

/**
 * Generic notification item. Each producer (deletion approvals today,
 * other systems tomorrow) contributes zero-or-more of these into the
 * `notifications` array consumed by the bell dropdown.
 *
 * `count` raises the aggregate badge number; `body` is the rendered
 * one-liner in the dropdown; `href` is where clicking it navigates.
 */
interface Notification {
  id: string;
  title: string;
  body: string;
  href: string;
  count: number;
  icon: React.ReactNode;
}

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);

  const pendingCount = useDeletionRequestsStore((s) => s.pendingCount);
  const pendingIds = useDeletionRequestsStore((s) => s.pendingIds);
  const fetchPendingCount = useDeletionRequestsStore((s) => s.fetchPendingCount);

  // "Seen" tracking — when the user opens the bell we mark every currently-
  // pending request ID as seen (persisted in localStorage). The visible
  // badge then shows only items the user hasn't acknowledged yet.
  const SEEN_KEY = "fuerte.notif.seenIds";

  const [seenIds, setSeenIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(SEEN_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const persistSeenIds = (ids: string[]) => {
    setSeenIds(ids);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
      } catch {
        // localStorage might be full or blocked — ignore, behavior just
        // resets next session.
      }
    }
  };

  // Items the user has not yet acknowledged. New requests automatically
  // surface (their IDs aren't in seenIds yet).
  const unseenCount = pendingIds.filter((id) => !seenIds.includes(id)).length;

  // Reactively follow the auth store so the bell starts polling as soon
  // as login completes (Zustand persist hydrates from localStorage after
  // the first render — a bare getState() at mount sees the empty user).
  const [authUser, setAuthUser] = useState<any>(() => useAuthStore.getState().user);
  const [authToken, setAuthToken] = useState<string | undefined>(() =>
    useAuthStore.getState().GET_AUTH_TOKEN()
  );

  useEffect(() => {
    const unsub = useAuthStore.subscribe((s: any) => {
      setAuthUser(s.user);
      setAuthToken(s.authToken);
    });
    // After mount, re-read once in case persist hydrated between init and now.
    setAuthUser(useAuthStore.getState().user);
    setAuthToken(useAuthStore.getState().GET_AUTH_TOKEN());
    return () => unsub();
  }, []);

  const canPoll = !!authToken && IS_APPROVER_ROLE(ROLE_NAME(authUser));

  // Poll for sources every 30s when the user is approver-eligible. The
  // effect re-runs when auth changes, so login / logout / role change
  // all start or stop polling cleanly.
  useEffect(() => {
    if (!canPoll) return;

    fetchPendingCount(authToken);
    const id = setInterval(() => {
      fetchPendingCount(useAuthStore.getState().GET_AUTH_TOKEN());
    }, POLL_MS);
    return () => clearInterval(id);
  }, [canPoll, authToken, fetchPendingCount]);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  // ---------- aggregate notifications from all sources ----------
  const notifications: Notification[] = useMemo(() => {
    const out: Notification[] = [];

    if (pendingCount > 0) {
      out.push({
        id: "deletion-approvals",
        title: "Deletion approvals",
        body: `${pendingCount} pending ${
          pendingCount === 1 ? "request awaits" : "requests await"
        } your decision.`,
        href: "/approvals",
        count: pendingCount,
        icon: <CheckSquare size={16} />,
      });
    }

    // Future producers append here.

    return out;
  }, [pendingCount]);

  // Total pending count (used inside the dropdown body so the message
  // reflects reality). Badge uses unseenCount so it clears after the user
  // opens the bell.
  const totalCount = notifications.reduce((n, item) => n + item.count, 0);
  const hasAny = totalCount > 0;
  const badgeCount = Math.min(unseenCount, totalCount);
  const showBadge = badgeCount > 0;

  // Open the dropdown AND mark every currently-pending ID as seen. New
  // pending IDs polled afterwards aren't in seenIds → badge re-appears.
  const handleBellClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !dropdownOpen;
    setDropdownOpen(next);
    if (next && pendingIds.length > 0) {
      // Replace seenIds with the current set (drops stale IDs that aren't
      // pending anymore — keeps localStorage tidy over time).
      persistSeenIds(pendingIds);
    }
  };

  return (
    <li className="relative">
      <Link
        ref={trigger as any}
        onClick={handleBellClick}
        href="#"
        className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
        aria-label={showBadge ? `${badgeCount} new notification(s)` : "Notifications"}
      >
        {showBadge && (
          <span className="absolute -top-1 -right-1 z-10 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-meta-1 px-1 text-[10px] font-semibold text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
            <span className="absolute -z-10 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-60"></span>
          </span>
        )}

        <Bell size={18} />
      </Link>

      <div
        ref={dropdown as any}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        className={`absolute -right-27 mt-2.5 flex w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80 ${
          dropdownOpen ? "block" : "hidden"
        }`}
      >
        <div className="px-4.5 py-3 border-b border-stroke dark:border-strokedark">
          <h5 className="text-sm font-medium text-black dark:text-white">Notifications</h5>
        </div>

        {hasAny ? (
          <ul className="max-h-80 overflow-y-auto divide-y divide-stroke dark:divide-strokedark">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-start gap-3 px-4.5 py-3 hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                    {n.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-black dark:text-white">
                      {n.title}
                    </span>
                    <span className="block text-xs text-bodydark2 mt-0.5">{n.body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4.5 py-8 text-center">
            <p className="text-sm text-bodydark2">No notifications</p>
          </div>
        )}
      </div>
    </li>
  );
};

export default DropdownNotification;
