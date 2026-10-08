import Button from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';
import React, { useState } from 'react';
import type { AccountDetail } from '@/types/chartOfAccounts';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge } from '@/components/StatusBadge';

interface AccountDetailHeaderProps {
  account: AccountDetail;
  onBack: () => void;
}

const AccountDetailHeader: React.FC<AccountDetailHeaderProps> = ({ account, onBack }) => {
  const isDebitAccount = account.is_debit === '1' || account.is_debit === 'true';
  const [showAllSubAccounts, setShowAllSubAccounts] = useState(false);
  const INITIAL_DISPLAY_COUNT = 3;

  return (
    <Card>
      <CardHeader
        title="Account Details"
        actions={
          <Button variant="secondary" onClick={onBack}>
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
          </Button>
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Account Name */}
          <div>
            <p className="mb-1 text-sm font-semibold text-black dark:text-white">
              Account Name
            </p>
            <p className="text-base font-semibold text-black dark:text-white">
              {account.account_name}
            </p>
          </div>

          {/* Account Number */}
          <div>
            <p className="mb-1 text-sm font-semibold text-black dark:text-white">
              Account Number
            </p>
            <p className="text-base font-mono font-semibold text-black dark:text-white">
              {account.number}
            </p>
          </div>

          {/* Balance */}
          <div>
            <p className="mb-1 text-sm font-semibold text-black dark:text-white">
              Current Balance
            </p>
            <p className={`text-base font-semibold ${
              parseFloat(account.balance) < 0 ? 'text-danger' : 'text-success'
            }`}>
              {formatCurrency(account.balance)}
            </p>
          </div>

          {/* Account Type */}
          <div>
            <p className="mb-1 text-sm font-semibold text-black dark:text-white">
              Account Type
            </p>
            <StatusBadge tone="neutral" icon={false}>
              {isDebitAccount ? 'Debit' : 'Credit'}
            </StatusBadge>
          </div>

          {/* Status */}
          <div>
            <p className="mb-1 text-sm font-semibold text-black dark:text-white">
              Status
            </p>
            <StatusBadge tone={account.is_active ? 'neutral' : 'closed'}>
              {account.is_active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </div>

          {/* Transaction Count */}
          <div>
            <p className="mb-1 text-sm font-semibold text-black dark:text-white">
              Total Transactions
            </p>
            <p className="text-base font-semibold text-black dark:text-white">
              {account.transaction_count.toLocaleString()}
            </p>
          </div>

          {/* Parent Account */}
          {account.parent && (
            <div>
              <p className="mb-1 text-sm font-semibold text-black dark:text-white">
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
              <p className="mb-1 text-sm font-semibold text-black dark:text-white">
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
              <p className="mb-1 text-sm font-semibold text-black dark:text-white">
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
              <p className="mb-1 text-sm font-semibold text-black dark:text-white">
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
                {(showAllSubAccounts
                  ? account.subAccounts
                  : account.subAccounts.slice(0, INITIAL_DISPLAY_COUNT)
                ).map((subAccount) => (
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
              {account.subAccounts.length > INITIAL_DISPLAY_COUNT && (
                <button
                  onClick={() => setShowAllSubAccounts(!showAllSubAccounts)}
                  className="mt-3 text-sm text-primary hover:underline focus:outline-none"
                >
                  {showAllSubAccounts
                    ? 'Hide'
                    : `Show ${account.subAccounts.length - INITIAL_DISPLAY_COUNT} more`}
                </button>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default AccountDetailHeader;
