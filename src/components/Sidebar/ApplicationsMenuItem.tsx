"use client";

import React, { useId } from "react";
import Link from "next/link";
import SidebarLinkGroup from "./SidebarLinkGroup";
import { applicationsNav } from "./applicationsNav";
import { NAV_CURRENT, NAV_GROUP_HAS } from "./currentNav";

/*
 * Classes match the other link groups (Loans, Payments), plus `min-h-12 lg:min-h-10` on
 * every control: a 48px touch target while the sidebar is the phone/tablet drawer (below
 * lg), and 40px once it is the static desktop column.
 */
const TOGGLE =
  "group relative flex w-full items-center gap-2.5 rounded-lg px-4 py-2 text-left font-medium text-bodydark1 duration-300 ease-in-out hover:bg-white/5 dark:hover:bg-white/5 min-h-12 lg:min-h-10";
const SUB_LINK =
  "group relative flex items-center gap-2.5 rounded-lg px-4 py-2 font-medium duration-300 ease-in-out hover:text-white min-h-12 lg:min-h-10";

/** The same document icon this menu item has always had. */
const DocumentIcon = () => (
  <svg
    className="fill-current"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v2H8v-2zm0 4h5v2H8v-2z"
      fill=""
    />
  </svg>
);

/** The other link groups' chevron: it turns over while the group is open. */
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${open ? "rotate-180" : ""}`}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
      fill=""
    />
  </svg>
);

interface SubLinkProps {
  href: string;
  active: boolean;
  /** The Accounting sidebar's smaller sub-menu text. */
  compact: boolean;
  children: React.ReactNode;
}

const SubLink = ({ href, active, compact, children }: SubLinkProps) => (
  <li>
    <Link
      href={href}
      data-nav-own=""
      aria-current={active ? "page" : undefined}
      className={`${SUB_LINK} ${compact ? "text-sm" : ""} text-bodydark2 ${NAV_CURRENT}`}
    >
      {children}
    </Link>
  </li>
);

/**
 * "Applications" sidebar dropdown, shared by the default, Owner and Accounting sidebars
 * and by the Call Center menu. Two items: Applications (/applications) and Source
 * tracker (/applications/tracker). The group is open on any page under /applications
 * (applicationsNav says which item is current).
 *
 * The toggle is a button, so Enter and Space both work and it reports aria-expanded; the
 * older groups' `<a href="#">` toggles do neither.
 *
 * `compact` matches the Accounting sidebar, whose sub-menus are indented less and set in
 * smaller text than the other two.
 */
const ApplicationsMenuItem = ({ pathname, compact = false }: { pathname: string; compact?: boolean }) => {
  const nav = applicationsNav(pathname);
  const menuId = useId();
  return (
    <SidebarLinkGroup activeCondition={nav.inGroup}>
      {(handleClick, open) => (
        <React.Fragment>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={handleClick}
            className={`${TOGGLE} ${NAV_GROUP_HAS}`}
          >
            <DocumentIcon />
            Applications
            <ChevronIcon open={open} />
          </button>
          <div id={menuId} className={`overflow-hidden ${open ? "" : "hidden"}`}>
            <ul className={`mb-3 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-2 ${compact ? "ml-4" : "ml-6"}`}>
              <SubLink href="/applications" active={nav.list} compact={compact}>
                Applications
              </SubLink>
              <SubLink href="/applications/tracker" active={nav.tracker} compact={compact}>
                Source tracker
              </SubLink>
            </ul>
          </div>
        </React.Fragment>
      )}
    </SidebarLinkGroup>
  );
};

export default ApplicationsMenuItem;
