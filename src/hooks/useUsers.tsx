"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import UserQueryMutations from '@/graphql/UserQueryMutation';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import { User, UserPaginator, DataFormUser, DataSubBranches, DataRoles } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";

const useUsers = () => {
  const { GET_USER_QUERY, 
          CREATE_USER_MUTATION, 
          GET_SINGLE_USER_QUERY, 
          UPDATE_USER_MUTATION, 
          GET_ROLE_QUERY } = UserQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutations;

  // const [dataUser, setDataUser] = useState<User[] | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [data, setData] = useState<User[]>([]);
  const [dataSubBranch, setDataSubBranch] = useState<DataSubBranches[]>([]);
  const [dataRole, setDataRole] = useState<DataRoles[]>([]);
  const [singleUserData, setSingleUserData] = useState<DataFormUser | undefined>(undefined);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [subBranchLoading, setSubBranchLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const rowsPerPage = 10;
  // Function to fetchdata
  const fetchUsers = async (first: number, page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_USER_QUERY,
          variables: { first, page, orderBy: [
              { column: "id", order: 'DESC' }
            ] 
          },
        }),
      });

      const result = await response.json();
      const usersData: UserPaginator = result.data.users;
      setData(usersData.data);
      setTotalRows(usersData.paginatorInfo.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
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
    console.log('🔄 Starting fetchSubBranch, setting subBranchLoading to true');
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
      console.log('✅ fetchSubBranch completed, data:', result.data.getAllBranch?.length || 0, 'items');
      setDataSubBranch(result.data.getAllBranch);
    } catch (error) {
      console.error('Error fetching sub branches:', error);
    } finally {
      console.log('🔄 Setting subBranchLoading to false');
      setSubBranchLoading(false);
    }
  };

  const fetchSingleUser = async (data: User) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_SINGLE_USER_QUERY,
          variables: { id: data.id },
        }),
      });

      const result = await response.json();
      setSingleUserData(result.data.user);
    } catch (error) {
      console.error('Error fetching single user:', error);
    }
  }

  const onSubmitUser = async (data: DataFormUser) => {
    setUserLoading(true);
    try {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      console.log(data, ' data');

      let mutation;
      let variables: { input: any } = {
        input: {
          name: data.name,
          email: data.email,
          branch_sub_id: Number(data.branch_sub_id),
          role_id: Number(data.role_id)
        },
      };
      
      if (data.id) {
        if(data.password){
          mutation = UPDATE_USER_MUTATION;
          variables.input.password = data.password;
          variables.input.id = data.id;
        } else {
          mutation = UPDATE_USER_MUTATION;
          variables.input.id = Number(data.id);
        }
      } else {
        mutation = CREATE_USER_MUTATION;
        variables.input.password = data.password;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });
      
      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.createUser || result.data?.updateUser) {
        const responseData = result.data.createUser || result.data.updateUser;
        toast.success(responseData.message || "User saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("User saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUserLoading(false);
    }
  };


   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchUsers(rowsPerPage, currentPage);
    fetchSubBranch("id_desc");
    fetchRoles();
  }, [currentPage]);

  return {
    data,
    totalRows,
    setCurrentPage,
    loading,
    onSubmitUser,
    userLoading,
    dataSubBranch,
    fetchUsers,
    fetchSingleUser,
    singleUserData,
    dataRole,
    rolesLoading,
    subBranchLoading
  };
};

export default useUsers;