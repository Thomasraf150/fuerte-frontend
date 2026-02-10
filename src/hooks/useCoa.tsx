"use client"

import { useCallback, useEffect, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import CoaQueryMutations from '@/graphql/CoaQueryMutations';
import BranchQueryMutation from '@/graphql/BranchQueryMutation';
import { useAuthStore } from "@/store";

// Pure utility — no hook state, safe to define outside the hook for stable reference
const countInactiveDescendants = (account: DataChartOfAccountList): number => {
  if (!account.subAccounts || account.subAccounts.length === 0) return 0;
  return account.subAccounts.reduce((count, child) => {
    return count + (child.is_active ? 0 : 1) + countInactiveDescendants(child);
  }, 0);
};

const useCoa = () => {
  const { COA_TABLE_QUERY, UPDATE_COA_MUTATION, SAVE_COA_MUTATION, TOGGLE_ACTIVE_STATUS_MUTATION, PRINT_CHART_OF_ACCOUNTS } = CoaQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutation;

  const [coaDataAccount, setCoaDataAccount] = useState<DataChartOfAccountList[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [coaLoading, setCoaLoading] = useState<boolean>(false);
  const [branchSubData, setBranchSubData] = useState<DataSubBranches[] | undefined>(undefined);

  const fetchDataSubBranch = useCallback(async (orderBy = 'id_desc') => {
    const { GET_AUTH_TOKEN } = useAuthStore.getState();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
      },
      body: JSON.stringify({
        query: GET_ALL_SUB_BRANCH_QUERY,
        variables: { orderBy }
      }),
    });

    const result = await response.json();
    setBranchSubData(result.data.getAllBranch);
  }, [GET_ALL_SUB_BRANCH_QUERY]);
  
  // Initialize data on mount (following useUsers pattern)
  useEffect(() => {
    fetchDataSubBranch("id_desc");
    fetchCoaDataTable();
  }, []);

  const fetchCoaDataTable = useCallback(async () => {
    setLoading(true);

    try {
      let variables: { input: any; _cacheBust?: number } = {
        input : { startDate: "", endDate: "" },
        _cacheBust: Date.now() // Force fresh query by preventing cache
      };

      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
        },
        body: JSON.stringify({
          query: COA_TABLE_QUERY,
          variables
        }),
      });
      const result = await response.json();

      // Check for GraphQL errors
      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        toast.error(`Failed to fetch accounts: ${result.errors[0]?.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      // Check if data exists
      if (!result.data || !result.data.getChartOfAccounts) {
        console.error('Invalid response structure:', result);
        toast.error('Failed to fetch accounts: Invalid response from server');
        setLoading(false);
        return;
      }

      // Normalize is_active to boolean - handles all backend value types
      // Note: Boolean("0") = true in JS (non-empty string), so we must check explicitly
      const normalizeAccount = (account: any): any => ({
        ...account,
        is_active: account.is_active === true || account.is_active === 1 || account.is_active === '1',
        subAccounts: account.subAccounts?.map(normalizeAccount) || []
      });

      const normalizedData = result.data.getChartOfAccounts.map(normalizeAccount);
      setCoaDataAccount(normalizedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching COA data:', error);
      toast.error('Failed to fetch accounts');
      setLoading(false);
    }
  }, [COA_TABLE_QUERY]);

  const onSubmitCoa: SubmitHandler<DataChartOfAccountList> = useCallback(async (data) => {
    setCoaLoading(true);
    try {
      let mutation;
      let variables: { input: any } = {
        input: {
          // user_id REMOVED - backend will use auth()->id() from authenticated session
          // This fixes the foreign key error (localStorage had stale user_id = 39)
          branch_sub_id: data.branch_sub_id || null, // Send NULL for empty branch (root accounts)
          account_name: data.account_name,
          description: data.description,
          is_debit: data.is_debit,
          balance: data.balance,
          parent_account_id: data.parent_account_id,
        },
      };

      if (data.id) {
        mutation = UPDATE_COA_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_COA_MUTATION;
      }

      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        console.error('COA submission error:', result.errors);
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for response data
      const responseData = result.data?.createCoa || result.data?.updateCoa;

      if (responseData) {
        // Check status field explicitly (handles both boolean and string "true"/"false")
        const status = responseData.status === true || responseData.status === 'true';

        if (status) {
          toast.success("Chart of Account saved successfully!");
          return { success: true, data: responseData };
        } else {
          // Show error message from backend
          toast.error(responseData.message || "Operation failed");
          return { success: false, error: responseData.message };
        }
      }

      // Unexpected response format
      toast.error("Unexpected response from server");
      return { success: false, error: "Unknown error" };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCoaLoading(false);
    }
  }, [UPDATE_COA_MUTATION, SAVE_COA_MUTATION]);

  // Single function for both deactivate and reactivate (eliminates ~75 lines of duplication)
  const toggleAccountStatus = useCallback(async (id: string, active: boolean, cascade: boolean = false) => {
    setCoaLoading(true);
    try {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
        },
        body: JSON.stringify({
          query: TOGGLE_ACTIVE_STATUS_MUTATION,
          variables: { id, active, cascade },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      if (result.data?.toggleActiveStatus) {
        const responseData = result.data.toggleActiveStatus;
        const affectedAccounts = responseData.affectedAccounts || [];
        const affectedCount = affectedAccounts.length;

        // Update local state tree with affected accounts from backend
        if (affectedAccounts.length > 0) {
          const affectedIds = new Set(affectedAccounts.map((acc: any) => acc.id));

          const updateAccountStatus = (accounts: DataChartOfAccountList[]): DataChartOfAccountList[] =>
            accounts.map(account => ({
              ...account,
              is_active: affectedIds.has(account.id) ? active : account.is_active,
              subAccounts: account.subAccounts ? updateAccountStatus(account.subAccounts) : []
            }));

          setCoaDataAccount(prev => prev ? updateAccountStatus(prev) : prev);
        } else {
          await fetchCoaDataTable();
        }

        const action = active ? 'reactivated' : 'deactivated';
        if (affectedCount > 1) {
          toast.success(`Account and ${affectedCount - 1} sub-account(s) ${action} successfully!`);
        } else {
          toast.success(`Account ${action} successfully!`);
        }

        return { success: true, data: responseData };
      }

      toast.error(`Failed to ${active ? 'reactivate' : 'deactivate'} account`);
      return { success: false, error: "Unknown error" };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCoaLoading(false);
    }
  }, [TOGGLE_ACTIVE_STATUS_MUTATION, fetchCoaDataTable]);

  // Thin wrappers for API compatibility with consumers
  const deleteCoaAccount = useCallback(
    (id: string) => toggleAccountStatus(id, false),
    [toggleAccountStatus]
  );

  const reactivateAccount = useCallback(
    (id: string, cascade: boolean = false) => toggleAccountStatus(id, true, cascade),
    [toggleAccountStatus]
  );

  const printChartOfAccounts = useCallback(async (branchSubId: string = 'all') => {
    setLoading(true);

    // Open window synchronously to prevent popup blocker
    const pdfWindow = window.open('', '_blank');

    if (!pdfWindow) {
      toast.error('Please allow popups for this site to view PDFs');
      setLoading(false);
      return { success: false, error: 'Popup blocked' };
    }

    pdfWindow.document.write(`
      <html>
        <head>
          <title>Generating PDF...</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .loader { text-align: center; }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h2>Generating Chart of Accounts PDF...</h2>
            <p>Please wait while we prepare your document.</p>
          </div>
        </body>
      </html>
    `);
    pdfWindow.document.close();

    try {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
        },
        body: JSON.stringify({
          query: PRINT_CHART_OF_ACCOUNTS,
          variables: {
            branch_sub_id: branchSubId === 'all' ? null : branchSubId
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        pdfWindow?.close();
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      if (result.data?.printChartOfAccounts) {
        const { url, filename } = result.data.printChartOfAccounts;

        // Redirect the opened window to the PDF URL
        if (pdfWindow) {
          pdfWindow.location.href = url;
        }

        toast.success(`Chart of Accounts PDF generated: ${filename}`);
        return { success: true, data: result.data.printChartOfAccounts };
      }

      pdfWindow?.close();
      toast.error("Failed to generate PDF");
      return { success: false, error: "Unknown error" };

    } catch (error) {
      pdfWindow?.close();
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [PRINT_CHART_OF_ACCOUNTS]);

  return {
    fetchCoaDataTable,
    coaDataAccount,
    branchSubData,
    fetchDataSubBranch,
    onSubmitCoa,
    deleteCoaAccount,
    reactivateAccount,
    printChartOfAccounts,
    countInactiveDescendants,
    coaLoading,
    loading
  };
};

export default useCoa;