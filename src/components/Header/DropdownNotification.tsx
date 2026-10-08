"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckSquare } from "react-feather";
import useApplicationNotifications, { POLL_MS } from "@/hooks/useApplicationNotifications";
import useSeenNotificationIds from "@/hooks/useSeenNotificationIds";
import { useAuthStore } from "@/store";
import { useDeletionRequestsStore } from "@/store/deletionRequestsStore";
import type { ApplicationNotification } from "@/utils/DataTypes";
import { manilaToday } from "@/utils/sourceTracker";
import ApplicationNotificationRow, { hrefFor } from "./ApplicationNotificationRow";

const ROLE_NAME = (user: any): string => {
  if (!user) return "";
  if (typeof user?.role?.name === "string") return user.role.name;
  if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
  return "";
};

const IS_APPROVER_ROLE = (roleName: string): boolean => {
  const r = (roleName || "").toUpperCase();
  return r === "ADMIN" || r === "OWNER" || r === "BRANCH_ADMIN" || r === "GROUP_ADMIN";
};

/**
 * Who gets the Applications items, by role code: Processing ("X is now a borrower", on its own
 * branches) and Call Center (every status change, and every Approved / Rejected on a borrower made
 * from an application). The server decides what each gets; the bell only asks.
 */
const APPLICATION_ROLE_CODES: ReadonlySet<string> = new Set(["PROC", "CALLCTR"]);

/**
 * Generic notification item. Each producer (deletion approvals today,
 * other systems tomorrow) contributes zero-or-more of these into the
 * `notifications` array consumed by the bell dropdown.
 *
 * The badge counts the ids the user has not seen (useSeenNotificationIds); `body` is the rendered
 * one-liner in the dropdown; `href` is where clicking it navigates.
 */
interface Notification {
  id: string;
  title: string;
  body: string;
  href: string;
  icon: React.ReactNode;
}

/** The deletion approvals' one row (its count of pending requests), as it has always looked. */
const deletionNotifications = (pendingCount: number): Notification[] =>
  pendingCount > 0
    ? [
        {
          id: "deletion-approvals",
          title: "Deletion approvals",
          body: `${pendingCount} pending ${pendingCount === 1 ? "request awaits" : "requests await"} your decision.`,
          href: "/approvals",
          icon: <CheckSquare size={16} />,
        },
      ]
    : [];

/**
 * Reactively follow the auth store so the bell starts polling as soon as login completes (Zustand
 * persist hydrates from localStorage after the first render — a bare getState() at mount sees the
 * empty user).
 */
const useAuthSnapshot = (): { authUser: any; authToken: string | undefined } => {
  const [authUser, setAuthUser] = useState<any>(() => useAuthStore.getState().user);
  const [authToken, setAuthToken] = useState<string | undefined>(() => useAuthStore.getState().GET_AUTH_TOKEN());

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

  return { authUser, authToken };
};

/**
 * Poll the deletion approvals every POLL_MS while the user is approver-eligible. The effect re-runs
 * when auth changes, so login / logout / role change all start or stop polling cleanly.
 */
const useDeletionPoll = (canPoll: boolean, authToken: string | undefined): void => {
  const fetchPendingCount = useDeletionRequestsStore((s) => s.fetchPendingCount);
  useEffect(() => {
    if (!canPoll) return;
    fetchPendingCount(authToken);
    const id = setInterval(() => fetchPendingCount(useAuthStore.getState().GET_AUTH_TOKEN()), POLL_MS);
    return () => clearInterval(id);
  }, [canPoll, authToken, fetchPendingCount]);
};

/**
 * Close the open dropdown on a click outside it and its trigger, and on Escape. Escape from inside
 * the dropdown puts the focus back on the trigger, so a keyboard user is not left on a hidden row.
 */
const useDismiss = (
  open: boolean,
  close: () => void,
  trigger: React.RefObject<HTMLElement>,
  dropdown: React.RefObject<HTMLElement>,
): void => {
  useEffect(() => {
    if (!open) return;
    const onClick = ({ target }: MouseEvent) => {
      if (!dropdown.current || dropdown.current.contains(target as Node) || trigger.current?.contains(target as Node)) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dropdown.current?.contains(document.activeElement)) trigger.current?.focus();
      close();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, trigger, dropdown]);
};

/** A generic row (the deletion approvals' today). */
const NotificationRow: React.FC<{ n: Notification; onOpen: () => void }> = ({ n, onOpen }) => (
  <li>
    <Link href={n.href} onClick={onOpen} className="flex items-start gap-3 px-4.5 py-3 transition-colors hover:bg-gray-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-meta-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">{n.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-black dark:text-white">{n.title}</span>
        <span className="mt-0.5 block text-xs text-body dark:text-bodydark2">{n.body}</span>
      </span>
    </Link>
  </li>
);

/** The bell itself: the unseen count as its badge and in its name, and whether the dropdown is open. */
const BellTrigger = forwardRef<HTMLAnchorElement, { badgeCount: number; open: boolean; onClick: (e: React.MouseEvent) => void }>(
  ({ badgeCount, open, onClick }, ref) => (
    <Link
      ref={ref}
      onClick={onClick}
      href="#"
      className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      aria-label={badgeCount > 0 ? `${badgeCount} new notification(s)` : "Notifications"}
      aria-expanded={open}
    >
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 z-10 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-meta-1 px-1 text-[10px] font-semibold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
          <span className="absolute -z-10 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-60"></span>
        </span>
      )}
      <Bell size={18} />
    </Link>
  ),
);
BellTrigger.displayName = "BellTrigger";

