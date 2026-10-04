/**
 * Which parts of the Applications menu a path lights up. Pure, so the Playwright runner
 * tests it directly: tests/e2e/27-application-page/source-tracker.spec.ts.
 *
 *   /applications, /applications/new, /applications/<id>  ->  Applications
 *   /applications/tracker                                  ->  Source tracker
 *
 * The group is open for all of them, and for no sibling route such as /applications-archive.
 */
export interface ApplicationsNav {
  /** On /applications or any page under it: the group is open and highlighted. */
  inGroup: boolean;
  /** "Applications": the list, New application and one application's page. */
  list: boolean;
  /** "Source tracker". */
  tracker: boolean;
}

export const applicationsNav = (pathname: string): ApplicationsNav => {
  const inGroup = pathname === "/applications" || pathname.startsWith("/applications/");
  const tracker = pathname === "/applications/tracker" || pathname.startsWith("/applications/tracker/");
  return { inGroup, list: inGroup && !tracker, tracker };
};
