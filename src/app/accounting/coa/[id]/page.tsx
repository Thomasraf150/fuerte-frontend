'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import AccountDetailHeader from './components/AccountDetailHeader';
import TransactionHistoryTable from './components/TransactionHistoryTable';
import TransactionFilters from './components/TransactionFilters';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import { useAuthStore } from '@/store';
import CoaQueryMutations from '@/graphql/CoaQueryMutations';
import type {
  AccountDetail,
  AccountTransactionsResponse,
  TransactionFilters as FilterType,
  PaginationParams
} from '@/types/chartOfAccounts';

const AccountDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  // State
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [transactions, setTransactions] = useState<AccountTransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and pagination
  const [filters, setFilters] = useState<FilterType>({
    startDate: undefined,
    endDate: undefined,
    journalType: undefined
  });
  const [debouncedFilters, setDebouncedFilters] = useState<FilterType>(filters);
  const [pagination, setPagination] = useState<PaginationParams>({
    limit: 20,
    offset: 0
  });

  const graphqlAPI = process.env.NEXT_PUBLIC_API_GRAPHQL || '';

  // Fetch account details
  useEffect(() => {
    const fetchAccountDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const { GET_AUTH_TOKEN } = useAuthStore.getState();
        const accountResponse = await fetch(graphqlAPI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
          },
          body: JSON.stringify({
            query: CoaQueryMutations.GET_ACCOUNT_BY_ID_QUERY,
            variables: { id: accountId }
          })
        });
        const accountResult = await accountResponse.json();

        // Check for GraphQL errors first
        if (accountResult.errors) {
          console.error('GraphQL errors:', accountResult.errors);
          setError(accountResult.errors[0]?.message || 'Failed to load account');
          return;
        }

        if (accountResult.data?.getAccountById) {
          setAccount(accountResult.data.getAccountById);
        } else {
          setError('Account not found');
        }
      } catch (err: any) {
        console.error('Error fetching account detail:', err);
        setError(err.message || 'Failed to load account details');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchAccountDetail();
    }
  }, [accountId, graphqlAPI]);

  // Debounce filter changes to reduce API calls (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    // Cleanup timeout if filters change again before delay completes
    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!account) return;

      try {
        setLoadingTransactions(true);

        const variables = {
          accountNumber: account.number,
          startDate: debouncedFilters.startDate,
          endDate: debouncedFilters.endDate,
          journalType: debouncedFilters.journalType,
          limit: pagination.limit,
          offset: pagination.offset
        };

        const { GET_AUTH_TOKEN } = useAuthStore.getState();
        const transactionResponse = await fetch(graphqlAPI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
          },
          body: JSON.stringify({
            query: CoaQueryMutations.GET_ACCOUNT_TRANSACTIONS_QUERY,
            variables: variables
          })
        });
        const transactionResult = await transactionResponse.json();

        // Check for GraphQL errors first
        if (transactionResult.errors) {
          console.error('GraphQL transaction errors:', transactionResult.errors);
          setError(transactionResult.errors[0]?.message || 'Failed to load transactions');
          return;
        }

        if (transactionResult.data?.getAccountTransactions) {
          setTransactions(transactionResult.data.getAccountTransactions);
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoadingTransactions(false);
      }
    };

    if (account?.number) {
      fetchTransactions();
    }
  }, [account, debouncedFilters, pagination, graphqlAPI]);

  // Handler functions
  const handleFilterChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const handleBackToList = () => {
    router.push('/accounting/coa');
  };

  // Loading state
  if (loading) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Loading..." />
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DefaultLayout>
    );
  }

  // Error state
  if (error || !account) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error || 'Account not found'}
            </h3>
            <button
              onClick={handleBackToList}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Chart of Accounts
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={`Account: ${account.account_name}`}
        />
      </div>

      <div className="flex flex-col gap-6">
        {/* Account Header */}
        <AccountDetailHeader
          account={account}
          onBack={handleBackToList}
        />

        {/* Transaction Filters */}
        <TransactionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Transaction History Table */}
        <TransactionHistoryTable
          account={account}
          transactions={transactions}
          loading={loadingTransactions}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </DefaultLayout>
  );
};

export default AccountDetailPage;
