import React from "react";
import Link from "next/link";
import type { MoveHistoryLine } from "@/hooks/useBorrowerMove";

/** "2026-10-28 13:30:00" (Manila wall clock, as stored) → "Oct 28, 2026, 1:30 PM", read in no zone. */
const formatMovedAt = (at: string | null): string => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(at ?? "");
  if (!parts) return at ?? "";
  const [, y, m, d, hh, mm] = parts.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return date.toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** What happened, in words: a move counts what went along, a copy links to the other record. */
const whatHappened = (line: MoveHistoryLine): React.ReactNode => {
  const other = line.other_borrower_id;
  const link = (text: string) =>
    other ? (
      <Link href={`/borrowers/${other}`} className="font-semibold text-primary underline-offset-4 hover:underline dark:text-olive-300">
        {text}
      </Link>
    ) : (
      text
    );
  if (line.kind === "copied_to") return <>Copied as a new borrower: {link("open the copy")}</>;
  if (line.kind === "copied_from") return <>This borrower is a copy: {link("open the original")}</>;
  return `${plural(line.loans_moved, "loan", "loans")}, ${plural(line.applications_moved, "application", "applications")} moved along`;
};

/** The borrower's past moves and copies, newest first: from, to, when, who, why, and what went along. */
const MoveHistory: React.FC<{ lines: MoveHistoryLine[] }> = ({ lines }) => {
  if (lines.length === 0) {
    return <p className="text-sm text-body dark:text-bodydark">This borrower has not been moved or copied before.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {lines.map((line, index) => (
        <li key={`${line.moved_at}-${index}`} className="border-l-2 border-accent pl-3">
          <p className="text-sm font-semibold text-black dark:text-white">
            {line.from_branch ?? "Unknown branch"} <span aria-hidden="true">→</span>
            <span className="sr-only">to</span> {line.to_branch ?? "Unknown branch"}
          </p>
          <p className="text-xs text-body dark:text-bodydark">
            {formatMovedAt(line.moved_at)}
            {line.moved_by ? ` · by ${line.moved_by}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-body dark:text-bodydark">{whatHappened(line)}</p>
          {line.reason && <p className="mt-1 break-words text-sm text-black dark:text-bodydark1">“{line.reason}”</p>}
        </li>
      ))}
    </ol>
  );
};

export default MoveHistory;
