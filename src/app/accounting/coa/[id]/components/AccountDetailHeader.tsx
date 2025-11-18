import React from 'react';
import type { AccountDetail } from '@/types/chartOfAccounts';
import { formatCurrency } from '@/utils/formatters';

interface AccountDetailHeaderProps {
  account: AccountDetail;
  onBack: () => void;
}

const AccountDetailHeader: React.FC<AccountDetailHeaderProps> = ({ account, onBack }) => {
  const isDebitAccount = account.is_debit === '1' || account.is_debit === 'true';

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-black dark:text-white">
            Account Details
          </h3>
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded bg-meta-3 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
          >
            <svg
              className="fill-current"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 2.66675L2.66659 8.00008L7.99992 13.3334"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.3333 8H2.66659"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to List
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Account Name */}
          <div>
            <p className="text-sm font-medium text-black dark:text-white mb-1">
              Account Name
            </p>
            <p className="text-base font-semibold text-black dark:text-white">
              {account.account_name}
            </p>
          </div>

          {/* Account Number */}
          <div>
            <p className="text-sm font-medium text-black dark:text-white mb-1">
              Account Number
            </p>
            <p className="text-base font-mono font-semibold text-black dark:text-white">
              {account.number}
            </p>
          </div>

          {/* Balance */}
          <div>
            <p className="text-sm font-medium text-black dark:text-white mb-1">
              Current Balance
            </p>
            <p className={`text-base font-semibold ${
              parseFloat(account.balance) < 0 ? 'text-red-500' : 'text-green-500'
            }`}>
              {formatCurrency(account.balance)}
            </p>
          </div>

          {/* Account Type */}
          <div>
            <p className="text-sm font-medium text-black dark:text-white mb-1">
              Account Type
            </p>
            <span className={`inline-flex rounded px-2 py-1 text-sm font-medium ${
              isDebitAccount
                ? 'bg-success bg-opacity-10 text-success'
                : 'bg-warning bg-opacity-10 text-warning'
            }`}>
              {isDebitAccount ? 'Debit' : 'Credit'}
            </span>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm font-medium text-black dark:text-white mb-1">
              Status
            </p>
            <span className={`inline-flex rounded px-2 py-1 text-sm font-medium ${
              account.is_active
                ? 'bg-success bg-opacity-10 text-success'
                : 'bg-danger bg-opacity-10 text-danger'
            }`}>
              {account.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Transaction Count */}
          <div>
            <p className="text-sm font-medium text-black dark:text-white mb-1">
              Total Transactions
            </p>
            <p className="text-base font-semibold text-black dark:text-white">
              {account.transaction_count.toLocaleString()}
            </p>
          </div>

          {/* Parent Account */}
          {account.parent && (
            <div>
              <p className="text-sm font-medium text-black dark:text-white mb-1">
                Parent Account
              </p>
              <p className="text-base text-black dark:text-white">
                {account.parent.account_name} ({account.parent.number})
              </p>
            </div>
          )}

          {/* Branch */}
          {account.branch_sub && (
            <div>
              <p className="text-sm font-medium text-black dark:text-white mb-1">
                Branch
              </p>
              <p className="text-base text-black dark:text-white">
                {account.branch_sub.name}
              </p>
            </div>
          )}

          {/* Created By */}
          {account.created_by && (
            <div>
              <p className="text-sm font-medium text-black dark:text-white mb-1">
                Created By
              </p>
              <p className="text-base text-black dark:text-white">
                {account.created_by.name}
              </p>
            </div>
          )}

          {/* Description */}
          {account.description && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-black dark:text-white mb-1">
                Description
              </p>
              <p className="text-base text-black dark:text-white">
                {account.description}
              </p>
            </div>
          )}

          {/* Sub Accounts */}
          {account.subAccounts && account.subAccounts.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-black dark:text-white mb-2">
                Sub Accounts ({account.subAccounts.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {account.subAccounts.map((subAccount) => (
                  <span
                    key={subAccount.id}
                    className="inline-flex items-center gap-1 rounded bg-gray-2 px-3 py-1 text-sm text-black dark:bg-meta-4 dark:text-white"
                  >
                    <span className="font-mono">{subAccount.number}</span>
                    <span>-</span>
                    <span>{subAccount.account_name}</span>
                    {!subAccount.is_active && (
                      <span className="text-xs text-danger">(Inactive)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetailHeader;
