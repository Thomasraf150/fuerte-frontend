"use client";

import React from "react";
import { formatNumber } from "@/utils/formatNumber";

interface Props {
  totalAccounts: number;
  totalShortfall: string;
  totalUaAmount: string;
  totalSpAmount: string;
  loading?: boolean;
}

const peso = (raw: string) => {
  const n = parseFloat(raw) || 0;
  return `₱ ${formatNumber(n)}`;
};

interface CardProps {
  label: string;
  value: string;
  loading?: boolean;
}

const Card: React.FC<CardProps> = ({ label, value, loading }) => (
  <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-bodydark">
      {label}
    </p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-black dark:text-white">
      {loading ? "—" : value}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <Card
        label="Total Problem Accounts"
        value={totalAccounts.toLocaleString("en-US")}
        loading={loading}
      />
      <Card
        label="Total Uncollected (UA)"
        value={peso(totalUaAmount)}
        loading={loading}
      />
      <Card
        label="Total Shorts (SP)"
        value={peso(totalSpAmount)}
        loading={loading}
      />
      <Card
        label="Total Shortfall (UA + SP)"
        value={peso(totalShortfall)}
        loading={loading}
      />
    </div>
  );
};

export default ProblemAccountsSummary;
