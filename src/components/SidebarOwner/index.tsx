"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarLinkGroup from "@/components/Sidebar/SidebarLinkGroup";
import { Server } from 'react-feather';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const ChevronIcon = () => (
  <svg
    className="absolute right-4 top-1/2 -translate-y-1/2 fill-current"
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
);

const SidebarOwner = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  let storedSidebarExpanded = "true";
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true",
  );

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [sidebarOpen]);

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

  const groupClick = (handleClick: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    sidebarExpanded ? handleClick() : setSidebarExpanded(true);
  };

  const linkClass = (active: boolean) =>
    `group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${active ? "bg-graydark dark:bg-meta-4" : ""}`;

  const subLinkClass = (active: boolean) =>
    `group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${active ? "text-white" : ""}`;

  const subLinkSmClass = (active: boolean) =>
    `group relative text-sm flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${active ? "text-white" : ""}`;

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* SIDEBAR HEADER */}
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
          <svg className="fill-current" width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z" fill="" />
          </svg>
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          {/* ===== DASHBOARD ===== */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">DASHBOARD</h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {/* Dashboard */}
              <SidebarLinkGroup activeCondition={pathname === "/" || pathname.includes("dashboard")}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(pathname === "/" || pathname.includes("dashboard"))} onClick={groupClick(handleClick)}>
                      <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299ZM6.60947 6.30005C6.60947 6.5813 6.38447 6.8063 6.10322 6.8063H2.53135C2.2501 6.8063 2.0251 6.5813 2.0251 6.30005V2.72817C2.0251 2.44692 2.2501 2.22192 2.53135 2.22192H6.10322C6.38447 2.22192 6.60947 2.44692 6.60947 2.72817V6.30005Z" fill="" />
                        <path d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.72817C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.30005C15.9752 6.5813 15.7502 6.8063 15.4689 6.8063H11.8971C11.6158 6.8063 11.3908 6.5813 11.3908 6.30005V2.72817C11.3908 2.44692 11.6158 2.22192 11.8971 2.22192H15.4689C15.7502 2.22192 15.9752 2.44692 15.9752 2.72817V6.30005Z" fill="" />
                        <path d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.7001C7.8751 10.7157 7.0876 9.92822 6.10322 9.92822ZM6.60947 15.272C6.60947 15.5532 6.38447 15.7782 6.10322 15.7782H2.53135C2.2501 15.7782 2.0251 15.5532 2.0251 15.272V11.7001C2.0251 11.4188 2.2501 11.1938 2.53135 11.1938H6.10322C6.38447 11.1938 6.60947 11.4188 6.60947 11.7001V15.272Z" fill="" />
                        <path d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.7001C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.272C15.9752 15.5532 15.7502 15.7782 15.4689 15.7782H11.8971C11.6158 15.7782 11.3908 15.5532 11.3908 15.272V11.7001C11.3908 11.4188 11.6158 11.1938 11.8971 11.1938H15.4689C15.7502 11.1938 15.9752 11.4188 15.9752 11.7001V15.272Z" fill="" />
                      </svg>
                      Dashboard
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                        <li><Link href="/" className={subLinkClass(pathname === "/")}>Summary</Link></li>
                        <li><Link href="/accounting-dashboard" className={subLinkClass(pathname === "/accounting-dashboard")}>Accounting Dashboard</Link></li>
                        <li><Link href="/notes-receivable" className={subLinkClass(pathname === "/notes-receivable")}>Notes Receivable</Link></li>
                        <li><Link href="/commission-schedule" className={subLinkClass(pathname === "/commission-schedule")}>Commission Schedule</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Borrowers */}
              <li>
                <Link href="/borrowers" className={linkClass(pathname.includes("borrowers"))}>
                  <svg className="fill-current" width="18" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.99978 -0.000028C11.3134 -0.000028 13.9996 2.68619 13.9996 5.9998C13.9996 9.3134 11.3134 11.9996 7.99978 11.9996C4.68616 11.9996 1.99994 9.3134 1.99994 5.9998C1.99994 2.68619 4.68616 -0.000028 7.99978 -0.000028zM0.999972 22.0984C0.447703 22.0984 0 21.6507 0 21.0984V18.9994C0 16.2381 2.23851 13.9996 4.99986 13.9996H11.0004C13.7617 13.9996 16.0003 16.2381 16.0003 18.9994V21.0984C16.0003 21.6507 15.5526 22.0984 15.0003 22.0984C14.448 22.0984 1.55224 22.0984 0.999972 22.0984zM13.7484 11.563C15.142 10.1233 15.9996 8.16172 15.9996 5.9998C15.9996 3.83789 15.142 1.87627 13.7484 0.43658C14.4436 0.15502 15.2034 -0.000028 15.9996 -0.000028C19.3132 -0.000028 21.9994 2.68619 21.9994 5.9998C21.9994 9.3134 19.3132 11.9996 15.9996 11.9996C15.2034 11.9996 14.4436 11.8446 13.7484 11.563zM15.8992 13.9996H19.0002C21.7615 13.9996 24 16.2381 24 18.9994V21.0984C24 21.6507 23.5523 22.0984 23.0001 22.0984H17.8295C17.94 21.7856 18.0002 21.449 18.0002 21.0984V18.9994C18.0002 17.0408 17.1958 15.2701 15.8992 13.9996z" fill="" />
                  </svg>
                  Borrowers
                </Link>
              </li>
            </ul>

            {/* ===== TRANSACTIONS ===== */}
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">TRANSACTIONS</h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {/* Loans */}
              <SidebarLinkGroup activeCondition={pathname === "/loans-list" || pathname.includes("loans")}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(pathname === "/loans-list" || pathname.includes("loans"))} onClick={groupClick(handleClick)}>
                      <svg className="fill-current" fill="none" width="18" height="18" viewBox="0 4 14 10" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.978 14.043a4.224 4.224 0 0 0 1.077.139h.032v1.03a.435.435 0 0 1-.434.433H1.094a.435.435 0 0 1-.434-.434V3.237a.435.435 0 0 1 .434-.434h8.559a.435.435 0 0 1 .434.434v1.38l-.55.002a1.334 1.334 0 0 0-.559.124v-.832h-7.21v10.626h7.21v-.494zM4.995 7.452a1.068 1.068 0 0 1 .264.702 1.044 1.044 0 0 1-.524.902 1.677 1.677 0 0 1-.525.219v.238a.396.396 0 1 1-.792 0V9.28a1.844 1.844 0 0 1-.341-.107 1.19 1.19 0 0 1-.457-.335.396.396 0 1 1 .599-.518.413.413 0 0 0 .152.118 1.089 1.089 0 0 0 .205.066 1.616 1.616 0 0 0 .223.027.975.975 0 0 0 .505-.14c.163-.105.163-.194.163-.237a.28.28 0 0 0-.069-.181.637.637 0 0 0-.167-.135.86.86 0 0 0-.208-.074.98.98 0 0 0-.204-.02 2.058 2.058 0 0 1-.344-.028 1.575 1.575 0 0 1-.444-.143 1.287 1.287 0 0 1-.422-.34 1.09 1.09 0 0 1-.25-.682 1.103 1.103 0 0 1 .548-.933 1.66 1.66 0 0 1 .511-.208v-.228a.396.396 0 0 1 .792 0v.239a1.904 1.904 0 0 1 .348.121 1.369 1.369 0 0 1 .4.276.396.396 0 0 1-.559.56.578.578 0 0 0-.166-.114 1.121 1.121 0 0 0-.212-.074l-.023-.005a1.057 1.057 0 0 0-.174-.03.977.977 0 0 0-.494.132.32.32 0 0 0-.18.264.31.31 0 0 0 .074.183.503.503 0 0 0 .161.13.796.796 0 0 0 .22.071 1.27 1.27 0 0 0 .214.017 1.774 1.774 0 0 1 .373.038 1.654 1.654 0 0 1 .407.148 1.423 1.423 0 0 1 .396.314zm.881 3.186a4.195 4.195 0 0 0 .274.95H2.399v-.95zm1.184 2.303a4.25 4.25 0 0 0 .656.537H2.4v-.95h4.298a4.28 4.28 0 0 0 .363.413zm1.291-7.974H5.885v.95H8.35zm-1.193 1.89q-.05.047-.098.095a4.229 4.229 0 0 0-.661.856h-.514v-.95zm5.51 1.099a3.285 3.285 0 1 1-3.088-1.26v-.259h-.038a.475.475 0 0 1-.002-.95l1.026-.003h.001a.475.475 0 0 1 .002.95h-.04v.262a3.266 3.266 0 0 1 1.46.595l.336-.336a.475.475 0 0 1 .671.672l-.328.328zm-1.056 3.519a.475.475 0 0 0 0-.672L10.53 9.72V8.067a.475.475 0 0 0-.95 0V9.92a.474.474 0 0 0 .174.368l1.186 1.186a.475.475 0 0 0 .672 0z" />
                      </svg>
                      Loans
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                        <li><Link href="/loans-list" className={subLinkClass(pathname === "/loans-list")}>Loans List</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Payments */}
              <SidebarLinkGroup activeCondition={pathname === "/collection-list" || pathname === "/payment-posting" || pathname === "/statement-of-account"}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(pathname === "/collection-list" || pathname === "/payment-posting" || pathname === "/statement-of-account")} onClick={groupClick(handleClick)}>
                      <svg className="fill-current" width="18" height="18" viewBox="2 3 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                      </svg>
                      Payments
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                        <li><Link href="/collection-list" className={subLinkClass(pathname === "/collection-list")}>Collection Lists</Link></li>
                        <li><Link href="/payment-posting" className={subLinkClass(pathname === "/payment-posting")}>Payment Posting</Link></li>
                        <li><Link href="/statement-of-account" className={subLinkClass(pathname === "/statement-of-account")}>Statement of Account</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>
            </ul>

            {/* ===== ACCOUNTING ===== */}
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">ACCOUNTING</h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {/* Accounting Reports */}
              <SidebarLinkGroup
                activeCondition={
                  pathname === "/accounting/unadjusted-trial-balance" ||
                  pathname === "/accounting/adjusting-entries" ||
                  pathname === "/accounting/adjusted-trial-balance" ||
                  pathname === "/accounting/balance-sheet" ||
                  pathname === "/accounting/income-statement" ||
                  pathname === "/accounting/cash-flow" ||
                  pathname === "/accounting/cash-position" ||
                  pathname === "/accounting/aging" ||
                  pathname === "/accounting/closing-entries" ||
                  pathname === "/accounting/refund-schedule" ||
                  pathname === "/accounting/udi-schedule" ||
                  pathname === "/accounting/commission-schedule"
                }
              >
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(
                      pathname === "/accounting/unadjusted-trial-balance" ||
                      pathname === "/accounting/adjusting-entries" ||
                      pathname === "/accounting/adjusted-trial-balance" ||
                      pathname === "/accounting/balance-sheet" ||
                      pathname === "/accounting/income-statement" ||
                      pathname === "/accounting/cash-flow" ||
                      pathname === "/accounting/cash-position" ||
                      pathname === "/accounting/aging" ||
                      pathname === "/accounting/closing-entries" ||
                      pathname === "/accounting/refund-schedule" ||
                      pathname === "/accounting/udi-schedule" ||
                      pathname === "/accounting/commission-schedule"
                    )} onClick={groupClick(handleClick)}>
                      <Server size={14} />
                      Reports
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                        <li><Link href="/accounting/unadjusted-trial-balance" className={subLinkSmClass(pathname === "/accounting/unadjusted-trial-balance")}>Unadjusted Trial Balance</Link></li>
                        <li><Link href="/accounting/adjusting-entries" className={subLinkSmClass(pathname === "/accounting/adjusting-entries")}>Adjusting Entries</Link></li>
                        <li><Link href="/accounting/adjusted-trial-balance" className={subLinkSmClass(pathname === "/accounting/adjusted-trial-balance")}>Adjusted Trial Balance</Link></li>
                        <li><Link href="/accounting/balance-sheet" className={subLinkSmClass(pathname === "/accounting/balance-sheet")}>Balance Sheet</Link></li>
                        <li><Link href="/accounting/income-statement" className={subLinkSmClass(pathname === "/accounting/income-statement")}>Income Statement</Link></li>
                        <li><Link href="/accounting/cash-flow" className={subLinkSmClass(pathname === "/accounting/cash-flow")}>Cash Flow</Link></li>
                        <li><Link href="/accounting/cash-position" className={subLinkSmClass(pathname === "/accounting/cash-position")}>Cash Position</Link></li>
                        <li><Link href="/accounting/aging" className={subLinkSmClass(pathname === "/accounting/aging")}>Aging</Link></li>
                        <li><Link href="/accounting/closing-entries" className={subLinkSmClass(pathname === "/accounting/closing-entries")}>Closing Entries</Link></li>
                        <li><Link href="/accounting/refund-schedule" className={subLinkSmClass(pathname === "/accounting/refund-schedule")}>Refund Schedule</Link></li>
                        <li><Link href="/accounting/udi-schedule" className={subLinkSmClass(pathname === "/accounting/udi-schedule")}>UDI Schedule</Link></li>
                        <li><Link href="/accounting/commission-schedule" className={subLinkSmClass(pathname === "/accounting/commission-schedule")}>Commission Schedule</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Vouchers */}
              <SidebarLinkGroup
                activeCondition={
                  pathname === "/accounting/general-voucher" ||
                  pathname === "/accounting/debit-memo" ||
                  pathname === "/accounting/credit-memo"
                }
              >
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(
                      pathname === "/accounting/general-voucher" ||
                      pathname === "/accounting/debit-memo" ||
                      pathname === "/accounting/credit-memo"
                    )} onClick={groupClick(handleClick)}>
                      <Server size={14} />
                      Vouchers
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                        <li><Link href="/accounting/general-voucher" className={subLinkSmClass(pathname === "/accounting/general-voucher")}>General Voucher</Link></li>
                        <li><Link href="/accounting/debit-memo" className={subLinkSmClass(pathname === "/accounting/debit-memo")}>Debit Memo</Link></li>
                        <li><Link href="/accounting/credit-memo" className={subLinkSmClass(pathname === "/accounting/credit-memo")}>Credit Memo</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Journal */}
              <SidebarLinkGroup
                activeCondition={
                  pathname === "/accounting/general-journal" ||
                  pathname === "/accounting/cdj" ||
                  pathname === "/accounting/crj"
                }
              >
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(
                      pathname === "/accounting/general-journal" ||
                      pathname === "/accounting/cdj" ||
                      pathname === "/accounting/crj"
                    )} onClick={groupClick(handleClick)}>
                      <Server size={14} />
                      Journal
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-2">
                        <li><Link href="/accounting/general-journal" className={subLinkSmClass(pathname === "/accounting/general-journal")}>General Journal</Link></li>
                        <li><Link href="/accounting/cdj" className={subLinkSmClass(pathname === "/accounting/cdj")}>Cash Disbursements Journal</Link></li>
                        <li><Link href="/accounting/crj" className={subLinkSmClass(pathname === "/accounting/crj")}>Cash Receipts Journal</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* General Ledger */}
              <li>
                <Link href="/accounting/general-ledger" className={linkClass(pathname.includes("accounting/general-ledger"))}>
                  <Server size={14} />
                  General Ledger
                </Link>
              </li>
            </ul>

            {/* ===== SETTINGS ===== */}
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">SETTINGS</h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {/* Company */}
              <SidebarLinkGroup activeCondition={pathname === "/company-profile" || pathname === "/branch-setup" || pathname === "/users-setup"}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(pathname === "/company-profile" || pathname === "/branch-setup" || pathname === "/users-setup")} onClick={groupClick(handleClick)}>
                      <svg className="fill-current" fill="none" width="18" height="18" viewBox="-3 1 17 15" xmlns="http://www.w3.org/2000/svg">
                        <path id="Path_133" data-name="Path 133" d="M323.5-192h-9a1.5,1.5,0,0,0-1.5,1.5V-176h12v-14.5A1.5,1.5,0,0,0,323.5-192ZM318-177v-3h2v3Zm6,0h-3v-3.5a.5.5,0,0,0-.5-.5h-3a.5.5,0,0,0-.5.5v3.5h-3v-13.5a.5.5,0,0,1,.5-.5h9a.5.5,0,0,1,.5.5Zm-8-12h2v2h-2Zm4,0h2v2h-2Zm-4,4h2v2h-2Zm4,0h2v2h-2Z" transform="translate(-313 192)" />
                      </svg>
                      Company
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                        <li><Link href="/company-profile" className={subLinkClass(pathname === "/company-profile")}>Company Profile</Link></li>
                        <li><Link href="/branch-setup" className={subLinkClass(pathname === "/branch-setup")}>Branch Setup</Link></li>
                        <li><Link href="/users-setup" className={subLinkClass(pathname === "/users-setup")}>Users Setup</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* System */}
              <SidebarLinkGroup activeCondition={
                pathname === "/borrower-process" || pathname === "/loan-products" || pathname === "/loan-codes" ||
                pathname === "/clients" || pathname === "/companies" || pathname === "/chiefs" ||
                pathname === "/area" || pathname === "/sub-area" || pathname === "/banks" ||
                pathname === "/file-types" || pathname === "/other-company-charges" ||
                pathname === "/for-new-loans" || pathname === "/audit-logs" ||
                pathname === "/accounting/vendors" || pathname === "/accounting/coa"
              }>
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link href="#" className={linkClass(
                      pathname === "/borrower-process" || pathname === "/loan-products" || pathname === "/loan-codes" ||
                      pathname === "/clients" || pathname === "/companies" || pathname === "/chiefs" ||
                      pathname === "/area" || pathname === "/sub-area" || pathname === "/banks" ||
                      pathname === "/file-types" || pathname === "/other-company-charges" ||
                      pathname === "/for-new-loans" || pathname === "/audit-logs" ||
                      pathname === "/accounting/vendors" || pathname === "/accounting/coa"
                    )} onClick={groupClick(handleClick)}>
                      <svg className="fill-current" fill="none" width="18" height="18" viewBox="1 4 21 15" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.32,9.55l-1.89-.63.89-1.78A1,1,0,0,0,20.13,6L18,3.87a1,1,0,0,0-1.15-.19l-1.78.89-.63-1.89A1,1,0,0,0,13.5,2h-3a1,1,0,0,0-.95.68L8.92,4.57,7.14,3.68A1,1,0,0,0,6,3.87L3.87,6a1,1,0,0,0-.19,1.15l.89,1.78-1.89.63A1,1,0,0,0,2,10.5v3a1,1,0,0,0,.68.95l1.89.63-.89,1.78A1,1,0,0,0,3.87,18L6,20.13a1,1,0,0,0,1.15.19l1.78-.89.63,1.89a1,1,0,0,0,.95.68h3a1,1,0,0,0,.95-.68l.63-1.89,1.78.89A1,1,0,0,0,18,20.13L20.13,18a1,1,0,0,0,.19-1.15l-.89-1.78,1.89-.63A1,1,0,0,0,22,13.5v-3A1,1,0,0,0,21.32,9.55ZM20,12.78l-1.2.4A2,2,0,0,0,17.64,16l.57,1.14-1.1,1.1L16,17.64a2,2,0,0,0-2.79,1.16l-.4,1.2H11.22l-.4-1.2A2,2,0,0,0,8,17.64l-1.14.57-1.1-1.1L6.36,16A2,2,0,0,0,5.2,13.18L4,12.78V11.22l1.2-.4A2,2,0,0,0,6.36,8L5.79,6.89l1.1-1.1L8,6.36A2,2,0,0,0,10.82,5.2l.4-1.2h1.56l.4,1.2A2,2,0,0,0,16,6.36l1.14-.57,1.1,1.1L17.64,8a2,2,0,0,0,1.16,2.79l1.2.4ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z" />
                      </svg>
                      System
                      <ChevronIcon />
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open && "hidden"}`}>
                      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                        <li><Link href="/borrower-process" className={subLinkClass(pathname === "/borrower-process")}>Borrower Process</Link></li>
                        <li><Link href="/loan-products" className={subLinkClass(pathname === "/loan-products")}>Loan Products</Link></li>
                        <li><Link href="/loan-codes" className={subLinkClass(pathname === "/loan-codes")}>Loan Codes</Link></li>
                        <li><Link href="/clients" className={subLinkClass(pathname === "/clients")}>Clients</Link></li>
                        <li><Link href="/companies" className={subLinkClass(pathname === "/companies")}>Companies</Link></li>
                        <li><Link href="/chiefs" className={subLinkClass(pathname === "/chiefs")}>Chiefs</Link></li>
                        <li><Link href="/area" className={subLinkClass(pathname === "/area")}>Area</Link></li>
                        <li><Link href="/sub-area" className={subLinkClass(pathname === "/sub-area")}>Sub Area</Link></li>
                        <li><Link href="/banks" className={subLinkClass(pathname === "/banks")}>Banks</Link></li>
                        <li><Link href="/file-types" className={subLinkClass(pathname === "/file-types")}>File Types</Link></li>
                        <li><Link href="/other-company-charges" className={subLinkClass(pathname === "/other-company-charges")}>Other Company Charges</Link></li>
                        <li><Link href="/for-new-loans" className={subLinkClass(pathname === "/for-new-loans")}>For New Loans</Link></li>
                        <li><Link href="/audit-logs" className={subLinkClass(pathname === "/audit-logs")}>Audit Trail</Link></li>
                        <li><Link href="/accounting/vendors" className={subLinkClass(pathname === "/accounting/vendors")}>Vendors</Link></li>
                        <li><Link href="/accounting/coa" className={subLinkClass(pathname === "/accounting/coa")}>Chart of Accounts</Link></li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>
            </ul>

            {/* ===== REPORTS ===== */}
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">REPORTS</h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <Link href="/settings" className={linkClass(pathname === "/settings")}>
                  <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299ZM6.60947 6.30005C6.60947 6.5813 6.38447 6.8063 6.10322 6.8063H2.53135C2.2501 6.8063 2.0251 6.5813 2.0251 6.30005V2.72817C2.0251 2.44692 2.2501 2.22192 2.53135 2.22192H6.10322C6.38447 2.22192 6.60947 2.44692 6.60947 2.72817V6.30005Z" fill="" />
                    <path d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.72817C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.30005C15.9752 6.5813 15.7502 6.8063 15.4689 6.8063H11.8971C11.6158 6.8063 11.3908 6.5813 11.3908 6.30005V2.72817C11.3908 2.44692 11.6158 2.22192 11.8971 2.22192H15.4689C15.7502 2.22192 15.9752 2.44692 15.9752 2.72817V6.30005Z" fill="" />
                    <path d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.7001C7.8751 10.7157 7.0876 9.92822 6.10322 9.92822ZM6.60947 15.272C6.60947 15.5532 6.38447 15.7782 6.10322 15.7782H2.53135C2.2501 15.7782 2.0251 15.5532 2.0251 15.272V11.7001C2.0251 11.4188 2.2501 11.1938 2.53135 11.1938H6.10322C6.38447 11.1938 6.60947 11.4188 6.60947 11.7001V15.272Z" fill="" />
                    <path d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.7001C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.272C15.9752 15.5532 15.7502 15.7782 15.4689 15.7782H11.8971C11.6158 15.7782 11.3908 15.5532 11.3908 15.272V11.7001C11.3908 11.4188 11.6158 11.1938 11.8971 11.1938H15.4689C15.7502 11.1938 15.9752 11.4188 15.9752 11.7001V15.272Z" fill="" />
                  </svg>
                  Problem Accounts
                </Link>
              </li>
              <li>
                <Link href="/settings" className={linkClass(pathname === "/total-values")}>
                  <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299ZM6.60947 6.30005C6.60947 6.5813 6.38447 6.8063 6.10322 6.8063H2.53135C2.2501 6.8063 2.0251 6.5813 2.0251 6.30005V2.72817C2.0251 2.44692 2.2501 2.22192 2.53135 2.22192H6.10322C6.38447 2.22192 6.60947 2.44692 6.60947 2.72817V6.30005Z" fill="" />
                    <path d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.72817C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.30005C15.9752 6.5813 15.7502 6.8063 15.4689 6.8063H11.8971C11.6158 6.8063 11.3908 6.5813 11.3908 6.30005V2.72817C11.3908 2.44692 11.6158 2.22192 11.8971 2.22192H15.4689C15.7502 2.22192 15.9752 2.44692 15.9752 2.72817V6.30005Z" fill="" />
                    <path d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.7001C7.8751 10.7157 7.0876 9.92822 6.10322 9.92822ZM6.60947 15.272C6.60947 15.5532 6.38447 15.7782 6.10322 15.7782H2.53135C2.2501 15.7782 2.0251 15.5532 2.0251 15.272V11.7001C2.0251 11.4188 2.2501 11.1938 2.53135 11.1938H6.10322C6.38447 11.1938 6.60947 11.4188 6.60947 11.7001V15.272Z" fill="" />
                    <path d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.7001C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.272C15.9752 15.5532 15.7502 15.7782 15.4689 15.7782H11.8971C11.6158 15.7782 11.3908 15.5532 11.3908 15.272V11.7001C11.3908 11.4188 11.6158 11.1938 11.8971 11.1938H15.4689C15.7502 11.1938 15.9752 11.4188 15.9752 11.7001V15.272Z" fill="" />
                  </svg>
                  Total Values
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default SidebarOwner;
