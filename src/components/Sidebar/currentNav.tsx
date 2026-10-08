"use client";

import { createContext, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * One current page in a sidebar.
 *
 * The page link the user is on carries aria-current="page" and gets the strongest look (the
 * filled olive bar with a gold marker). The open group that holds it gets only a bolder
 * heading. Exactly one link is current: the one whose href is the longest prefix of the path,
 * so /renewable-borrowers does not light up /borrowers and /loans-list/123 lights up Loans List.
 *
 * The sidebars repeat their link markup by hand, so the current link is found in the rendered
 * nav (a[href]) rather than from a second list of hrefs that could drift from the links.
 * Links that set aria-current themselves carry data-nav-own and are left alone.
 */

/** Strongest state: the page the user is on. Needs aria-current="page" on the link. */
export const NAV_CURRENT =
  "aria-[current=page]:!bg-primary aria-[current=page]:font-semibold aria-[current=page]:text-white " +
  "aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2 aria-[current=page]:before:left-0 " +
  "aria-[current=page]:before:w-1 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-secondary " +
  "aria-[current=page]:before:content-['']";

/** Subtle state for the heading of the group that holds the current page: bold text, no fill. */
export const NAV_GROUP_HAS =
  "group-has-[[aria-current=page]]/nav:font-bold group-has-[[aria-current=page]]/nav:text-white";

/** The href of the current link once the nav has been read; null if none; undefined outside a sidebar. */
export const NavCurrentContext = createContext<string | null | undefined>(undefined);

const isUnder = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

export function useCurrentNav(pathname: string) {
  const navRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let best: HTMLAnchorElement | null = null;
    nav.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      if (a.hasAttribute("data-nav-own")) return;
      a.removeAttribute("aria-current");
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/") || !isUnder(pathname, href)) return;
      if (!best || href.length > (best.getAttribute("href") ?? "").length) best = a;
    });
    const found = best as HTMLAnchorElement | null;
    found?.setAttribute("aria-current", "page");
    setCurrent(found ? found.getAttribute("href") : null);
  }, [pathname]);

  // After the group holding the link has opened, bring the link into view (long groups).
  // Instant, so prefers-reduced-motion needs no special case.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const link = navRef.current?.querySelector<HTMLElement>('a[aria-current="page"]');
      const box = link?.closest<HTMLElement>(".overflow-y-auto");
      if (!link || !box) return;
      const l = link.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      if (l.bottom > b.bottom) box.scrollTop += l.bottom - b.bottom + 8;
      else if (l.top < b.top) box.scrollTop -= b.top - l.top + 8;
    });
    return () => cancelAnimationFrame(frame);
  }, [current, pathname]);

  return { navRef, current };
}
