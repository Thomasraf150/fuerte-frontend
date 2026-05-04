"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "react-toastify";
import {
  useProblemAccountsPaginated,
  ProblemAccountRow,
} from "@/hooks/useProblemAccountsPaginated";
import CustomDatatable from "@/components/CustomDatatable";
import ProblemAccountsSummary from "../../../components/ProblemAccountsSummary";
import { problemAccountsColumnsCompact } from "../../../components/ProblemAccountsColumns";

interface Props {
  borrowerId: string;
}

const BorrowerProblemAccountsList: React.FC<Props> = ({ borrowerId }) => {
  const router = useRouter();

  const { data, summary, loading, error, refresh, serverSidePaginationProps } =
    useProblemAccountsPaginated({
      borrowerId,
      sortBy: "shortfall_desc",
      graceDays: 0,
    });

  const headerInfo = useMemo(() => {
    const first = data[0];
    if (!first) return null;
    const branchLabel = [first.branch_name, first.sub_branch_name]
      .filter(Boolean)
      .join(" / ");
    return {
      name: first.borrower_name,
      branch: branchLabel,
      phone: first.borrower_phone,
      address: first.borrower_address,
    };
  }, [data]);

  const columns = useMemo(() => problemAccountsColumnsCompact(), []);

  const handleRowClick = (row: ProblemAccountRow) => {
    if (!row.oldest_unpaid_schedule_id) {
      toast.info("No unpaid schedule found for this loan.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    router.push(
      `/collection-list/${row.oldest_unpaid_schedule_id}?date=${today}&ref=${encodeURIComponent(row.loan_ref)}`
    );
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/problem-accounts"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
        >
          <span aria-hidden>←</span> Back to Problem Accounts
        </Link>
      </div>

      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-5 mb-4">
        {headerInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-bodydark">
                Borrower
              </p>
              <p className="mt-1 text-lg font-bold text-black dark:text-white">
                {headerInfo.name}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-bodydark">
                Branch
              </p>
              <p className="mt-1 text-sm font-medium text-black dark:text-white">
                {headerInfo.branch || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-bodydark">
                Contact
              </p>
              <p className="mt-1 text-sm font-medium text-black dark:text-white">
                {headerInfo.phone || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-bodydark">
                Address
              </p>
              <p className="mt-1 text-sm font-medium text-black dark:text-white break-words">
                {headerInfo.address || "—"}
              </p>
            </div>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-500 dark:text-bodydark">Loading borrower…</p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-bodydark">No data found for this borrower.</p>
        )}
      </div>

      <ProblemAccountsSummary
        totalAccounts={summary.total_problem_accounts}
        totalShortfall={summary.total_shortfall}
        totalUaAmount={summary.total_ua_amount}
        totalSpAmount={summary.total_sp_amount}
        loading={loading && data.length === 0}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
          <span>Error loading borrower's problem accounts: {error}</span>
          <button
            onClick={refresh}
            className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-2 lg:p-4 overflow-x-auto">
          <CustomDatatable
            apiLoading={loading}
            columns={columns}
            data={data}
            onRowClicked={handleRowClick}
            enableCustomHeader={true}
            title={""}
            serverSidePagination={serverSidePaginationProps}
          />
        </div>
      </div>
    </div>
  );
};

export default BorrowerProblemAccountsList;
