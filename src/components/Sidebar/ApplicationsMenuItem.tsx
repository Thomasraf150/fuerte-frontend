import Link from "next/link";

/**
 * "Applications" sidebar entry, shared by the default, Owner and Accounting
 * sidebars and by the Call Center menu.
 *
 * Classes match the Borrowers item exactly, plus `min-h-12 lg:min-h-0`: a 48px
 * touch target while the sidebar is the phone/tablet drawer (below lg), and the
 * siblings' natural height once it is the static desktop column.
 *
 * Active on /applications and pages under it, never on a sibling route such
 * as /applications-archive.
 */
const ApplicationsMenuItem = ({ pathname }: { pathname: string }) => {
  const active =
    pathname === "/applications" || pathname.startsWith("/applications/");
  return (
    <li>
      <Link
        href="/applications"
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 min-h-12 lg:min-h-0 ${
          active ? "bg-graydark dark:bg-meta-4" : ""
        }`}
      >
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
        Applications
      </Link>
    </li>
  );
};

export default ApplicationsMenuItem;
