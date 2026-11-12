"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, CheckSquare, Server, TrendingUp } from "react-feather";
import SidebarLinkGroup from "./SidebarLinkGroup";
import { NAV_CURRENT, NAV_GROUP_HAS } from "./currentNav";

/**
 * The menu groups the role sidebars share (claude-docs/collections-reports.md, "Navigation"): one
 * definition, so a screen added to Treasury, a label or a role rule is the same in the Owner, staff
 * and Accounting menus. Each sidebar places the groups it shows; an item can be limited to roles
 * (role codes: OWN, ACCTG, COL, PROC, ...).
 */
type NavLink = { href: string; label: string; onlyFor?: string[]; notFor?: string[] };
type NavSection = { heading: string; links: NavLink[] };
export type NavGroupDef = { key: string; label: string; icon: "peso" | "briefcase" | "trend" | "server" | "check"; items: (NavLink | NavSection)[] };

export const COLLECTIONS: NavGroupDef = {
  key: "collections", label: "Collections", icon: "peso",
  items: [
    { href: "/atm-collections", label: "ATM Collections" },
    { href: "/payment-posting", label: "Payment Posting" },
    // /collection-list is the log of posted payments; the ATM paper list is the Collection List.
    { href: "/collection-list", label: "Posted Payments" },
    { href: "/statement-of-account", label: "Statement of Account" },
  ],
};

export const TREASURY: NavGroupDef = {
  key: "treasury", label: "Treasury", icon: "briefcase",
  items: [
    // ReleaseStandingService::VIEW_ROLES: not Collection or Processing staff.
    { href: "/release-status", label: "Release Status", notFor: ["COL", "PROC"] },
    { href: "/atm-collections/refunds", label: "Refunds & Funds" },
    { href: "/opex", label: "OPEX Fund" },
  ],
};

export const COLLECTION_REPORTS: NavGroupDef = {
  key: "collection-reports", label: "Collection Reports", icon: "trend",
  items: [
    { href: "/collection-efficiency", label: "Collection Efficiency" },
    { href: "/problem-accounts", label: "Problem Accounts" },
    { href: "/renewable-borrowers", label: "Renewable Borrowers" },
  ],
};

export const FINANCIAL_REPORTS: NavGroupDef = {
  key: "financial-reports", label: "Financial Reports", icon: "server",
  items: [
    { heading: "Statements", links: [
      { href: "/accounting/balance-sheet", label: "Balance Sheet" },
      { href: "/accounting/income-statement", label: "Income Statement", onlyFor: ["OWN"] }, // OwnerGuard page
      { href: "/accounting/daily-income-statement", label: "Daily Income Statement" },
      { href: "/accounting/cash-flow", label: "Cash Flow" },
      { href: "/accounting/treasury-cash", label: "Treasury Cash Report" },
      { href: "/accounting/cash-position", label: "Cash Position" },
    ] },
    { heading: "Schedules", links: [
      { href: "/accounting/aging", label: "Aging" },
      { href: "/accounting/refund-schedule", label: "Refund Schedule" },
      { href: "/accounting/udi-schedule", label: "UDI Schedule" },
      // The Owner's real commission schedule; /accounting/commission-schedule is still a placeholder.
      { href: "/commission-schedule", label: "Commission Schedule", onlyFor: ["OWN"] },
      { href: "/accounting/commission-schedule", label: "Commission Schedule", notFor: ["OWN"] },
    ] },
  ],
};

export const PERIOD_CLOSE: NavGroupDef = {
  key: "period-close", label: "Period Close", icon: "check",
  items: [
    { href: "/accounting/unadjusted-trial-balance", label: "Unadjusted Trial Balance" },
    { href: "/accounting/adjusting-entries", label: "Adjusting Entries" },
    { href: "/accounting/adjusted-trial-balance", label: "Adjusted Trial Balance" },
    { href: "/accounting/closing-entries", label: "Closing Entries" },
  ],
};

const shows = (link: NavLink, role: string) =>
  (!link.onlyFor || link.onlyFor.includes(role)) && !(link.notFor ?? []).includes(role);

const ICONS: Record<NavGroupDef["icon"], React.ReactNode> = {
  peso: (
    <svg className="fill-current" width="18" height="18" viewBox="2 3 17 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  ),
  briefcase: <Briefcase size={16} aria-hidden="true" />,
  trend: <TrendingUp size={16} aria-hidden="true" />,
  server: <Server size={14} aria-hidden="true" />,
  check: <CheckSquare size={14} aria-hidden="true" />,
};

const HEAD = `group relative flex items-center gap-2.5 min-h-12 lg:min-h-10 rounded-lg px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-white/5 dark:hover:bg-white/5 ${NAV_GROUP_HAS}`;
const SUB = `group relative flex items-center gap-2.5 min-h-12 lg:min-h-10 rounded-lg px-4 py-2 text-sm font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${NAV_CURRENT}`;
const SUBHEAD = "px-4 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-bodydark2/70";

const Links: React.FC<{ links: NavLink[]; role: string }> = ({ links, role }) => (
  <>
    {links.filter((l) => shows(l, role)).map((l) => (
      <li key={l.href}><Link href={l.href} className={SUB}>{l.label}</Link></li>
    ))}
  </>
);

/**
 * One shared group as the sidebars draw it: heading with icon and chevron, then its links (with
 * labelled sub-lists for sections). It opens itself when it holds the current page (SidebarLinkGroup).
 */
export const NavGroup: React.FC<{
  group: NavGroupDef;
  role: string;
  pathname: string;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
}> = ({ group, role, pathname, sidebarExpanded, setSidebarExpanded }) => {
  const hrefs = group.items.flatMap((i) => ("links" in i ? i.links : [i])).filter((l) => shows(l, role)).map((l) => l.href);
  if (hrefs.length === 0) return null;
  return (
    <SidebarLinkGroup activeCondition={hrefs.includes(pathname)}>
      {(handleClick, open) => (
        <React.Fragment>
          <Link href="#" className={HEAD} aria-expanded={open}
            onClick={(e) => { e.preventDefault(); if (sidebarExpanded) handleClick(); else setSidebarExpanded(true); }}>
            {ICONS[group.icon]}
            {group.label}
            <svg aria-hidden="true" className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
              width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z" fill="" />
            </svg>
          </Link>
          <div className={`translate transform overflow-hidden ${!open ? "hidden" : ""}`}>
            <ul className="mb-3 ml-6 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-2">
              {group.items.map((item) => ("links" in item ? (
                <li key={item.heading}>
                  <p id={`nav-${group.key}-${item.heading.toLowerCase()}`} className={SUBHEAD}>{item.heading}</p>
                  <ul aria-labelledby={`nav-${group.key}-${item.heading.toLowerCase()}`} className="flex flex-col gap-0.5">
                    <Links links={item.links} role={role} />
                  </ul>
                </li>
              ) : <Links key={item.href} links={[item]} role={role} />))}
            </ul>
          </div>
        </React.Fragment>
      )}
    </SidebarLinkGroup>
  );
};
