import React from 'react';
import type {
  AccountDetail,
  AccountTransactionsResponse,
  PaginationParams
} from '@/types/chartOfAccounts';
import { formatCurrency, formatDate } from '@/utils/formatters';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';

interface TransactionHistoryTableProps {
  account: AccountDetail;
  transactions: AccountTransactionsResponse | null;
  loading: boolean;
  pagination: PaginationParams;
  onPageChange: (newOffset: number) => void;
}

const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  account,
  transactions,
  loading,
  pagination,
  onPageChange
}) => {
  if (!transactions) {
    return null;
  }

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(transactions.total_count / pagination.limit);
  const hasTransactions = transactions.transactions.length > 0;

  const handlePreviousPage = () => {
    if (pagination.offset > 0) {
      onPageChange(pagination.offset - pagination.limit);
    }
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < transactions.total_count) {
      onPageChange(pagination.offset + pagination.limit);
    }
  };

  const handlePageClick = (page: number) => {
    const newOffset = (page - 1) * pagination.limit;
    onPageChange(newOffset);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

      const showLeftDots = leftSiblingIndex > 2;
      const showRightDots = rightSiblingIndex < totalPages - 1;

      if (!showLeftDots && showRightDots) {
        pages.push(...Array.from({ length: 3 }, (_, i) => i + 1));
        pages.push(-1); // Dots
        pages.push(totalPages);
      } else if (showLeftDots && !showRightDots) {
        pages.push(1);
        pages.push(-1); // Dots
        pages.push(...Array.from({ length: 3 }, (_, i) => totalPages - 2 + i));
      } else {
        pages.push(1);
        pages.push(-1); // Dots
        pages.push(leftSiblingIndex, currentPage, rightSiblingIndex);
        pages.push(-2); // Dots
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          Transaction History ({transactions.total_count.toLocaleString()} transactions)
        </h3>
        {transactions.total_count > 0 && (
          <div className="mt-2 flex gap-6 text-sm">
            <div>
              <span className="text-black dark:text-white">Beginning Balance: </span>
              <span className="font-semibold text-black dark:text-white">
                {formatCurrency(transactions.beginning_balance)}
              </span>
            </div>
            <div>
              <span className="text-black dark:text-white">Ending Balance: </span>
              <span className="font-semibold text-black dark:text-white">
                {formatCurrency(transactions.ending_balance)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : !hasTransactions ? (
          <div className="py-10 text-center text-black dark:text-white">
            <p className="text-lg">No transactions found for this account.</p>
            <p className="mt-2 text-sm text-bodydark">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                      Date
                    </th>
                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                      Reference
                    </th>
                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                      Description
                    </th>
                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                      Journal Type
                    </th>
                    <th className="px-4 py-4 text-right font-medium text-black dark:text-white">
                      Debit
                    </th>
                    <th className="px-4 py-4 text-right font-medium text-black dark:text-white">
                      Credit
                    </th>
                    <th className="px-4 py-4 text-right font-medium text-black dark:text-white">
                      Balance
                    </th>
                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                      Posted By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.transactions.map((transaction, index) => {
                    const isDebit = parseFloat(transaction.debit) > 0;
                    const isCredit = parseFloat(transaction.credit) > 0;

                    return (
                      <tr
                        key={transaction.id}
                        className={`${
                          index % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-2 dark:bg-meta-4'
                        } hover:bg-gray-3 dark:hover:bg-meta-4`}
                      >
                        <td className="px-4 py-4 text-black dark:text-white">
                          <div className="text-sm">{formatDate(transaction.journal_date)}</div>
                          {transaction.posted_date && (
                            <div className="text-xs text-bodydark">
                              Posted: {formatDate(transaction.posted_date)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-black dark:text-white">
                            {transaction.journal_ref}
                          </div>
                          {transaction.document_no && (
                            <div className="text-xs text-bodydark">
                              Doc: {transaction.document_no}
                            </div>
                          )}
                          {transaction.check_no && (
                            <div className="text-xs text-bodydark">
                              Check: {transaction.check_no}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-black dark:text-white max-w-xs">
                          <div className="truncate" title={transaction.journal_desc || ''}>
                            {transaction.journal_desc || '-'}
                          </div>
                          {(transaction.vendor_name || transaction.borrower_name) && (
                            <div className="text-xs text-bodydark mt-1">
                              {transaction.vendor_name || transaction.borrower_name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded bg-primary bg-opacity-10 px-2 py-1 text-xs font-medium text-primary">
                            {transaction.journal_type}
                          </span>
                          {transaction.is_cancelled && (
                            <span className="ml-1 inline-flex rounded bg-danger bg-opacity-10 px-2 py-1 text-xs font-medium text-danger">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isDebit ? (
                            <span className="font-medium text-success">
                              {formatCurrency(transaction.debit)}
                            </span>
                          ) : (
                            <span className="text-bodydark">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isCredit ? (
                            <span className="font-medium text-danger">
                              {formatCurrency(transaction.credit)}
                            </span>
                          ) : (
                            <span className="text-bodydark">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-black dark:text-white">
                          {formatCurrency(transaction.running_balance)}
                        </td>
                        <td className="px-4 py-4 text-sm text-bodydark">
                          {transaction.posted_by_name || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-bodydark">
                  Showing {pagination.offset + 1} to{' '}
                  {Math.min(pagination.offset + pagination.limit, transactions.total_count)} of{' '}
                  {transactions.total_count} transactions
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={pagination.offset === 0}
                    className="rounded border border-stroke px-3 py-1 text-sm font-medium text-black hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                  >
                    Previous
                  </button>

                  {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === -1 || page === -2 ? (
                        <span className="px-2 text-bodydark">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageClick(page)}
                          className={`rounded border px-3 py-1 text-sm font-medium ${
                            currentPage === page
                              ? 'border-primary bg-primary text-white'
                              : 'border-stroke text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4'
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  <button
                    onClick={handleNextPage}
                    disabled={pagination.offset + pagination.limit >= transactions.total_count}
                    className="rounded border border-stroke px-3 py-1 text-sm font-medium text-black hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryTable;
