"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarLinkGroup from "./SidebarLinkGroup";
import { Server } from 'react-feather';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const SidebarAcctg = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  let storedSidebarExpanded = "true";

  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true",
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [sidebarOpen]);

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== "Escape") return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <Link href="/">
          <Image
            width={0}
            height={0}
            sizes="240px"
            src={"/images/logo/fuerte-logo.png"}
            alt="Logo"
            priority
            style={{ width: '240px', height: 'auto' }}
          />
        </Link>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <svg
            className="fill-current"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
        </button>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          {/* <!-- System Group --> */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              ACCOUNTING DASBOARD
            </h3>


            <ul className="mb-6 flex flex-col gap-1.5">
              {/* <!-- Dashboard Item --> */}
              <SidebarLinkGroup
                  activeCondition={pathname === "/"}
                >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <Link
                        href="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          pathname === "/" && "bg-graydark dark:bg-meta-4"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.70005C7.84697 1.7438 7.05947 0.956299 6.10322 0.956299ZM6.60947 6.27192C6.60947 6.55005 6.38135 6.7782 6.10322 6.7782H2.53135C2.25322 6.7782 2.02510 6.55005 2.02510 6.27192V2.70005C2.02510 2.42192 2.25322 2.1938 2.53135 2.1938H6.10322C6.38135 2.1938 6.60947 2.42192 6.60947 2.70005V6.27192Z" fill="" />
                          <path d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.70005C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.27192C15.9752 6.55005 15.7471 6.7782 15.4689 6.7782H11.8971C11.6189 6.7782 11.3908 6.55005 11.3908 6.27192V2.70005C11.3908 2.42192 11.6189 2.1938 11.8971 2.1938H15.4689C15.7471 2.1938 15.9752 2.42192 15.9752 2.70005V6.27192Z" fill="" />
                          <path d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.672C7.84697 10.7157 7.05947 9.92822 6.10322 9.92822ZM6.60947 15.2438C6.60947 15.522 6.38135 15.7501 6.10322 15.7501H2.53135C2.25322 15.7501 2.02510 15.522 2.02510 15.2438V11.672C2.02510 11.3938 2.25322 11.1657 2.53135 11.1657H6.10322C6.38135 11.1657 6.60947 11.3938 6.60947 11.672V15.2438Z" fill="" />
                          <path d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.672C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.2438C15.9752 15.522 15.7471 15.7501 15.4689 15.7501H11.8971C11.6189 15.7501 11.3908 15.522 11.3908 15.2438V11.672C11.3908 11.3938 11.6189 11.1657 11.8971 11.1657H15.4689C15.7471 11.1657 15.9752 11.3938 15.9752 11.672V15.2438Z" fill="" />
                        </svg>
                          Dashboard
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && "rotate-180"
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </Link>
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && "hidden"
                        }`}
                      >
                        <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                          <li>
                            <Link
                              href="/"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/" && "text-white"
                              }`}
                            >
                              Summary
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>

              {/* <!-- Reports Item Settings --> */}
              <SidebarLinkGroup
                  activeCondition={
                    pathname === "/accounting/unadjusted-trial-balance" ||
                    pathname === "/accounting/adjusting-entries" ||
                    pathname === "/accounting/adjusted-trial-balance" ||
                    pathname === "/accounting/balance-sheet" ||
                    pathname === "/accounting/cash-flow" ||
                    pathname === "/accounting/cash-position" ||
                    pathname === "/accounting/aging" ||
                    pathname === "/accounting/closing-entries" ||
                    pathname === "/accounting/refund-schedule" ||
                    pathname === "/accounting/udi-schedule" ||
                    pathname === "/accounting/commission-schedule"
                  }
                >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      {/* <!-- Dropdown Menu End --> */}
                      <Link
                        href="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          (
                            pathname === "/accounting/unadjusted-trial-balance" ||
                            pathname === "/accounting/adjusting-entries" ||
                            pathname === "/accounting/adjusted-trial-balance" ||
                            pathname === "/accounting/balance-sheet" ||
                            pathname === "/accounting/cash-flow" ||
                            pathname === "/accounting/cash-position" ||
                            pathname === "/accounting/aging" ||
                            pathname === "/accounting/closing-entries" ||
                            pathname === "/accounting/refund-schedule" ||
                            pathname === "/accounting/udi-schedule" ||
                            pathname === "/accounting/commission-schedule"
                            ) && "bg-graydark dark:bg-meta-4"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <Server size={14} /> 
                          Reports
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && "rotate-180"
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </Link>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && "hidden"
                        }`}
                      >
                        <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                          <li>
                            <Link
                              href="/accounting/unadjusted-trial-balance"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/unadjusted-trial-balance" && "text-white"
                              }`}
                            >
                              Unadjusted Trial Balance
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/adjusting-entries"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/adjusting-entries" && "text-white"
                              }`}
                            >
                              Adjusting Entries
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/adjusted-trial-balance"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/adjusted-trial-balance" && "text-white"
                              }`}
                            >
                              Adjusted Trial Balance
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/balance-sheet"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/balance-sheet" && "text-white"
                              }`}
                            >
                              Balance Sheet
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/cash-flow"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/cash-flow" && "text-white"
                              }`}
                            >
                              Cash Flow
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/cash-position"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/cash-position" && "text-white"
                              }`}
                            >
                              Cash Position
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/aging"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/aging" && "text-white"
                              }`}
                            >
                              Aging
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/closing-entries"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/closing-entries" && "text-white"
                              }`}
                            >
                              Closing Entries
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/refund-schedule"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/refund-schedule" && "text-white"
                              }`}
                            >
                              Refund Schedule
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/udi-schedule"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/udi-schedule" && "text-white"
                              }`}
                            >
                              UDI Schedule
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/commission-schedule"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/commission-schedule" && "text-white"
                              }`}
                            >
                              Commission Schedule
                            </Link>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- Reports Item Settings --> */}

              {/* <!-- Voucher Item Settings --> */}
              <SidebarLinkGroup
                  activeCondition={
                    pathname === "/accounting/general-voucher" ||
                    pathname === '/accounting/debit-memo' ||
                    pathname === "/accounting/credit-memo"
                  }
                >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      {/* <!-- Dropdown Menu End --> */}
                      <Link
                        href="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          (pathname === "/accounting/general-voucher" ||
                            pathname === '/accounting/debit-memo' ||
                            pathname === "/accounting/credit-memo"
                            ) && "bg-graydark dark:bg-meta-4"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <Server size={14} /> 
                          Vouchers
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && "rotate-180"
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </Link>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && "hidden"
                        }`}
                      >
                        <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                          <li>
                            <Link
                              href="/accounting/general-voucher"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/general-voucher" && "text-white"
                              }`}
                            >
                              General Voucher
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/debit-memo"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/debit-memo" && "text-white"
                              }`}
                            >
                              Debit Memo
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/credit-memo"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/credit-memo" && "text-white"
                              }`}
                            >
                              Credit Memo
                            </Link>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- Voucher Item Settings --> */}


              {/* <!-- Voucher Item Settings --> */}
              <SidebarLinkGroup
                  activeCondition={
                    pathname === "/accounting/general-journal" ||
                    pathname === '/accounting/cdj' ||
                    pathname === "/accounting/crj"
                  }
                >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      {/* <!-- Dropdown Menu End --> */}
                      <Link
                        href="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          (pathname === "/accounting/general-journal" ||
                            pathname === '/accounting/cdj' ||
                            pathname === "/accounting/crj"
                            ) && "bg-graydark dark:bg-meta-4"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <Server size={14} /> 
                          Journal
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && "rotate-180"
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </Link>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && "hidden"
                        }`}
                      >
                        <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                          <li>
                            <Link
                              href="/accounting/general-journal"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/general-journal" && "text-white"
                              }`}
                            >
                              General Journal
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/cdj"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/cdj" && "text-white"
                              }`}
                            >
                              Cash Disbursements Journal
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/crj"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/crj" && "text-white"
                              }`}
                            >
                              Cash Receipts Journal
                            </Link>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- Voucher Item Settings --> */}

                 {/* <!-- Menu Item General Journal --> */}
              <li>
                <Link
                  href="/accounting/general-ledger"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                    pathname.includes("accounting/general-ledger") &&
                    "bg-graydark dark:bg-meta-4"
                  }`}
                >
                  <Server size={14} /> 
                  General Ledger
                </Link>
              </li>

              {/* <!-- Coa Item Settings --> */}
              <SidebarLinkGroup
                  activeCondition={
                    pathname === "/accounting/coa" || pathname.includes("accounting/coa")
                  }
                >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      {/* <!-- Dropdown Menu End --> */}
                      <Link
                        href="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          (pathname === "/accounting/coa" 
                            // ||
                            // pathname === '/pending-release-loans' ||
                            // pathname.includes("dashboard") || 
                            //   pathname.includes("pending-release-loans")
                            ) && "bg-graydark dark:bg-meta-4"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <svg
                          className="fill-current"
                          fill="none"
                          width="18"
                          height="18"
                          viewBox="1 4 21 15"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M21.32,9.55l-1.89-.63.89-1.78A1,1,0,0,0,20.13,6L18,3.87a1,1,0,0,0-1.15-.19l-1.78.89-.63-1.89A1,1,0,0,0,13.5,2h-3a1,1,0,0,0-.95.68L8.92,4.57,7.14,3.68A1,1,0,0,0,6,3.87L3.87,6a1,1,0,0,0-.19,1.15l.89,1.78-1.89.63A1,1,0,0,0,2,10.5v3a1,1,0,0,0,.68.95l1.89.63-.89,1.78A1,1,0,0,0,3.87,18L6,20.13a1,1,0,0,0,1.15.19l1.78-.89.63,1.89a1,1,0,0,0,.95.68h3a1,1,0,0,0,.95-.68l.63-1.89,1.78.89A1,1,0,0,0,18,20.13L20.13,18a1,1,0,0,0,.19-1.15l-.89-1.78,1.89-.63A1,1,0,0,0,22,13.5v-3A1,1,0,0,0,21.32,9.55ZM20,12.78l-1.2.4A2,2,0,0,0,17.64,16l.57,1.14-1.1,1.1L16,17.64a2,2,0,0,0-2.79,1.16l-.4,1.2H11.22l-.4-1.2A2,2,0,0,0,8,17.64l-1.14.57-1.1-1.1L6.36,16A2,2,0,0,0,5.2,13.18L4,12.78V11.22l1.2-.4A2,2,0,0,0,6.36,8L5.79,6.89l1.1-1.1L8,6.36A2,2,0,0,0,10.82,5.2l.4-1.2h1.56l.4,1.2A2,2,0,0,0,16,6.36l1.14-.57,1.1,1.1L17.64,8a2,2,0,0,0,1.16,2.79l1.2.4ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z" />
                        </svg>
                          System
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && "rotate-180"
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </Link>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && "hidden"
                        }`}
                      >
                        <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                          <li>
                            <Link
                              href="/accounting/vendors"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/vendors" && "text-white"
                              }`}
                            >
                              Vendors
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/accounting/coa"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/accounting/coa" && "text-white"
                              }`}
                            >
                              Chart of Accounts
                            </Link>
                          </li>
                          {/* <li>
                            <Link
                              href="/accounting/loan-proceed-settings"
                              className={`group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                pathname === "/coa" && "text-white"
                              }`}
                            >
                              Loan Proceed Settings
                            </Link>
                          </li> */}
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- System Item Settings --> */}
            </ul>
          </div>

        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default SidebarAcctg;
