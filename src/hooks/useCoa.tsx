"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import CoaQueryMutations from '@/graphql/CoaQueryMutations';
import BranchQueryMutation from '@/graphql/BranchQueryMutation';
import { useAuthStore } from "@/store";

const useCoa = () => {
  const { COA_TABLE_QUERY, UPDATE_COA_MUTATION, SAVE_COA_MUTATION, TOGGLE_ACTIVE_STATUS_MUTATION, PRINT_CHART_OF_ACCOUNTS } = CoaQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutation;

  const [coaDataAccount, setCoaDataAccount] = useState<DataChartOfAccountList[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [coaLoading, setCoaLoading] = useState<boolean>(false);
  const [branchSubData, setBranchSubData] = useState<DataSubBranches[] | undefined>(undefined);

  const fetchDataSubBranch = async (orderBy = 'id_desc') => {
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
  };
  
  const fetchCoaData = async (orderBy = 'id_desc') => {
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
  };

  const fetchCoaDataTable = async () => {
    console.log('🟢 useCoa: fetchCoaDataTable() CALLED');
    setLoading(true);

    try {
      let variables: { input: any; _cacheBust?: number } = {
        input : { startDate: "", endDate: "" },
        _cacheBust: Date.now() // Force fresh query by preventing cache
      };

      console.log('🟢 useCoa: Fetching COA data with cacheBust:', variables._cacheBust);

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
      console.log('🟢 useCoa: Received response, accounts count:', result?.data?.getChartOfAccounts?.length);

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

      // Normalize is_active to boolean to prevent type inconsistencies
      const normalizeAccount = (account: any): any => ({
        ...account,
        is_active: Boolean(account.is_active),
        subAccounts: account.subAccounts?.map(normalizeAccount) || []
      });

      const normalizedData = result.data.getChartOfAccounts.map(normalizeAccount);
      console.log('🟢 useCoa: About to update state with', normalizedData.length, 'accounts');
      console.log('🟢 useCoa: Account names:', normalizedData.map((a: any) => a.account_name).join(', '));
      setCoaDataAccount(normalizedData);
      console.log('🟢 useCoa: State updated, setLoading(false)');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching COA data:', error);
      toast.error('Failed to fetch accounts');
      setLoading(false);
    }
  };

  const onSubmitCoa: SubmitHandler<DataChartOfAccountList> = async (data) => {
    setCoaLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      
      let mutation;
      let variables: { input: any } = {
        input: {
          user_id: String(userData?.user?.id),
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

      // TEMPORARY DEBUG: Log GraphQL variables
      console.log('=== GRAPHQL VARIABLES DEBUG ===');
      console.log('Account Name:', variables.input.account_name);
      console.log('Description:', variables.input.description);
      console.log('Full Variables:', JSON.stringify(variables, null, 2));
      console.log('================================');

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

      console.log('🔵 useCoa: Raw GraphQL response:', JSON.stringify(result, null, 2));

      // Handle GraphQL errors
      if (result.errors) {
        console.log('🔴 useCoa: GraphQL errors detected');
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for response data
      const responseData = result.data?.createCoa || result.data?.updateCoa;
      console.log('🔵 useCoa: Response data:', JSON.stringify(responseData, null, 2));
      console.log('🔵 useCoa: Response data status:', responseData?.status, 'type:', typeof responseData?.status);

      if (responseData) {
        // Check status field explicitly (handles both boolean and string "true"/"false")
        const status = responseData.status === true || responseData.status === 'true';
        console.log('🔵 useCoa: Status evaluated to:', status);

        if (status) {
          console.log('✅ useCoa: Success path - calling toast.success()');
          toast.success("Chart of Account saved successfully!");
          return { success: true, data: responseData };
        } else {
          console.log('❌ useCoa: Failure path - calling toast.error() with message:', responseData.message);
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
  };

  const countInactiveDescendants = (account: DataChartOfAccountList): number => {
    if (!account.subAccounts || account.subAccounts.length === 0) {
      return 0;
    }

    let count = 0;
    for (const child of account.subAccounts) {
      // Count this child if it's inactive
      if (!child.is_active) {
        count++;
      }
      // Recursively count inactive descendants
      count += countInactiveDescendants(child);
    }

    return count;
  };

  const deleteCoaAccount = async (id: string) => {
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
          variables: {
            id,
            active: false
          },
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

        // Manually update state with affected accounts if backend returns them
        if (affectedAccounts.length > 0) {
          const affectedIds = new Set(affectedAccounts.map((acc: any) => acc.id));

          // Recursive function to update account status in the tree
          const updateAccountStatus = (accounts: DataChartOfAccountList[]): DataChartOfAccountList[] => {
            return accounts.map(account => {
              const isAffected = affectedIds.has(account.id);
              return {
                ...account,
                is_active: isAffected ? false : account.is_active,
                subAccounts: account.subAccounts ? updateAccountStatus(account.subAccounts) : []
              };
            });
          };

          // Update state - this triggers React re-render
          setCoaDataAccount(prev => prev ? updateAccountStatus(prev) : prev);
        } else {
          // Fallback: If backend doesn't return affected accounts, refetch all data
          await fetchCoaDataTable();
        }

        if (affectedCount === 1) {
          toast.success("Account deactivated successfully!");
        } else if (affectedCount > 1) {
          toast.success(`Account and ${affectedCount - 1} sub-account(s) deactivated successfully!`);
        } else {
          toast.success("Account deactivated successfully!");
        }

        return { success: true, data: responseData };
      }

      toast.error("Failed to deactivate account");
      return { success: false, error: "Unknown error" };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCoaLoading(false);
    }
  };

  const reactivateAccount = async (id: string, cascade: boolean = false) => {
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
          variables: {
            id,
            active: true,
            cascade: cascade
          },
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

        // Manually update state with affected accounts if backend returns them
        if (affectedAccounts.length > 0) {
          const affectedIds = new Set(affectedAccounts.map((acc: any) => acc.id));

          // Recursive function to update account status in the tree
          const updateAccountStatus = (accounts: DataChartOfAccountList[]): DataChartOfAccountList[] => {
            return accounts.map(account => {
              const isAffected = affectedIds.has(account.id);
              return {
                ...account,
                is_active: isAffected ? true : account.is_active,
                subAccounts: account.subAccounts ? updateAccountStatus(account.subAccounts) : []
              };
            });
          };

          // Update state - this triggers React re-render
          setCoaDataAccount(prev => prev ? updateAccountStatus(prev) : prev);
        } else {
          // Fallback: If backend doesn't return affected accounts, refetch all data
          await fetchCoaDataTable();
        }

        if (affectedCount === 1) {
          toast.success("Account reactivated successfully!");
        } else if (affectedCount > 1) {
          toast.success(`Account and ${affectedCount - 1} sub-account(s) reactivated successfully!`);
        } else {
          toast.success("Account reactivated successfully!");
        }

        return { success: true, data: responseData };
      }

      toast.error("Failed to reactivate account");
      return { success: false, error: "Unknown error" };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCoaLoading(false);
    }
  };

  const printChartOfAccounts = async (branchSubId: string = 'all') => {
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
  };

  useEffect(() => {
    fetchDataSubBranch();
  }, []);

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