interface PanelProps {
  open: boolean;
  /** The bell: focus moving to it is not focus leaving (its own click toggles the dropdown). */
  trigger: React.RefObject<HTMLElement>;
  setOpen: (open: boolean) => void;
  notifications: Notification[];
  applicationItems: ApplicationNotification[];
  opensBorrower: boolean;
}

/**
 * The dropdown: the generic rows, then the Applications items, newest first (the server's order).
 * It closes when the focus LEAVES it, so Tab from one row to the next keeps it open. Focus moving
 * to the bell does not count: a click on the bell then toggles it closed, instead of the blur
 * closing it and the click opening it again.
 */
const NotificationPanel = forwardRef<HTMLDivElement, PanelProps>(({ open, trigger, setOpen, notifications, applicationItems, opensBorrower }, ref) => {
  const close = () => setOpen(false);
  // Manila's day, which says whether an Applications item shows its time or its date.
  const today = manilaToday();
  const hasAny = notifications.length > 0 || applicationItems.length > 0;
  return (
    <div
      ref={ref}
      onBlur={(e) => {
        const to = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(to) && !trigger.current?.contains(to)) setOpen(false);
      }}
      className={`absolute right-4 mt-2.5 flex w-75 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80 ${
        open ? "block" : "hidden"
      }`}
    >
      <div className="px-4.5 py-3 border-b border-stroke dark:border-strokedark">
        <h5 className="text-sm font-medium text-black dark:text-white">Notifications</h5>
      </div>
      {hasAny ? (
        <ul className="max-h-80 overflow-y-auto divide-y divide-stroke dark:divide-strokedark">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} onOpen={close} />
          ))}
          {applicationItems.map((item) => (
            <ApplicationNotificationRow key={item.key} item={item} href={hrefFor(item, opensBorrower)} today={today} onOpen={close} />
          ))}
        </ul>
      ) : (
        <div className="px-4.5 py-8 text-center">
          <p className="text-sm text-bodydark2">No notifications</p>
        </div>
      )}
    </div>
  );
});
NotificationPanel.displayName = "NotificationPanel";

/**
 * The header bell. Two producers: the deletion approvals (approver roles, by name) and the
 * Applications items (Processing and Call Center, by code; only with a token). The badge counts what
 * the user has not seen; opening the bell marks everything on it seen.
 */
const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<HTMLAnchorElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setDropdownOpen(false), []);

  const pendingCount = useDeletionRequestsStore((s) => s.pendingCount);
  const pendingIds = useDeletionRequestsStore((s) => s.pendingIds);
  const { authUser, authToken } = useAuthSnapshot();
  useDeletionPoll(!!authToken && IS_APPROVER_ROLE(ROLE_NAME(authUser)), authToken);
  const roleCode: string = typeof authUser?.role?.code === "string" ? authUser.role.code : "";
  const applicationItems = useApplicationNotifications(!!authToken && APPLICATION_ROLE_CODES.has(roleCode), authUser?.id);
  useDismiss(dropdownOpen, close, trigger, dropdown);

  // Everything on the bell now, by id: the deletion ids and the Applications keys (prefixed by the
  // server, "status:…" and "decision:…", so they never collide with a deletion id).
  const currentIds = useMemo(() => [...pendingIds, ...applicationItems.map((item) => item.key)], [pendingIds, applicationItems]);
  const { unseenCount, markAllSeen } = useSeenNotificationIds(currentIds, authUser?.id);
  const notifications = useMemo(() => deletionNotifications(pendingCount), [pendingCount]);

  // Open the dropdown AND mark everything on it as seen; ids polled afterwards bring the badge back.
  const handleBellClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !dropdownOpen;
    setDropdownOpen(next);
    if (next) markAllSeen();
  };

  return (
    // Below sm the item is static, so the dropdown is placed against the header: it keeps 16px from
    // the screen's right edge instead of hanging off it (it is anchored to the bell from sm up).
    <li className="relative max-sm:static">
      <BellTrigger ref={trigger} badgeCount={unseenCount} open={dropdownOpen} onClick={handleBellClick} />
      <NotificationPanel
        ref={dropdown}
        open={dropdownOpen}
        trigger={trigger}
        setOpen={setDropdownOpen}
        notifications={notifications}
        applicationItems={applicationItems}
        opensBorrower={roleCode === "PROC"}
      />
    </li>
  );
};

export default DropdownNotification;
