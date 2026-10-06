"use client";

import Link from "next/link";
import { Activity, CheckCircle, UserPlus, XCircle, type Icon } from "react-feather";
import type { ApplicationNotification } from "@/utils/DataTypes";

/** What happened, in the words under the applicant's name. A decision's reason follows it: "Rejected: Kulang ang income". */
const EVENT_TEXT: Record<string, string> = {
  borrower_created: "is now a borrower",
  interviewed: "Interviewed",
  declined: "Declined",
  for_interview: "back to For Interview",
  approved: "Approved",
  rejected: "Rejected",
};

const eventText = ({ status, reason }: ApplicationNotification): string => {
  const words = EVENT_TEXT[status] ?? status;
  return reason ? `${words}: ${reason}` : words;
};

/**
 * Each event's icon and the colours of its bubble. The deletion row's blue is the default; a new
 * borrower is green; Approved is quiet (a neutral ring round a green check) and Rejected is loud
 * (filled red), as on the borrower's own pill. The words always say it too: never the colour alone.
 */
const LOOKS: Record<string, { icon: Icon; bubble: string }> = {
  borrower_created: { icon: UserPlus, bubble: "bg-success/10 text-success dark:bg-success/20" },
  approved: { icon: CheckCircle, bubble: "bg-white text-success ring-1 ring-inset ring-stroke dark:bg-boxdark dark:ring-strokedark" },
  rejected: { icon: XCircle, bubble: "bg-danger text-white" },
};
const STATUS_LOOK = { icon: Activity, bubble: "bg-primary/10 text-primary dark:bg-primary/20" };

/**
 * When it happened, from the server's Manila wall-clock 'Y-m-d H:i:s': the time ("2:45 PM") on
 * Manila's today, whatever the browser's zone, and the day ("Oct 3") before it. Pinned to +08:00
 * and formatted in Manila, so the digits shown are the digits stored (as formatSubmitted does).
 */
const formatAt = (at: string, today: string): string => {
  const date = new Date(`${at.replace(" ", "T")}+08:00`);
  if (Number.isNaN(date.getTime())) return "";
  const shown: Intl.DateTimeFormatOptions = at.slice(0, 10) === today ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" };
  return date.toLocaleString("en-PH", { timeZone: "Asia/Manila", ...shown });
};

/** Processing opens the borrower (the application when it has none); Call Center, which cannot open a borrower, opens the application. */
export const hrefFor = (item: ApplicationNotification, opensBorrower: boolean): string =>
  opensBorrower && item.borrower_id ? `/borrowers/${item.borrower_id}` : `/applications/${item.application_id}`;

/**
 * One Applications item in the header bell, in the deletion row's shape: the icon's bubble, the
 * applicant's name (in capitals, as the application pages draw it), what happened (two lines at
 * most: a reason can be long), then the branch and the time. The whole row is one link, well over
 * 48px tall. `today` is Manila's day (manilaToday), which says whether the time or the date shows.
 */
const ApplicationNotificationRow: React.FC<{ item: ApplicationNotification; href: string; today: string; onOpen: () => void }> = ({
  item,
  href,
  today,
  onOpen,
}) => {
  const look = LOOKS[item.status] ?? STATUS_LOOK;
  const EventIcon = look.icon;
  const meta = [item.branch_name, formatAt(item.at, today)].filter(Boolean).join(" · ");
  return (
    <li>
      <Link
        href={href}
        onClick={onOpen}
        className="flex items-start gap-3 px-4.5 py-3 transition-colors hover:bg-gray-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-meta-4"
      >
        <span aria-hidden="true" className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${look.bubble}`}>
          <EventIcon size={16} />
        </span>
        {/* The spaces between the lines are for the link's name as read: the lines are blocks, so they show nothing. */}
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-medium uppercase text-black dark:text-white">{item.full_name}</span>{' '}
          <span className="mt-0.5 line-clamp-2 break-words text-xs text-black dark:text-bodydark">{eventText(item)}</span>{' '}
          {meta && <span className="mt-0.5 block text-xs text-body dark:text-bodydark2">{meta}</span>}
        </span>
      </Link>
    </li>
  );
};

export default ApplicationNotificationRow;
