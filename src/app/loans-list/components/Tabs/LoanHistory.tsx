"use client";

import React, { useEffect, useState } from 'react';
import { formatDate } from '@/utils/formatDate';
import { fetchWithRecache } from '@/utils/helper';
import { Clock } from 'react-feather';
import { useAuthStore } from '@/store';

interface LoanHistoryProps {
  loanId: number;
}

interface AuditLogEntry {
  id: string;
  operation_type: string;
  changed_at: string;
  changed_by: string | null;
  new_data: Record<string, any>;
  old_data: Record<string, any> | null;
  user: { name: string } | null;
}

const LoanHistory: React.FC<LoanHistoryProps> = ({ loanId }) => {
  const [historyData, setHistoryData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const LOAN_HISTORY_QUERY = `
    query GetLoanHistory($loan_id: Int!, $first: Int) {
      loanHistory(loan_id: $loan_id, first: $first) {
        data {
          id
          operation_type
          changed_at
          changed_by
          new_data
          old_data
          user {
            name
          }
        }
      }
    }
  `;

  useEffect(() => {
    const fetchHistory = async () => {
      // Debug: Log received loanId and type
      console.log('[LoanHistory] Received loanId:', loanId, 'type:', typeof loanId);

      // Get authentication token
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();
      console.log('[LoanHistory] Auth token exists:', !!token);

      setLoading(true);
      try {
        // Ensure loanId is explicitly an integer
        const loanIdInt = parseInt(String(loanId), 10);
        console.log('[LoanHistory] Parsed loanId:', loanIdInt, 'type:', typeof loanIdInt);

        const requestVariables = { loan_id: loanIdInt, first: 50 };
        console.log('[LoanHistory] GraphQL Request Variables:', requestVariables);

        const response = await fetchWithRecache(
          `${process.env.NEXT_PUBLIC_API_GRAPHQL}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              query: LOAN_HISTORY_QUERY,
              variables: requestVariables
            }),
          }
        );

        console.log('[LoanHistory] GraphQL Response:', response);

        // Check for GraphQL errors
        if (response.errors) {
          console.error('[LoanHistory] GraphQL Errors:', response.errors);
          response.errors.forEach((error: any, index: number) => {
            console.error(`[LoanHistory] Error ${index + 1}:`, {
              message: error.message,
              extensions: error.extensions,
              locations: error.locations,
              path: error.path
            });
          });
          setHistoryData([]);
        } else if (response.data?.loanHistory) {
          const historyEntries = response.data.loanHistory.data || [];
          console.log('[LoanHistory] History entries received:', historyEntries.length, historyEntries);
          setHistoryData(historyEntries);
        } else {
          console.warn('[LoanHistory] No loanHistory in response:', response);
          setHistoryData([]);
        }
      } catch (error) {
        console.error('[LoanHistory] Error fetching loan history:', error);
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [loanId]);

  const fieldLabels: Record<string, string> = {
    status: 'Status',
    pn_amount: 'PN Amount',
    loan_proceeds: 'Loan Proceeds',
    monthly: 'Monthly Payment',
    approved_date: 'Approved Date',
    released_date: 'Released Date',
    is_pn_signed: 'PN Signed',
    bank_id: 'Bank ID',
    check_no: 'Check Number',
    is_closed: 'Closed',
    term: 'Term',
    loan_ref: 'Loan Reference',
    pn_balance: 'PN Balance',
    udi_balance: 'UDI Balance'
  };

  // Helper function to get loan status label
  const getStatusLabel = (data: any): string => {
    if (!data) return 'Unknown';

    // Priority 1: Posted (has accounting entry)
    if (data.acctg_entry !== null && data.acctg_entry !== undefined) {
      return 'Posted';
    }

    // Priority 2: Closed
    if (data.is_closed === '1' || data.is_closed === 1) {
      return 'Closed';
    }

    // Priority 3: Status-based
    const status = parseInt(String(data.status), 10);
    switch (status) {
      case 0: return 'For Approval';
      case 1: return 'Approved';
      case 2: return 'For Releasing';
      case 3: return 'Released';
      default: return 'Unknown';
    }
  };

  // Helper function to get status badge color
  const getStatusBadgeClass = (statusLabel: string): string => {
    switch (statusLabel) {
      case 'Posted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Closed':
        return 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300';
      case 'For Approval':
        return 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300';
      case 'Approved':
        return 'bg-yellow-400 text-boxdark dark:bg-yellow-600 dark:text-yellow-100';
      case 'For Releasing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Released':
        return 'bg-green-600 text-lime-100 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Helper function to detect status change
  const getStatusChange = (oldData: any, newData: any): { changed: boolean; oldStatus: string; newStatus: string } => {
    if (!oldData || !newData) {
      return { changed: false, oldStatus: '', newStatus: getStatusLabel(newData) };
    }

    const oldStatus = getStatusLabel(oldData);
    const newStatus = getStatusLabel(newData);

    return {
      changed: oldStatus !== newStatus,
      oldStatus,
      newStatus
    };
  };

  const renderFieldChanges = (oldData: any, newData: any) => {
    if (!oldData || !newData) return <span className="text-gray-500 dark:text-gray-400 text-sm">No changes detected</span>;

    const changes: JSX.Element[] = [];

    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key] && key !== 'id') {
        changes.push(
          <div key={key} className="flex gap-2 text-sm py-1">
            <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[140px]">
              {fieldLabels[key] || key}:
            </span>
            <span className="text-red-600 dark:text-red-400 line-through">
              {oldData[key] || 'N/A'}
            </span>
            <span className="dark:text-gray-400">→</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {newData[key] || 'N/A'}
            </span>
          </div>
        );
      }
    });

    return changes.length > 0 ? changes : <span className="text-gray-500 dark:text-gray-400 text-sm">No changes detected</span>;
  };

  // Count significant field changes (excluding id, updated_at, etc.)
  const countFieldChanges = (oldData: any, newData: any): number => {
    if (!oldData || !newData) return 0;

    const excludeFields = ['id', 'created_at', 'updated_at', 'user_id'];
    let count = 0;

    Object.keys(newData).forEach(key => {
      if (!excludeFields.includes(key) && oldData[key] !== newData[key]) {
        count++;
      }
    });

    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Clock size={20} className="text-blue-600" />
        Loan Change History
      </h3>

      {historyData.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No history records found for this loan.
        </div>
      ) : (
        <div className="space-y-3">
          {historyData.map((entry) => {
            const statusChange = getStatusChange(entry.old_data, entry.new_data);
            const fieldChangesCount = countFieldChanges(entry.old_data, entry.new_data);
            const isCreated = entry.operation_type === 'CREATED A LOAN';
            const showDropdown = fieldChangesCount > 1 && !isCreated;

            return (
              <div
                key={entry.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <div
                  className={`p-4 bg-gray-50 dark:bg-gray-800 ${showDropdown ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''} transition-colors`}
                  onClick={showDropdown ? () => setExpandedId(expandedId === entry.id ? null : entry.id) : undefined}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Status Transition Display */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isCreated ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(statusChange.newStatus)}`}>
                            Created
                          </span>
                        ) : statusChange.changed ? (
                          <>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(statusChange.oldStatus)}`}>
                              {statusChange.oldStatus}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">→</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(statusChange.newStatus)}`}>
                              {statusChange.newStatus}
                            </span>
                          </>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(statusChange.newStatus)}`}>
                            {statusChange.newStatus}
                          </span>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(entry.changed_at)}
                        </span>
                      </div>

                      {/* User and Change Summary */}
                      <div className="mt-2 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Changed by: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {entry.user?.name || entry.changed_by || 'System'}
                        </span>
                      </div>
                    </div>
                    {showDropdown && (
                      <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        {expandedId === entry.id ? '▼' : '▶'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Details - Only show if there are multiple changes */}
                {showDropdown && expandedId === entry.id && (
                  <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Detailed Changes:</h4>
                    <div className="space-y-1">
                      {renderFieldChanges(entry.old_data, entry.new_data)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LoanHistory;
