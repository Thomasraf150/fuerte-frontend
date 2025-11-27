"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
import { GitBranch, Printer, Search, Edit2, Trash2, RefreshCw, Eye } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import Swal from 'sweetalert2';

// Memoized AccountRow component to prevent unnecessary re-renders
interface AccountRowProps {
  account: DataChartOfAccountList;
  level: number;
  parentId: string | null;
  isActive: boolean;
  rowClassName: string;
  onEdit: (account: DataChartOfAccountList) => void;
  onDelete: (account: DataChartOfAccountList) => void;
  onReactivate: (account: DataChartOfAccountList) => void;
}

const AccountRow = React.memo<AccountRowProps>(({
  account,
  level,
  parentId,
  isActive,
  rowClassName,
  onEdit,
  onDelete,
  onReactivate
}) => {
  const router = useRouter();

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/accounting/coa/${account.id}`);
  };

  return (
    <tr
      className={`border-b dark:border-strokedark hover:bg-opacity-90 ${rowClassName}`}
      data-account-id={account.id}
      data-parent-id={parentId || undefined}
      data-level={level}
    >
      <td className="px-6 py-2 text-sm font-medium" style={{ paddingLeft: `${level * 20}px` }}>
        <div className="flex items-center gap-2">
          <span>
            {account.account_name}
            {!isActive && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
          </span>
        </div>
      </td>
      <td className="px-6 py-2 text-sm font-medium">{account.number}</td>
      <td className="px-6 py-2 text-sm font-medium">{account?.branch_sub?.name}</td>
      <td className="px-6 py-2 text-sm text-center">{account.is_debit === '1' ? 'Yes' : 'No'}</td>
      <td className="px-6 py-2 text-sm text-center">
        {Number(account.balance).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </td>
      <td className="px-6 py-2 text-sm text-center">
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={handleView}
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onEdit(account)}
            className="text-orange-300 hover:text-orange-100 dark:text-orange-300 dark:hover:text-orange-100 transition-colors"
            title="Edit Account"
          >
            <Edit2 size={16} />
          </button>
          {isActive ? (
            <button
              onClick={() => onDelete(account)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Deactivate Account"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <button
              onClick={() => onReactivate(account)}
              className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
              title="Reactivate Account"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (component should NOT re-render)
  // Return false if props differ (component SHOULD re-render)

  // CRITICAL: Check is_active with explicit boolean conversion
  const prevActive = Boolean(prevProps.account.is_active);
  const nextActive = Boolean(nextProps.account.is_active);

  if (prevActive !== nextActive) {
    return false; // Force re-render on active status change
  }

  // Check other fields that affect row rendering and colors
  return (
    prevProps.account.id === nextProps.account.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.level === nextProps.level &&
    prevProps.account.account_name === nextProps.account.account_name &&
    prevProps.account.balance === nextProps.account.balance &&
    prevProps.account.number === nextProps.account.number &&
    prevProps.account.branch_sub?.name === nextProps.account.branch_sub?.name
  );
});

AccountRow.displayName = 'AccountRow';

interface ChartofAcctListProps {
  coaDataAccount: DataChartOfAccountList[] | undefined;
  fetchCoaDataTable: () => Promise<void>;
  onOpenForm: (lbl: string, showFrm: boolean, account: DataChartOfAccountList | null) => void;
  loading: boolean;
  deleteCoaAccount: (id: string) => Promise<any>;
  reactivateAccount: (id: string, cascade: boolean) => Promise<any>;
  countInactiveDescendants: (account: DataChartOfAccountList) => number;
  branchSubData: DataSubBranches[] | undefined;
  printChartOfAccounts: (branchSubId: string) => Promise<any>;
}

const ChartofAcctList: React.FC<ChartofAcctListProps> = ({
  coaDataAccount,
  fetchCoaDataTable,
  onOpenForm,
  loading,
  deleteCoaAccount,
  reactivateAccount,
  countInactiveDescendants,
  branchSubData,
  printChartOfAccounts
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const handleEdit = useCallback((account: DataChartOfAccountList) => {
    onOpenForm('Edit Account', true, account);
  }, [onOpenForm]);

  const handleDelete = useCallback(async (account: DataChartOfAccountList) => {
    const confirmed = await showConfirmationModal(
      'Deactivate Account',
      `Are you sure you want to deactivate "${account.account_name}"? This will also deactivate all sub-accounts.`,
      'Deactivate',
      true
    );

    if (confirmed) {
      await deleteCoaAccount(String(account.id));
    }
  }, [deleteCoaAccount]);

  const handleReactivate = useCallback(async (account: DataChartOfAccountList) => {
    // Count inactive descendants
    const inactiveCount = countInactiveDescendants(account);

    if (inactiveCount > 0) {
      // Show custom modal with checkbox for cascade option
      const result = await Swal.fire({
        title: 'Reactivate Account',
        html: `
          <p style="margin-bottom: 15px;">You are reactivating "<strong>${account.account_name}</strong>"</p>
          <div style="background-color: #e3f2fd; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">
              This account has <strong>${inactiveCount}</strong> inactive sub-account(s).
            </p>
          </div>
          <div style="text-align: left; margin-bottom: 10px;">
            <label style="display: flex; align-items: flex-start; cursor: pointer;">
              <input type="checkbox" id="cascade-checkbox" checked style="margin-right: 8px; margin-top: 3px; cursor: pointer;" />
              <span style="font-size: 14px;">
                Also reactivate all ${inactiveCount} sub-account(s)
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  ⚠️ This will reactivate ALL sub-accounts, including any that were manually deactivated before.
                </div>
              </span>
            </label>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Reactivate',
        preConfirm: () => {
          const checkbox = document.getElementById('cascade-checkbox') as HTMLInputElement;
          return checkbox?.checked ?? true;
        }
      });

      if (result.isConfirmed) {
        const cascade = result.value as boolean;
        await reactivateAccount(String(account.id), cascade);
      }
    } else {
      // No inactive children, just show simple confirmation
      const confirmed = await showConfirmationModal(
        'Reactivate Account',
        `Are you sure you want to reactivate "${account.account_name}"?`,
        'Reactivate',
        true
      );

      if (confirmed) {
        await reactivateAccount(String(account.id), false);
      }
    }
  }, [countInactiveDescendants, reactivateAccount]);

  // Recursive filter function that preserves hierarchy and filters by status, branch, and search
  const filterAccounts = (accounts: DataChartOfAccountList[], term: string, status: 'all' | 'active' | 'inactive', branch: string): DataChartOfAccountList[] => {
    return accounts.reduce((filtered: DataChartOfAccountList[], account) => {
      // Check status filter
      const statusMatches =
        status === 'all' ||
        (status === 'active' && account.is_active) ||
        (status === 'inactive' && !account.is_active);

      // Check branch filter
      const branchMatches =
        branch === 'all' ||
        String(account.branch_sub_id) === branch;

      // Check search term filter
      const lowerTerm = term.toLowerCase();
      const searchMatches = !term.trim() ||
        account.account_name?.toLowerCase().includes(lowerTerm) ||
        account.number?.toLowerCase().includes(lowerTerm);

      // Filter children recursively
      const filteredChildren = account.subAccounts
        ? filterAccounts(account.subAccounts, term, status, branch)
        : [];

      // Include account if it matches all filters OR if any children match
      if ((statusMatches && branchMatches && searchMatches) || filteredChildren.length > 0) {
        filtered.push({
          ...account,
          subAccounts: filteredChildren.length > 0 ? filteredChildren : account.subAccounts
        });
      }

      return filtered;
    }, []);
  };

  useEffect(() => {
    fetchCoaDataTable();
  }, [])

  // Get level-based CSS classes with support for leaf nodes and inactive accounts
  const getLevelColorClass = useCallback((level: number, hasChildren: boolean, isActive: boolean): string => {
    // REQUIREMENT 1: Leaf nodes (no children) = WHITE in light mode, gray-800 in dark mode
    if (!hasChildren) {
      return isActive
        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
        : 'bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-400';
    }

    // REQUIREMENT 2: Inactive accounts with children = GRAYED OUT
    if (!isActive) {
      const adjustedLevel = Math.max(0, Math.min(level - 1, 5));
      const grayClasses = [
        'bg-gray-500 dark:bg-gray-700 text-white dark:text-gray-300',     // Level 0
        'bg-gray-400 dark:bg-gray-600 text-gray-700 dark:text-gray-300',  // Level 1
        'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400',  // Level 2
        'bg-gray-300 dark:bg-gray-800 text-gray-600 dark:text-gray-400',  // Level 3
        'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400',  // Level 4
        'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400',  // Level 5
      ];
      return grayClasses[adjustedLevel];
    }

    // REQUIREMENT 3: Active accounts with children = BLUE hierarchy
    const adjustedLevel = Math.max(0, Math.min(level - 1, 5));
    const blueClasses = [
      'bg-blue-900 dark:bg-blue-800 text-white',           // Level 0
      'bg-blue-700 dark:bg-blue-700 text-white',           // Level 1
      'bg-blue-500 dark:bg-blue-600 text-white',           // Level 2
      'bg-blue-400 dark:bg-blue-500 text-gray-900 dark:text-white', // Level 3
      'bg-blue-300 dark:bg-blue-400 text-gray-900 dark:text-white', // Level 4
      'bg-blue-200 dark:bg-blue-300 text-gray-900',        // Level 5
    ];
    return blueClasses[adjustedLevel];
  }, []);

  const renderAccounts = useCallback((accounts: DataChartOfAccountList[], level: number = 1, parentId: string | null = null): React.ReactNode => {
    return accounts.map((account) => {
      const hasChildren = account.subAccounts && account.subAccounts.length > 0;
      const rowClassName = getLevelColorClass(level, hasChildren, account.is_active);

      return (
        <React.Fragment key={account.id}>
          <AccountRow
            account={account}
            level={level}
            parentId={parentId}
            isActive={account.is_active}
            rowClassName={rowClassName}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
          />
          {hasChildren && renderAccounts(account.subAccounts!, level + 1, String(account.id))}
        </React.Fragment>
      );
    });
  }, [handleEdit, handleDelete, handleReactivate, getLevelColorClass]);

  // Apply filter to get filtered accounts (memoized to prevent re-filtering on every render)
  const filteredAccounts = useMemo(() =>
    filterAccounts(coaDataAccount || [], searchTerm, statusFilter, branchFilter),
    [coaDataAccount, searchTerm, statusFilter, branchFilter]
  );

  return (
    <>
      <div>
        <div className="max-w-12xl">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex justify-between items-center">
              <h3 className="font-medium text-black dark:text-white">
                Chart of Accounts
              </h3>
              <button
                type="button"
                onClick={() => printChartOfAccounts(branchFilter)}
                disabled={loading || !coaDataAccount || coaDataAccount.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Printer size={18} />
                Print Report
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-2 mb-4">
                <button
                  className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center justify-center space-x-2"
                  onClick={() => onOpenForm('Create Account', true, null)}
                >
                  <GitBranch size={14} />
                  <span>Create Account</span>
                </button>
              </div>
            </div>
            <div className="px-5 pb-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by Account Name or Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-stroke bg-white dark:bg-form-input text-gray-900 dark:text-white dark:border-strokedark focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="mb-3">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-stroke bg-white dark:bg-form-input text-gray-900 dark:text-white dark:border-strokedark focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Branches</option>
                  {branchSubData && branchSubData.map((branch) => (
                    <option key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-meta-4 dark:text-white hover:bg-gray-300 dark:hover:bg-opacity-80'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-meta-4 dark:text-white hover:bg-gray-300 dark:hover:bg-opacity-80'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === 'inactive'
                      ? 'bg-orange-600 text-white border-2 border-orange-800 dark:bg-orange-600 dark:text-white dark:border-orange-300 shadow-lg'
                      : 'bg-gray-200 text-gray-700 dark:bg-meta-4 dark:text-white hover:bg-gray-300 dark:hover:bg-opacity-80'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg p-5">
              <table className="w-full text-sm text-left text-black dark:text-white">
                <thead className="text-xs text-black dark:text-white uppercase bg-gray-3 dark:bg-meta-4">
                  <tr>
                    <th scope="col" className="px-6 py-3">Account Name</th>
                    <th scope="col" className="px-6 py-3">Account #</th>
                    <th scope="col" className="px-6 py-3">Branch</th>
                    <th scope="col" className="px-6 py-3 text-center">Is Debit</th>
                    <th scope="col" className="px-6 py-3 text-center">Balance</th>
                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="text-gray-500 dark:text-gray-400">Loading accounts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAccounts.length > 0 ? (
                    renderAccounts(filteredAccounts)
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No accounts found matching your search.' : 'No accounts available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(ChartofAcctList);
