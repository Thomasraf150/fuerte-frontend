"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CustomDatatable from '@/components/CustomDatatable';
import { DataChartOfAccountList } from '@/utils/DataTypes';
import CoaForm from './CoaForm';
import useCoa from '@/hooks/useCoa';
import { GitBranch, Printer, Search, Edit2, Trash2, RefreshCw, ChevronDown, ChevronRight, PlusSquare, MinusSquare, Eye } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import Swal from 'sweetalert2';

// Memoized AccountRow component to prevent unnecessary re-renders
interface AccountRowProps {
  account: DataChartOfAccountList;
  level: number;
  parentId: string | null;
  hasChildren: boolean;
  isActive: boolean;
  rowStyle: React.CSSProperties;
  onToggle: (accountId: string, hasChildren: boolean) => void;
  onEdit: (account: DataChartOfAccountList) => void;
  onDelete: (account: DataChartOfAccountList) => void;
  onReactivate: (account: DataChartOfAccountList) => void;
}

const AccountRow = React.memo<AccountRowProps>(({
  account,
  level,
  parentId,
  hasChildren,
  isActive,
  rowStyle,
  onToggle,
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
      className="border-b dark:border-strokedark hover:bg-opacity-90"
      style={rowStyle}
      data-account-id={account.id}
      data-parent-id={parentId || undefined}
      data-level={level}
    >
      <td className="px-6 py-2 text-sm font-medium" style={{ paddingLeft: `${level * 20}px` }}>
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button
              onClick={() => onToggle(String(account.id), hasChildren)}
              className="hover:opacity-70 transition-opacity flex-shrink-0"
              title="Expand/Collapse"
            >
              <ChevronRight className="chevron-icon transition-transform" size={16} />
            </button>
          ) : (
            <span className="w-4 flex-shrink-0"></span>
          )}
          <span>
            {account.account_name}
            {!isActive && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
          </span>
        </div>
      </td>
      <td className="px-6 py-2 text-sm font-medium">{account.number}</td>
      <td className="px-6 py-2 text-sm font-medium">{account?.branch_sub?.name}</td>
      <td className="px-6 py-2 text-sm text-center">{account.is_debit === '1' ? 'Yes' : 'No'}</td>
      <td className="px-6 py-2 text-sm text-center">{account.balance}</td>
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
    prevProps.hasChildren === nextProps.hasChildren &&
    prevProps.account.account_name === nextProps.account.account_name &&
    prevProps.account.balance === nextProps.account.balance &&
    prevProps.account.number === nextProps.account.number &&
    prevProps.account.branch_sub?.name === nextProps.account.branch_sub?.name
  );
});

AccountRow.displayName = 'AccountRow';

