"use client";

import React from "react";
import CardDataStats from "@/components/CardDataStats";
import { AccountingDashboardSummary, PreviousPeriodSummary } from "@/types/dashboard";

interface NrUdiSummaryProps {
  summary: AccountingDashboardSummary;
  previous?: PreviousPeriodSummary;
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

const NrUdiSummary: React.FC<NrUdiSummaryProps> = ({ summary, previous, loading }) => {
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
        previousValue={previous ? formatCurrency(previous.total_nr) : undefined}
      />

      {/* Total UDI */}
      <CardDataStats
        title="Total UDI"
        total={formatCurrency(summary.total_udi)}
        rate={formatPercent(summary.udi_change_percent)}
        levelUp={isPositive(summary.udi_change_percent)}
        levelDown={!isPositive(summary.udi_change_percent)}
        previousValue={previous ? formatCurrency(previous.total_udi) : undefined}
      />

      {/* Released Loans */}
      <CardDataStats
        title="Released Loans"
        total={summary.active_loan_count}
        rate={formatPercent(summary.loan_count_change_percent)}
        levelUp={isPositive(summary.loan_count_change_percent)}
        levelDown={!isPositive(summary.loan_count_change_percent)}
        previousValue={previous ? previous.active_loan_count : undefined}
      />

      {/* Total Outstanding */}
      <CardDataStats
        title="Total Outstanding (NR + UDI)"
        total={formatCurrency(summary.total_outstanding)}
        rate={formatPercent(summary.outstanding_change_percent)}
        levelUp={isPositive(summary.outstanding_change_percent)}
        levelDown={!isPositive(summary.outstanding_change_percent)}
        previousValue={previous ? formatCurrency(previous.total_outstanding) : undefined}
      />
    </div>
  );
};

export default NrUdiSummary;
