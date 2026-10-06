"use client";

import React from "react";
import { formatNumber } from "@/utils/formatNumber";
import { formatCount } from "@/utils/helper";

interface Props {
  totalAccounts: number;
  totalShortfall: string;
  totalUaAmount: string;
  totalSpAmount: string;
  loading?: boolean;
}

/**
 * A peso figure that can never break across two lines.
 *
 * The previous version returned the string `₱ ${n}`. That plain space is a
 * legal break opportunity, and these totals run to 15 characters — so as soon
 * as a card got narrow the browser put "₱" on its own line above the number.
 * Measured: it wrapped at every viewport from 1024px to 1280px, which is where
 * a 1920px screen at 125–150% Windows scaling lands.
 *
 * The symbol is now its own element inside a `whitespace-nowrap` parent, so the
 * spacing is a margin (unbreakable) rather than a space character. `tabular-nums`
 * keeps digits on a fixed advance width so the four cards align down the column.
 *
 * The sign is drawn but hidden from screen readers, which do not all name "₱";
 * they hear the visually hidden word instead ("105,470,926.62 pesos").
 */
const PesoValue: React.FC<{ raw: string }> = ({ raw }) => (
  <span className="whitespace-nowrap tabular-nums">
    <span className="mr-0.5 font-semibold" aria-hidden="true">
      ₱
    </span>
    {formatNumber(parseFloat(raw) || 0)}
    <span className="sr-only"> pesos</span>
  </span>
);

interface CardProps {
  label: string;
  children: React.ReactNode;
  loading?: boolean;
}

const Card: React.FC<CardProps> = ({ label, children, loading }) => (
  <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
    <p className="text-xs uppercase tracking-wide text-body dark:text-bodydark">
      {label}
    </p>
    <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
      {loading ? "—" : children}
    </p>
  </div>
);

const ProblemAccountsSummary: React.FC<Props> = ({
  totalAccounts,
  totalShortfall,
  totalUaAmount,
  totalSpAmount,
  loading,
}) => {
  return (
    /**
     * Four across only from 2xl. The sidebar takes ~290px, so at the old `lg`
     * (1024px) breakpoint each card was only 160–225px wide — far too narrow for
     * a 15-character peso total at 24px. Two across covers everything between a
     * phone and a wide desktop.
     */
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mb-4">
      <Card label="Total Problem Accounts" loading={loading}>
        <span className="tabular-nums">{formatCount(totalAccounts)}</span>
      </Card>
      <Card label="Total Uncollected (UA)" loading={loading}>
        <PesoValue raw={totalUaAmount} />
      </Card>
      <Card label="Total Shorts (SP)" loading={loading}>
        <PesoValue raw={totalSpAmount} />
      </Card>
      <Card label="Total Shortfall (UA + SP)" loading={loading}>
        <PesoValue raw={totalShortfall} />
      </Card>
    </div>
  );
};

export default ProblemAccountsSummary;
