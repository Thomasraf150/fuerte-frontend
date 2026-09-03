"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import { DataChartOfAccountList, DataSubBranches, SelectOption } from '@/utils/DataTypes';
import ReactSelect from '@/components/ReactSelect';
import BranchBadge from '@/components/BranchBadge';
import { ChevronDown, ChevronRight, Edit2, Eye, GitBranch, Printer, RefreshCw, Search, Trash2 } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import useDebounce from '@/hooks/useDebounce';
import Swal from 'sweetalert2';

// 'all' is this screen's no-filter sentinel (not '') — kept as a real option so
// the control never renders blank.
const COA_ALL_BRANCHES_OPTION: SelectOption = { value: 'all', label: 'All Branches' };

// Memoized AccountRow component to prevent unnecessary re-renders
interface AccountRowProps {
  account: DataChartOfAccountList;
  level: number;
  parentId: string | null;
  isActive: boolean;
  rowClassName: string;
  /** Direct children. 0 renders a spacer so every name keeps the same left edge. */
  childCount: number;
  /** Whether this row's children are currently rendered. */
  isExpanded: boolean;
  /** Omitted while a filter is active, when the tree is force-expanded. */
  onToggle?: (id: string) => void;
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
  childCount,
  isExpanded,
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

  // The toggle's only content is an icon, so it needs a real accessible name.
  const toggleLabel = `${isExpanded ? 'Collapse' : 'Expand'} ${account.account_name}, ${childCount} ${childCount === 1 ? 'sub-account' : 'sub-accounts'}`;

