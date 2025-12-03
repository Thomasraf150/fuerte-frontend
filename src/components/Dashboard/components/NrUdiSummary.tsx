"use client";

import React from "react";
import CardDataStats from "@/components/CardDataStats";
import { AccountingDashboardSummary } from "@/types/dashboard";

interface NrUdiSummaryProps {
  summary: AccountingDashboardSummary;
  loading?: boolean;
}

/**
 * Format number as Philippine Peso currency.
 */
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "₱0.00";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format percentage change for display.
 */
const formatPercent = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "0.00%";
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
};

/**
 * Check if percentage is positive.
 */
const isPositive = (value: string): boolean => {
  return parseFloat(value) >= 0;
};

/**
 * Loading skeleton component.
 */
const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-20 mb-2 dark:bg-gray-700"></div>
    <div className="h-8 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
  </div>
);

const NrUdiSummary: React.FC<NrUdiSummaryProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <LoadingSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      {/* Total NR */}
      <CardDataStats
        title="Total NR (Net Receivables)"
        total={formatCurrency(summary.total_nr)}
        rate={formatPercent(summary.nr_change_percent)}
        levelUp={isPositive(summary.nr_change_percent)}
        levelDown={!isPositive(summary.nr_change_percent)}
      >
        <svg
          className="fill-primary dark:fill-white"
          width="22"
          height="16"
          viewBox="0 0 22 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.884384 11 0.884384C17.8063 0.884384 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z"
            fill=""
          />
          <path
            d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z"
            fill=""
          />
        </svg>
      </CardDataStats>

      {/* Total UDI */}
      <CardDataStats
        title="Total UDI"
        total={formatCurrency(summary.total_udi)}
        rate={formatPercent(summary.udi_change_percent)}
        levelUp={isPositive(summary.udi_change_percent)}
        levelDown={!isPositive(summary.udi_change_percent)}
      >
        <svg
          className="fill-primary dark:fill-white"
          width="20"
          height="22"
          viewBox="0 0 20 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.7531 16.4312C10.3781 16.4312 9.27812 17.5312 9.27812 18.9062C9.27812 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.0937 16.4312 11.7531 16.4312ZM11.7531 19.8687C11.2375 19.8687 10.825 19.4562 10.825 18.9406C10.825 18.425 11.2375 18.0125 11.7531 18.0125C12.2687 18.0125 12.6812 18.425 12.6812 18.9406C12.6812 19.4219 12.2343 19.8687 11.7531 19.8687Z"
            fill=""
          />
          <path
            d="M5.22183 16.4312C3.84683 16.4312 2.74683 17.5312 2.74683 18.9062C2.74683 20.2812 3.84683 21.3812 5.22183 21.3812C6.59683 21.3812 7.69683 20.2812 7.69683 18.9062C7.69683 17.5656 6.56245 16.4312 5.22183 16.4312ZM5.22183 19.8687C4.7062 19.8687 4.2937 19.4562 4.2937 18.9406C4.2937 18.425 4.7062 18.0125 5.22183 18.0125C5.73745 18.0125 6.14995 18.425 6.14995 18.9406C6.14995 19.4219 5.7031 19.8687 5.22183 19.8687Z"
            fill=""
          />
          <path
            d="M19.0062 0.618744H17.15C16.325 0.618744 15.6031 1.23749 15.5 2.06249L14.95 6.01562H1.37185C1.0281 6.01562 0.684353 6.18749 0.443728 6.46249C0.237478 6.73749 0.134353 7.11562 0.168728 7.45937L0.996853 14.5281C1.06435 15.0812 1.54372 15.5765 2.16747 15.5765H14.6031C15.1909 15.5765 15.6703 15.1531 15.7378 14.5965L17.0218 3.59374H19.0062C19.4125 3.59374 19.75 3.25624 19.75 2.84999V1.36249C19.75 0.956243 19.4125 0.618744 19.0062 0.618744ZM14.2593 14.0625H2.46872L1.77185 7.56249H14.4812L14.2593 14.0625Z"
            fill=""
          />
        </svg>
      </CardDataStats>

      {/* Released Loans */}
      <CardDataStats
        title="Released Loans"
        total={summary.active_loan_count}
        rate={formatPercent(summary.loan_count_change_percent)}
        levelUp={isPositive(summary.loan_count_change_percent)}
        levelDown={!isPositive(summary.loan_count_change_percent)}
      >
        <svg
          className="fill-primary dark:fill-white"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.16566 21.0031 2.95628 21.3813 3.78753 21.3813H18.1782C19.0094 21.3813 19.8 21.0031 20.35 20.3844C20.9 19.7656 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.1438 19.8344H3.82191C3.40316 19.8344 3.02503 19.6625 2.75003 19.3531C2.47503 19.0438 2.37191 18.6313 2.40628 18.2188L4.12503 3.40626C4.19378 2.71876 4.81253 2.16563 5.53441 2.16563H16.4313C17.1532 2.16563 17.7719 2.71876 17.8407 3.40626L19.5594 18.2188C19.6282 18.6313 19.4907 19.0438 19.2157 19.3531Z"
            fill=""
          />
          <path
            d="M14.3345 5.29375C13.922 5.39688 13.647 5.80938 13.7501 6.22188C13.7845 6.42813 13.8189 6.63438 13.8189 6.80625C13.8189 8.35313 12.547 9.625 11.0001 9.625C9.45327 9.625 8.1814 8.35313 8.1814 6.80625C8.1814 6.6 8.21577 6.42813 8.25015 6.22188C8.35327 5.80938 8.07827 5.39688 7.66577 5.29375C7.25327 5.19063 6.84077 5.46563 6.73765 5.87813C6.6689 6.19063 6.60015 6.50313 6.60015 6.80625C6.60015 9.2125 8.5939 11.2063 11.0001 11.2063C13.4064 11.2063 15.4001 9.2125 15.4001 6.80625C15.4001 6.50313 15.3314 6.19063 15.2626 5.87813C15.1939 5.46563 14.747 5.225 14.3345 5.29375Z"
            fill=""
          />
        </svg>
      </CardDataStats>

      {/* Total Outstanding */}
      <CardDataStats
        title="Total Outstanding (NR + UDI)"
        total={formatCurrency(summary.total_outstanding)}
        rate=""
        levelUp={false}
        levelDown={false}
      >
        <svg
          className="fill-primary dark:fill-white"
          width="22"
          height="18"
          viewBox="0 0 22 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751ZM7.18418 2.05626C8.45605 2.05626 9.52168 3.05313 9.52168 4.29063C9.52168 5.52813 8.49043 6.52501 7.18418 6.52501C5.87793 6.52501 4.84668 5.52813 4.84668 4.29063C4.84668 3.05313 5.9123 2.05626 7.18418 2.05626Z"
            fill=""
          />
          <path
            d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6343 3.15625 15.8124 3.15625C13.9905 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9562 9.6875 15.8124 9.6875ZM15.8124 4.7375C16.8093 4.7375 17.5999 5.49375 17.5999 6.45625C17.5999 7.41875 16.8093 8.175 15.8124 8.175C14.8155 8.175 14.0249 7.41875 14.0249 6.45625C14.0249 5.49375 14.8155 4.7375 15.8124 4.7375Z"
            fill=""
          />
          <path
            d="M15.9843 10.0313H15.6749C14.6437 10.0313 13.6468 10.3406 12.7874 10.8563C11.8593 9.61876 10.3812 8.79376 8.73115 8.79376H5.67178C2.85303 8.82814 0.618652 11.0625 0.618652 13.8469V16.3219C0.618652 16.975 1.13428 17.4906 1.7874 17.4906H20.2468C20.8999 17.4906 21.4499 16.9406 21.4499 16.2875V15.4625C21.4155 12.4719 18.9749 10.0313 15.9843 10.0313ZM2.16553 15.9438V13.8469C2.16553 11.9219 3.74678 10.3406 5.67178 10.3406H8.73115C10.6562 10.3406 12.2374 11.9219 12.2374 13.8469V15.9438H2.16553ZM19.8687 15.9438H13.7499V13.8469C13.7499 13.2969 13.6468 12.7469 13.4749 12.2313C14.0937 11.7844 14.8499 11.5765 15.6405 11.5765H15.9499C18.0812 11.5765 19.8343 13.3313 19.8343 15.4313L19.8687 15.9438Z"
            fill=""
          />
        </svg>
      </CardDataStats>
    </div>
  );
};

export default NrUdiSummary;