const ChartofAcctList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<DataChartOfAccountList | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const { coaDataAccount, fetchCoaDataTable, loading, deleteCoaAccount, reactivateAccount, countInactiveDescendants, branchSubData, printChartOfAccounts } = useCoa();

  const handleShowForm = useCallback((lbl: string, showFrm: boolean, account: DataChartOfAccountList | null = null) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setSelectedAccount(account);
  }, []);

  const handleEdit = useCallback((account: DataChartOfAccountList) => {
    setSelectedAccount(account);
    handleShowForm('Edit Account', true, account);
  }, [handleShowForm]);

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

  // DOM-based toggle function (no React state, no re-renders)
  const toggleRow = useCallback((accountId: string, hasChildren: boolean) => {
    if (!hasChildren) return;

    // Find the row element
    const row = document.querySelector(`tr[data-account-id="${accountId}"]`);
    if (!row) return;

    // Toggle expanded class on parent row
    const isExpanded = row.classList.contains('expanded');
    row.classList.toggle('expanded');

    // Recursively toggle all descendant rows
    const toggleDescendants = (parentId: string, show: boolean) => {
      const children = document.querySelectorAll(`tr[data-parent-id="${parentId}"]`);
      children.forEach(child => {
        if (show) {
          child.classList.remove('row-hidden');
        } else {
          child.classList.add('row-hidden');
          // Also collapse and hide nested children
          child.classList.remove('expanded');
          const childId = child.getAttribute('data-account-id');
          if (childId) {
            toggleDescendants(childId, false);
          }
        }
      });
    };

    toggleDescendants(accountId, !isExpanded);
  }, []);

  // Expand all nodes (DOM-based)
  const expandAll = useCallback(() => {
    requestAnimationFrame(() => {
      const allRows = document.querySelectorAll('tr[data-account-id]');
      allRows.forEach(row => {
        row.classList.add('expanded');
        row.classList.remove('row-hidden');
      });
    });
  }, []);

  // Collapse all nodes (DOM-based)
  const collapseAll = useCallback(() => {
    requestAnimationFrame(() => {
      const allRows = document.querySelectorAll('tr[data-account-id]');
      allRows.forEach(row => {
        const level = parseInt(row.getAttribute('data-level') || '1');
        row.classList.remove('expanded');
        // Hide all rows except level 1 (top-level)
        if (level > 1) {
          row.classList.add('row-hidden');
        }
      });
    });
  }, []);

  useEffect(() => {
    fetchCoaDataTable();

    console.log(coaDataAccount, 'coaDataAccount');
  }, [])

  // Get level-based inline styles with support for leaf nodes and inactive accounts
  const getLevelColorStyle = useCallback((level: number, hasChildren: boolean, isActive: boolean): React.CSSProperties => {
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

    // REQUIREMENT 1: Leaf nodes (no children) = WHITE in light mode, gray-800 in dark mode
    if (!hasChildren) {
      if (isActive) {
        return isDark
          ? { backgroundColor: '#1f2937', color: '#ffffff' } // gray-800 dark mode
          : { backgroundColor: '#ffffff', color: '#111827' }; // white light mode
      } else {
        return isDark
          ? { backgroundColor: '#111827', color: '#6b7280' } // gray-900 dark mode
          : { backgroundColor: '#e5e7eb', color: '#6b7280' }; // gray-200 light mode
      }
    }

    // REQUIREMENT 2: Inactive accounts with children = GRAYED OUT
    if (!isActive) {
      const adjustedLevel = Math.max(0, level - 1);
      const grayedColors = isDark ? [
        { backgroundColor: '#374151', color: '#d1d5db' }, // Level 0 - gray-700
        { backgroundColor: '#4b5563', color: '#d1d5db' }, // Level 1 - gray-600
        { backgroundColor: '#374151', color: '#9ca3af' }, // Level 2 - gray-700
        { backgroundColor: '#1f2937', color: '#9ca3af' }, // Level 3 - gray-800
        { backgroundColor: '#1f2937', color: '#9ca3af' }, // Level 4 - gray-800
        { backgroundColor: '#111827', color: '#9ca3af' }, // Level 5 - gray-900
      ] : [
        { backgroundColor: '#6b7280', color: '#ffffff' }, // Level 0 - gray-500
        { backgroundColor: '#9ca3af', color: '#374151' }, // Level 1 - gray-400
        { backgroundColor: '#d1d5db', color: '#4b5563' }, // Level 2 - gray-300
        { backgroundColor: '#d1d5db', color: '#4b5563' }, // Level 3 - gray-300
        { backgroundColor: '#e5e7eb', color: '#6b7280' }, // Level 4 - gray-200
        { backgroundColor: '#f3f4f6', color: '#6b7280' }, // Level 5 - gray-100
      ];
      return grayedColors[Math.min(adjustedLevel, 5)];
    }

    // REQUIREMENT 3: Active accounts with children = BLUE hierarchy (DIFFERENT colors for light/dark)
    const adjustedLevel = Math.max(0, level - 1);
    const colors = isDark ? [
      { backgroundColor: '#1e40af', color: '#ffffff' }, // Level 0 - blue-800
      { backgroundColor: '#1d4ed8', color: '#ffffff' }, // Level 1 - blue-700
      { backgroundColor: '#2563eb', color: '#ffffff' }, // Level 2 - blue-600
      { backgroundColor: '#3b82f6', color: '#ffffff' }, // Level 3 - blue-500
      { backgroundColor: '#60a5fa', color: '#ffffff' }, // Level 4 - blue-400
      { backgroundColor: '#93c5fd', color: '#111827' }, // Level 5 - blue-300
    ] : [
      { backgroundColor: '#1e3a8a', color: '#ffffff' }, // Level 0 - blue-900
      { backgroundColor: '#1d4ed8', color: '#ffffff' }, // Level 1 - blue-700
      { backgroundColor: '#3b82f6', color: '#ffffff' }, // Level 2 - blue-500
      { backgroundColor: '#60a5fa', color: '#111827' }, // Level 3 - blue-400
      { backgroundColor: '#93c5fd', color: '#111827' }, // Level 4 - blue-300
      { backgroundColor: '#bfdbfe', color: '#111827' }, // Level 5 - blue-200
    ];
    return colors[Math.min(adjustedLevel, 5)];
  }, []);

  const renderAccounts = useCallback((accounts: DataChartOfAccountList[], level: number = 1, parentId: string | null = null): React.ReactNode => {
    return accounts.map((account) => {
      const hasChildren = account.subAccounts && account.subAccounts.length > 0;
      const rowStyle = getLevelColorStyle(level, hasChildren, account.is_active);

      return (
        <React.Fragment key={account.id}>
          <AccountRow
            account={account}
            level={level}
            parentId={parentId}
            hasChildren={hasChildren}
            isActive={account.is_active}
            rowStyle={rowStyle}
            onToggle={toggleRow}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
          />
          {hasChildren && renderAccounts(account.subAccounts!, level + 1, String(account.id))}
        </React.Fragment>
      );
    });
  }, [toggleRow, handleEdit, handleDelete, handleReactivate, getLevelColorStyle]);

  // Apply filter to get filtered accounts (memoized to prevent re-filtering on every render)
  const filteredAccounts = useMemo(() =>
    filterAccounts(coaDataAccount || [], searchTerm, statusFilter, branchFilter),
    [coaDataAccount, searchTerm, statusFilter, branchFilter]
  );

  return (
    <>
      <style jsx global>{`
        .row-hidden {
          display: none !important;
        }

        .expanded .chevron-icon {
          transform: rotate(90deg);
        }

        .chevron-icon {
          transition: transform 0.2s ease-in-out;
        }
      `}</style>
      <div>
        <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className={showForm ? `col-span-2` : `col-span-3`}>
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
                    onClick={() => handleShowForm('Create Account', true, null)}
                  >
                    <GitBranch size={14} />
                    <span>Create Account</span>
                  </button>
                  <button
                    className="bg-success text-white py-2 px-4 rounded hover:bg-opacity-90 flex items-center justify-center space-x-2"
                    onClick={expandAll}
                    title="Expand All Accounts"
                  >
                    <PlusSquare size={14} />
                    <span>Expand All</span>
                  </button>
                  <button
                    className="bg-danger text-white py-2 px-4 rounded hover:bg-opacity-90 flex items-center justify-center space-x-2"
                    onClick={collapseAll}
                    title="Collapse All Accounts"
                  >
                    <MinusSquare size={14} />
                    <span>Collapse All</span>
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
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] h-[600px]">
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

          {showForm && (
            <div className="fade-in">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-7">
                  <CoaForm
                    setShowForm={setShowForm}
                    fetchCoaDataTable={fetchCoaDataTable}
                    actionLbl={actionLbl}
                    coaDataAccount={coaDataAccount || []}
                    selectedAccount={selectedAccount}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      </div>
    </>
  );
};

export default ChartofAcctList;