"use client";

import ErrorAlert from "@/components/ErrorAlert";
import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "react-toastify";
import {
  useProblemAccountsPaginated,
  ProblemAccountRow,
} from "@/hooks/useProblemAccountsPaginated";
import CustomDatatable from "@/components/CustomDatatable";
import { Card, CardBody } from "@/components/Card";
import ProblemAccountsSummary from "../../../components/ProblemAccountsSummary";
import ProblemAccountsCards from "../../../components/ProblemAccountsCards";
import ProblemAccountsLegend from "../../../components/ProblemAccountsLegend";
import ProblemAccountsPager from "../../../components/ProblemAccountsPager";
import { problemAccountsColumnsCompact } from "../../../components/ProblemAccountsColumns";
import { todayLocalISO } from "@/utils/helper";

interface Props {
  borrowerId: string;
}

const BorrowerProblemAccountsList: React.FC<Props> = ({ borrowerId }) => {
  const router = useRouter();

  const { data, summary, loading, error, refresh, serverSidePaginationProps } =
    useProblemAccountsPaginated({
      borrowerId,
      sortBy: "shortfall_desc",
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

  /**
   * Where a row leads — shared by the table's row click and the phone cards'
   * links. `null` when the loan has no unpaid schedule to open.
   */
  const rowHref = (row: ProblemAccountRow): string | null => {
    if (!row.oldest_unpaid_schedule_id) return null;
    const today = todayLocalISO();
    return `/collection-list/${row.oldest_unpaid_schedule_id}?date=${today}&ref=${encodeURIComponent(row.loan_ref)}`;
  };

  const handleRowClick = (row: ProblemAccountRow) => {
    const href = rowHref(row);
    if (!href) {
      toast.info("No unpaid schedule found for this loan.");
      return;
    }
    router.push(href);
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/problem-accounts"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 inline-flex items-center gap-1"
        >
          <span aria-hidden>←</span> Back to Problem Accounts
        </Link>
      </div>

      <Card className="mb-4">
        <CardBody>
        {headerInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-body dark:text-bodydark">
                Borrower
              </p>
              <p className="mt-1 text-lg font-bold text-black dark:text-white">
                {headerInfo.name}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-body dark:text-bodydark">
                Branch
              </p>
              <p className="mt-1 text-sm font-medium text-black dark:text-white">
                {headerInfo.branch || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-body dark:text-bodydark">
                Contact
              </p>
              <p className="mt-1 text-sm font-medium text-black dark:text-white">
                {headerInfo.phone || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-body dark:text-bodydark">
                Address
              </p>
              <p className="mt-1 text-sm font-medium text-black dark:text-white break-words">
                {headerInfo.address || "—"}
              </p>
            </div>
          </div>
        ) : loading ? (
          <p className="text-sm text-body dark:text-bodydark">Loading borrower…</p>
        ) : (
          <p className="text-sm text-body dark:text-bodydark">No data found for this borrower.</p>
        )}
        </CardBody>
      </Card>

      <ProblemAccountsSummary
        totalAccounts={summary.total_problem_accounts}
        totalShortfall={summary.total_shortfall}
        totalUaAmount={summary.total_ua_amount}
        totalSpAmount={summary.total_sp_amount}
        loading={loading && data.length === 0}
      />

      {error && (
        <ErrorAlert
          className="mb-4"
          title="This borrower's problem accounts didn't load."
          detail={error}
          onRetry={refresh}
        />
      )}

      <Card>
        <ProblemAccountsLegend />

        {/* Same breakpoint swap as the main list: cards on a phone, table above. */}
        <CardBody className="md:hidden">
          <ProblemAccountsCards
            rows={data}
            hrefFor={rowHref}
            onSelect={handleRowClick}
            loading={loading}
          />
          <ProblemAccountsPager
            currentPage={serverSidePaginationProps.currentPage}
            totalPages={serverSidePaginationProps.totalPages}
            totalRecords={serverSidePaginationProps.totalRecords}
            onPageChange={serverSidePaginationProps.onPageChange}
          />
        </CardBody>

        <CardBody className="hidden md:block">
          <CustomDatatable
            loadFailed={Boolean(error)}
            apiLoading={loading}
            columns={columns}
            data={data}
            onRowClicked={handleRowClick}
            enableCustomHeader={true}
            title={""}
            serverSidePagination={serverSidePaginationProps}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default BorrowerProblemAccountsList;