  return (
    <tr
      className={`border-b dark:border-strokedark hover:bg-opacity-90 ${rowClassName}`}
      data-account-id={account.id}
      data-parent-id={parentId || undefined}
      data-level={level}
    >
      <td className="px-6 py-2 text-sm font-medium" style={{ paddingLeft: `${level * 20}px` }}>
        <div className="flex items-center gap-2">
          {/* Fixed-width slot whether or not the row has children, so every
              account name in the tree keeps the same left edge. */}
          {childCount > 0 && onToggle ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggle(String(account.id)); }}
              className="-my-2 flex min-h-[44px] w-6 shrink-0 items-center justify-center transition-opacity hover:opacity-70"
              aria-expanded={isExpanded}
              aria-label={toggleLabel}
              title={toggleLabel}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-6 shrink-0" aria-hidden />
          )}
          <span>
            {account.account_name}
            {!isActive && <span className="ml-2 text-xs text-danger">(Inactive)</span>}
          </span>
          {/* How much is hidden, so expanding is an informed click. */}
          {childCount > 0 && !isExpanded && (
            <span className="shrink-0 rounded-full bg-black bg-opacity-10 px-2 py-0.5 text-xs font-medium tabular-nums">
              {childCount}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-2 text-sm font-medium">{account.number}</td>
      <td className="px-6 py-2 text-sm font-medium"><BranchBadge branchName={account?.branch_sub?.branch?.name} subBranchName={account?.branch_sub?.name} /></td>
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
            className="text-body hover:text-black dark:text-bodydark dark:hover:text-white transition-colors"
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
              className="text-danger transition-opacity hover:opacity-70"
              title="Deactivate Account"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <button
              onClick={() => onReactivate(account)}
              className="text-green-600 transition-opacity hover:opacity-70 dark:text-green-400"
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
    // Without these the chevron never flips and children never appear.
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.childCount === nextProps.childCount &&
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
  // COLLAPSED BY DEFAULT. This tree is 1,406 accounts over 4 levels with only 5
  // roots, and it used to render every one of them: 36,849 DOM nodes, 76,742px
  // of table in a 900px viewport, and a ~1.9s blocking main-thread task on any
  // re-render — enough to stall the whole machine on the office PCs this runs on.
  // Holding only the OPEN ids (rather than the closed ones) means the default is
  // 5 rows and costs nothing to represent.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Apply filter to get filtered accounts (debounced search term prevents filtering on every keystroke)
  // A filter is the user asking to SEE something. filterAccounts has already
  // pruned the tree to matches plus their ancestors, so collapse is ignored while
  // one is active — otherwise a search would return rows the user cannot see.
  // Safe for the render cost too: a filtered tree is small by construction.
  const isFiltering = debouncedSearchTerm.trim() !== '' || statusFilter !== 'all' || branchFilter !== 'all';

  const coaBranchOptions: SelectOption[] = useMemo(
    () => [
      COA_ALL_BRANCHES_OPTION,
      ...(branchSubData ?? []).map((b: DataSubBranches) => ({ value: String(b.id), label: b.name })),
    ],
    [branchSubData],
  );

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
  // Note: lowerTerm is pre-lowercased by the caller to avoid redundant toLowerCase() in every recursive call
  const filterAccounts = useCallback((accounts: DataChartOfAccountList[], lowerTerm: string, status: 'all' | 'active' | 'inactive', branch: string): DataChartOfAccountList[] => {
    return accounts.reduce((filtered: DataChartOfAccountList[], account) => {
      const statusMatches =
        status === 'all' ||
        (status === 'active' && account.is_active) ||
        (status === 'inactive' && !account.is_active);

      const branchMatches =
        branch === 'all' ||
        String(account.branch_sub_id) === branch;

      const searchMatches = !lowerTerm ||
        account.account_name?.toLowerCase().includes(lowerTerm) ||
        account.number?.toLowerCase().includes(lowerTerm);

      const filteredChildren = account.subAccounts
        ? filterAccounts(account.subAccounts, lowerTerm, status, branch)
        : [];

      if ((statusMatches && branchMatches && searchMatches) || filteredChildren.length > 0) {
        // When a parent matches but NONE of its children do, only fall back to
        // the full (unfiltered) child list if the sole active filter is search
        // — that preserves "search a parent → see its whole subtree". Under a
        // status or branch filter, showing the unfiltered children would leak
        // active accounts into the "Inactive" view or other-branch children
        // under a matching parent, so show none.
        const keepAllChildren = status === 'all' && branch === 'all';
        filtered.push({
          ...account,
          subAccounts: filteredChildren.length > 0
            ? filteredChildren
            : (keepAllChildren ? account.subAccounts : [])
        });
      }

      return filtered;
    }, []);
  }, []);

  // Note: fetchCoaDataTable() is already called on mount inside useCoa hook — no duplicate call needed here

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
      const childCount = account.subAccounts?.length ?? 0;
      const hasChildren = childCount > 0;
      const rowClassName = getLevelColorClass(level, hasChildren, account.is_active);
      // Filtering force-expands; otherwise only what the user opened.
      const isExpanded = isFiltering || expandedIds.has(String(account.id));

      return (
        <React.Fragment key={account.id}>
          <AccountRow
            account={account}
            level={level}
            parentId={parentId}
            isActive={account.is_active}
            rowClassName={rowClassName}
            childCount={childCount}
            isExpanded={isExpanded}
            onToggle={isFiltering ? undefined : toggleExpanded}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
          />
          {hasChildren && isExpanded && renderAccounts(account.subAccounts!, level + 1, String(account.id))}
        </React.Fragment>
      );
    });
  }, [handleEdit, handleDelete, handleReactivate, getLevelColorClass, expandedIds, isFiltering, toggleExpanded]);


  const filteredAccounts = useMemo(() =>
    filterAccounts(coaDataAccount || [], debouncedSearchTerm.toLowerCase().trim(), statusFilter, branchFilter),
    [coaDataAccount, debouncedSearchTerm, statusFilter, branchFilter, filterAccounts]
  );

  // Memoize the rendered account tree to prevent re-creating 1000+ JSX elements on keystroke re-renders.
  // Without this, every searchTerm keystroke calls renderAccounts() even though filteredAccounts hasn't changed.
  const renderedAccountTree = useMemo(() =>
    renderAccounts(filteredAccounts),
    [filteredAccounts, renderAccounts]
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
                <ReactSelect
                  aria-label="Filter by branch"
                  options={coaBranchOptions}
                  value={
                    coaBranchOptions.find((o) => o.value === String(branchFilter)) ??
                    COA_ALL_BRANCHES_OPTION
                  }
                  onChange={(option) => setBranchFilter(option?.value ?? 'all')}
                  placeholder="All Branches"
                  isLoading={!branchSubData}
                  loadingMessage={() => 'Loading branches...'}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
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
                    renderedAccountTree
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
