"use client"

import { useCallback, useEffect, useState } from 'react';
import UserQueryMutations from '@/graphql/UserQueryMutation';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import { User, DataFormUser, DataSubBranches, DataRoles } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import { usePagination } from './usePagination';

const useUsers = () => {
  const { GET_USER_QUERY,
          CREATE_USER_MUTATION,
          GET_SINGLE_USER_QUERY,
          UPDATE_USER_MUTATION,
          GET_ROLE_QUERY,
          SET_USER_BRANCH_ACCESS_MUTATION } = UserQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutations;

  const [dataSubBranch, setDataSubBranch] = useState<DataSubBranches[]>([]);
  const [dataRole, setDataRole] = useState<DataRoles[]>([]);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [subBranchLoading, setSubBranchLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(false);

  // Wrapper function to adapt the existing GraphQL call for usePagination —
  // mirrors useBorrower so the users list gets the same search + paging UX.
  const fetchUsersForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const token = useAuthStore.getState().GET_AUTH_TOKEN();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: GET_USER_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }),
          orderBy: [{ column: "id", order: 'DESC' }],
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error occurred');
    }

    if (!result.data || !result.data.users) {
      throw new Error('No data returned from server - check if API is running');
    }

    return {
      data: result.data.users.data,
      paginatorInfo: result.data.users.paginatorInfo || {
        total: result.data.users.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      },
    };
  }, [GET_USER_QUERY]);

  const {
    data,
    loading,
    error: usersError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<User>({
    fetchFunction: fetchUsersForPagination,
    config: { initialPageSize: 20 },
  });

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_ROLE_QUERY,
          variables: {},
        }),
      });

      const result = await response.json();
      setDataRole(result.data.role);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchSubBranch = async (orderBy: string) => {
    setSubBranchLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_ALL_SUB_BRANCH_QUERY,
          variables: { orderBy },
        }),
      });

      const result = await response.json();
      setDataSubBranch(result.data.getAllBranch);
    } catch (error) {
      console.error('Error fetching sub branches:', error);
    } finally {
      setSubBranchLoading(false);
    }
  };

  // Returns the loaded user (or undefined on failure) so the caller can
  // manage form state directly — no shared singleUserData state needed.
  const fetchSingleUser = async (user: User): Promise<DataFormUser | undefined> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_SINGLE_USER_QUERY,
          variables: { id: user.id },
        }),
      });

      const result = await response.json();
      return result.data?.user;
    } catch (error) {
      console.error('Error fetching single user:', error);
      return undefined;
    }
  }

  // ----- onSubmitUser helpers -------------------------------------------
  // Split out so the orchestrator below stays under the 50-line ceiling.

  type SubmitResult = { success: boolean; error?: string; data?: any };

  const validateUserSubmission = (data: DataFormUser): { branchSubId: number; roleId: number } | SubmitResult => {
    const branchSubId = Number(data.branch_sub_id);
    if (!branchSubId || branchSubId <= 0 || isNaN(branchSubId)) {
      toast.error('Please select a valid branch');
      return { success: false, error: 'Invalid branch selection' };
    }
    const roleId = Number(data.role_id);
    if (!roleId || roleId <= 0 || isNaN(roleId)) {
      toast.error('Please select a valid role');
      return { success: false, error: 'Invalid role selection' };
    }
    return { branchSubId, roleId };
  };

  const buildUserMutationVars = (
    data: DataFormUser,
    branchSubId: number,
    roleId: number,
  ): { mutation: string; variables: { input: any } } => {
    const baseInput: any = {
      name: data.name,
      email: data.email,
      branch_sub_id: branchSubId,
      role_id: roleId,
    };
    if (data.id) {
      const input: any = { ...baseInput, id: Number(data.id) };
      if (data.password) input.password = data.password;
      return { mutation: UPDATE_USER_MUTATION, variables: { input } };
    }
    return {
      mutation: CREATE_USER_MUTATION,
      variables: { input: { ...baseInput, password: data.password } },
    };
  };

  // Owner-only follow-up call to persist additional sub-branch grants.
  // No-op when the field is undefined (preserves existing single-branch flow).
  const persistAdditionalGrants = async (
    savedUserId: number | string,
    ids: number[] | undefined,
    token: string | null | undefined,
  ): Promise<void> => {
    if (ids === undefined) return;
    try {
      const grantRes = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: SET_USER_BRANCH_ACCESS_MUTATION,
          variables: {
            user_id: String(savedUserId),
            branch_sub_ids: ids.map((id) => String(id)),
          },
        }),
      });
      const grantJson = await grantRes.json();
      if (grantJson.errors) {
        toast.warn(`User saved, but branch access update failed: ${grantJson.errors[0].message}`);
      }
    } catch (err) {
      console.error('setUserBranchAccess failed', err);
      toast.warn('User saved, but branch access update failed.');
    }
  };

  const onSubmitUser = async (data: DataFormUser): Promise<SubmitResult> => {
    setUserLoading(true);
    try {
      const validation = validateUserSubmission(data);
      if ('success' in validation) return validation;
      const { branchSubId, roleId } = validation;

      const token = useAuthStore.getState().GET_AUTH_TOKEN();
      const { mutation, variables } = buildUserMutationVars(data, branchSubId, roleId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: mutation, variables }),
      });
      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      const savedUser = result.data?.createUser || result.data?.updateUser;
      const savedUserId = savedUser?.id ?? data.id;
      if (savedUserId) {
        await persistAdditionalGrants(savedUserId, data.additional_branch_sub_ids, token);
      }

      toast.success(savedUser?.message || "User saved successfully!");
      return savedUser ? { success: true, data: savedUser } : { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUserLoading(false);
    }
  };

  // Sub-branch list + roles are static dropdown data, fetched once on mount.
  useEffect(() => {
    fetchSubBranch("id_desc");
    fetchRoles();
  }, []);

  return {
    data,
    loading,
    usersError,
    onSubmitUser,
    userLoading,
    dataSubBranch,
    refresh,
    fetchSingleUser,
    dataRole,
    rolesLoading,
    subBranchLoading,

    // Pagination state (mirrors useBorrower)
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    canGoNext,
    canGoPrevious,

    // Server-side pagination helper for CustomDatatable
    serverSidePaginationProps: {
      totalRecords: pagination.totalRecords,
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
      onPageChange: goToPage,
      onPageSizeChange: changePageSize,
      searchQuery,
      onSearchChange: setSearchQuery,
      pageSizeOptions: [10, 20, 50, 100],
      recordType: 'user',
      recordTypePlural: 'users',
    },
  };
};

export default useUsers;
