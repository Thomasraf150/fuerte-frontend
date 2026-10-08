import Link from "next/link";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownUser from "./DropdownUser";
import DropdownNotification from "./DropdownNotification";
import { CastleMark } from "@/components/Brand/BrandLockup";
import { Menu, X } from "react-feather";
import { GlobalSearchBox, GlobalSearchLink } from "./GlobalSearch";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  return (
    <header className="sticky top-0 z-999 flex w-full border-b border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
      <div className="flex min-h-16 flex-grow items-center justify-between gap-2 px-3 py-2.5 sm:px-4 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* The menu button: a plain icon and the word, 48px (UI modernisation B, Phase 6c). */}
          <button
            type="button"
            aria-controls="sidebar"
            aria-expanded={Boolean(props.sidebarOpen)}
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 inline-flex min-h-12 items-center gap-1.5 rounded-lg border border-field bg-white px-2.5 text-sm font-semibold text-black hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-field-dark dark:bg-boxdark dark:text-white lg:hidden"
          >
            {props.sidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            Menu
          </button>

          <Link className="block flex-shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden" href="/" aria-label="Fuerte home">
            <CastleMark className="h-10 w-10" />
          </Link>
        </div>


        {/* The universal search (UI modernisation B, Phase 5): the box from lg, on the empty left. */}
        <GlobalSearchBox />
        <div className="flex items-center gap-2 2xsm:gap-7 ml-auto">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/* Below lg: the search as a worded link. */}
            <li className="lg:hidden"><GlobalSearchLink /></li>
            {/* <!-- Dark Mode Toggler --> */}
            {/* Phones: the switch lives in the user menu, so the worded Search fits at 360px. */}
            <DarkModeSwitcher className="hidden sm:block" />
            {/* <!-- Dark Mode Toggler --> */}

            {/* <!-- Deletion-Approval bell --> */}
            <DropdownNotification />
            {/* <!-- /Deletion-Approval bell --> */}
          </ul>

          {/* <!-- User Area --> */}
          <DropdownUser />
          {/* <!-- User Area --> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
