"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import { useDeleteWithApproval } from '@/hooks/useDeleteWithApproval';
import { graphqlFetch } from '@/utils/graphqlFetch';

import { DataBranches, DataBranchGroup, DataFormBranch, AuthStoreData, DataSubBranches, DataFormSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBranches = () => {
  const {
    SAVE_BRANCH_MUTATION,
    GET_BRANCH_QUERY,
    GET_BRANCH_GROUPS_QUERY,
    UPDATE_BRANCH_MUTATION,
    GET_SUB_BRANCH_QUERY,
    SAVE_SUB_BRANCH_MUTATION,
    UPDATE_SUB_BRANCH_MUTATION,
    DELETE_BRANCH_MUTATION,
    DELETE_SUB_BRANCH_MUTATION,
    GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY } = BranchQueryMutations;
  const [dataBranch, setDataBranch] = useState<DataBranches[] | undefined>(undefined);
  const [dataBranchGroup, setDataBranchGroup] = useState<DataBranchGroup[] | undefined>(undefined);
  const [dataBranchSub, setDataBranchSub] = useState<DataSubBranches[] | undefined>(undefined);
  const [myAccessibleBranchSubs, setMyAccessibleBranchSubs] = useState<DataSubBranches[] | undefined>(undefined);
  const [selectedBranchID, setSelectedBranchID] = useState<number>();
  const [selectedBranchGroupID, setSelectedBranchGroupID] = useState<number>();
  const [branchLoading, setBranchLoading] = useState<boolean>(false);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [loadingBranchGroups, setLoadingBranchGroups] = useState<boolean>(false);
  const [loadingSubBranches, setLoadingSubBranches] = useState<boolean>(false);
  const [loadingMyAccessibleBranches, setLoadingMyAccessibleBranches] = useState<boolean>(false);
  /**
   * Branches, optionally narrowed to one group (FA/FB/FC/FD).
   * Omit branchGroupId and it behaves exactly as before — every branch.
   */
  const fetchDataList = async (orderBy = 'name_asc', branchGroupId?: number) => {
    setLoadingBranches(true);
    // Drop the previous list before fetching. Otherwise, for the ~seconds the
    // request is in flight, the Branch dropdown keeps rendering the OLD options
    // — so right after picking group FA it still offers FB, FC and FD. Clearing
    // first means the control shows its "Loading branches..." state instead of
    // options that are about to be wrong.
    setDataBranch(undefined);
    try {
      const result = await graphqlFetch(GET_BRANCH_QUERY, {
        orderBy,
        branch_group_id: branchGroupId ?? null,
      });
      // Guarded deliberately. An unguarded `result.data.getBranch` is exactly
      // how the 2026-08-25 outage stayed invisible for a day: when the backend
      // rejects the whole operation (e.g. a backend predating branch_group),
      // there is no `data` key, this threw an unhandled promise rejection, and
      // every Branch dropdown just sat empty with nothing in the UI saying why.
      if (result.data?.getBranch) {
        setDataBranch(result.data.getBranch);
        setSelectedBranchGroupID(branchGroupId);
      } else {
        console.error('GraphQL errors fetching branches:', result.errors);
        toast.error(`Could not load branches: ${result.errors?.[0]?.message ?? 'unknown error'}`);
      }
    } finally {
      setLoadingBranches(false);
    }
  };

  // The four groups (FA/FB/FC/FD). Static data — fetch once per screen.
  const fetchBranchGroupList = async () => {
    setLoadingBranchGroups(true);
    try {
      const result = await graphqlFetch(GET_BRANCH_GROUPS_QUERY);
      if (result.data?.getBranchGroups) {
        setDataBranchGroup(result.data.getBranchGroups);
      } else {
        console.error('GraphQL errors fetching branch groups:', result.errors);
        toast.error(`Could not load groups: ${result.errors?.[0]?.message ?? 'unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching branch groups:', error);
    } finally {
      setLoadingBranchGroups(false);
    }
  };

  const fetchSubDataList = async (orderBy = 'name_asc', branch_id: number) => {
    setLoadingSubBranches(true);
    try {
      const result = await graphqlFetch(GET_SUB_BRANCH_QUERY, { orderBy, branch_id });
      // Same guard as fetchDataList — see the note there.
      if (result.data?.getBranchSub) {
        setDataBranchSub(result.data.getBranchSub);
        setSelectedBranchID(branch_id);
      } else {
        console.error('GraphQL errors fetching sub-branches:', result.errors);
        toast.error(`Could not load sub-branches: ${result.errors?.[0]?.message ?? 'unknown error'}`);
      }
    } finally {
      setLoadingSubBranches(false);
    }
  };

  // Fetch the authenticated user's accessible branch subs
  const fetchMyAccessibleBranchSubs = async () => {
    setLoadingMyAccessibleBranches(true);
    try {
      const result = await graphqlFetch(GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY);

      if (result.data?.getMyAccessibleBranchSubs) {
        setMyAccessibleBranchSubs(result.data.getMyAccessibleBranchSubs);
      } else if (result.errors) {
        console.error('GraphQL errors fetching accessible branches:', result.errors);
      }
    } catch (error) {
      console.error('Error fetching accessible branches:', error);
    } finally {
      setLoadingMyAccessibleBranches(false);
    }
  };

  const onSubmitBranch: SubmitHandler<DataFormBranch> = async (data) => {
    setBranchLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          name: data.name,
          // Blank means "not chosen"; send null rather than 0 so the column
          // stays NULL instead of pointing at a group id that does not exist.
          branch_group_id: data.branch_group_id ? Number(data.branch_group_id) : null,
        },
      };

      if (data.id) {
        mutation = UPDATE_BRANCH_MUTATION;
        variables.input.id = data.id;
        // Deliberately NOT sending user_id on update. branches.user_id is the
        // legacy branch-manager grant — BranchAccessService hands whoever is
        // named there every sub-branch under the branch — so the backend now
        // rejects it from anyone but the Owner. Renaming a branch must not
        // quietly reassign who manages it to whoever opened the form.
      } else {
        mutation = SAVE_BRANCH_MUTATION;
        variables.input.user_id = userData?.user?.id;
      }

      const result = await graphqlFetch(mutation, variables);

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.createBranch || result.data?.updateBranch) {
        const responseData = result.data.createBranch || result.data.updateBranch;
        await fetchDataList();
        toast.success("Branch saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Branch saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBranchLoading(false);
    }
  };

  const submitDeleteBranch = useDeleteWithApproval<{ id: number }>({
    mutation: DELETE_BRANCH_MUTATION,
    responseKey: 'deleteBranch',
    promptTitle: 'Delete this branch?',
    promptText: 'Branches are system-level. Only admins or owners can approve a deletion request.',
    buildVariables: (args, reason) => ({ id: args.id, reason }),
    errorLabel: 'Failed to delete branch',
  });

  const handleDeleteBranch = async (
    id: number,
    onAfterRequest?: () => Promise<void> | void,
  ) => {
    await submitDeleteBranch(
      { id },
      { onAfterRequest, onImmediateSuccess: fetchDataList }
    );
  };

  const submitDeleteSubBranch = useDeleteWithApproval<{ id: number }>({
    mutation: DELETE_SUB_BRANCH_MUTATION,
    responseKey: 'deleteSubBranch',
    promptTitle: 'Delete this sub-branch?',
    promptText: 'A branch admin can approve sub-branch deletion within their branch. Admins and owners can delete immediately.',
    buildVariables: (args, reason) => ({ id: args.id, reason }),
    errorLabel: 'Failed to delete sub-branch',
  });

  const handleDeleteSubBranch = async (
    id: number,
    onAfterRequest?: () => Promise<void> | void,
  ) => {
    await submitDeleteSubBranch(
      { id },
      { onAfterRequest, onImmediateSuccess: fetchDataList }
    );
  };
  
  const onSubmitSubBranch: SubmitHandler<DataFormSubBranches> = async (data) => {
    setBranchLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          code: data.code,
          name: data.name,
          address: data.address,
          branch_id: Number(data.branch_id),
          contact_no: data.contact_no,
          head_contact: data.head_contact,
          head_email: data.head_email,
          head_name: data.head_name,
          ref_ctr_year: Number(data.ref_ctr_year),
          ref_current_value: Number(data.ref_current_value),
          ref_no_length: Number(data.ref_no_length),
          user_id: userData?.user?.id
        },
      };

      if (data.id) {
        mutation = UPDATE_SUB_BRANCH_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_SUB_BRANCH_MUTATION;
      }
      
      const result = await graphqlFetch(mutation, variables);

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.createBranchSub || result.data?.updateBranchSub) {
        const responseData = result.data.createBranchSub || result.data.updateBranchSub;
        toast.success("Sub-branch saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Sub-branch saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBranchLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataList()
  }, []);

  return {
    dataBranch,
    dataBranchGroup,
    dataBranchSub,
    myAccessibleBranchSubs,
    onSubmitBranch,
    fetchDataList,
    fetchBranchGroupList,
    fetchSubDataList,
    fetchMyAccessibleBranchSubs,
    selectedBranchID,
    selectedBranchGroupID,
    onSubmitSubBranch,
    handleDeleteBranch,
    handleDeleteSubBranch,
    branchLoading,
    loadingBranches,
    loadingBranchGroups,
    loadingSubBranches,
    loadingMyAccessibleBranches
  };
};

export default useBranches;