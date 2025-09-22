"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import ChiefQueryMutations from '@/graphql/ChiefQueryMutations';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';
import BorrowerCompaniesQueryMutations from '@/graphql/BorrowerCompaniesQueryMutations';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { useAuthStore } from "@/store";
import { usePagination } from './usePagination';

import { BorrowerInfo, DataChief, DataArea, DataSubArea, DataBorrCompanies, BorrowerRowInfo } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBorrower = () => {

  const { SAVE_BORROWER_MUTATION, GET_BORROWER_QUERY, DELETE_BORROWER_QUERY } = BorrowerQueryMutations;
  const { GET_CHIEF_QUERY } = ChiefQueryMutations;
  const { GET_AREA_QUERY, GET_SINGLE_SUB_AREA_QUERY } = AreaSubAreaQueryMutations;
  const { GET_BORROWER_COMPANIES } = BorrowerCompaniesQueryMutations;

  const [borrCrudLoading, setBorrCrudLoading] = useState<boolean>(false);
  const [dataChief, setDataChief] = useState<DataChief[] | undefined>(undefined);
  const [dataArea, setDataArea] = useState<DataArea[] | undefined>(undefined);
  const [dataSubArea, setDataSubArea] = useState<DataSubArea[] | undefined>(undefined);
  const [dataBorrCompany, setDataBorrCompany] = useState<DataBorrCompanies[] | undefined>(undefined);

  // Wrapper function to adapt existing API for usePagination hook
  const fetchBorrowersForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BORROWER_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }), // Add search parameter if provided
          orderBy: [
            { column: "id", order: 'DESC' }
          ]
        },
      }),
    });

    const result = await response.json();

    // Return the expected format for usePagination
    return {
      data: result.data.getBorrowers.data,
      paginatorInfo: result.data.getBorrowers.paginatorInfo || {
        total: result.data.getBorrowers.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_BORROWER_QUERY]);

  // Use the new pagination hook
  const {
    data: dataBorrower,
    loading: borrowerLoading,
    error: borrowerError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<BorrowerRowInfo>({
    fetchFunction: fetchBorrowersForPagination,
    config: {
      initialPageSize: 20,
      defaultPageSize: 20,
    },
  });

  // Legacy fetchDataBorrower function for backward compatibility
  const fetchDataBorrower = useCallback(async (first: number, page: number) => {
    const result = await fetchBorrowersForPagination(first, page);
    // This maintains the old behavior for any existing code that still uses it
    return result;
  }, [fetchBorrowersForPagination]);


  const createBorrVariables = (data: BorrowerInfo, user_id: number) => ({
    inputBorrInfo: {
      chief_id: String(data.chief_id),
      amount_applied: String(data.amount_applied),
      purpose: data.purpose,
      firstname: data.firstname,
      middlename: data.middlename,
      lastname: data.lastname,
      terms_of_payment: data.terms_of_payment,
      residence_address: data.residence_address,
      is_rent: Number(data.is_rent),
      other_source_of_inc: data.other_source_of_inc,
      est_monthly_fam_inc: data.est_monthly_fam_inc,
      employment_position: data.employment_position,
      gender: data.gender,
      photo: data.photo,
      user_id: user_id,
      ...(data.id && { id: data.id }),
    },
    inputBorrDetail: {
      dob: data.dob,
      place_of_birth: data.place_of_birth,
      age: data.age,
      email: data.email,
      contact_no: data.contact_no,
      civil_status: data.civil_status,
    },
    inputBorrSpouseDetail: {
      work_address: data.work_address,
      occupation: data.occupation,
      fullname: data.fullname,
      company: data.company,
      dept_branch: data.dept_branch,
      length_of_service: data.length_of_service,
      salary: data.salary,
      company_contact_person: data.company_contact_person,
      contact_no: data.spouse_contact_no,
    },
    inputBorrWorkBg: {
      company_borrower_id: String(data.company_borrower_id),
      employment_number: data.employment_number,
      area_id: data.area_id,
      sub_area_id: data.sub_area_id,
      station: data.station,
      term_in_service: data.term_in_service,
      employment_status: data.employment_status,
      division: data.division,
      monthly_gross: String(data.monthly_gross),
      monthly_net: String(data.monthly_net),
      office_address: data.office_address,
    },
    inputBorrReference: {
      reference: data.reference
    },
    inputBorrCompInfo: {
      employer: data.employer,
      salary: data.company_salary,
      contract_duration: data.contract_duration,
    },
  });

  const onSubmitBorrower: SubmitHandler<BorrowerInfo> = async (data) => {
    setBorrowerLoading(true);
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    const variables = createBorrVariables(data, Number(userData?.user?.id));
    
    if (data.id) {
      mutation = SAVE_BORROWER_MUTATION;
      variables.inputBorrInfo.id = data.id;
    } else {
      mutation = SAVE_BORROWER_MUTATION;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });
    setBorrowerLoading(false);
    const result = await response.json();
    if (result) {
      toast.success(result.data.saveBorrower.message);
      refresh(); // Use pagination hook's refresh function
    }
  };

  const fetchDataChief = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_CHIEF_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    setDataChief(result.data.getChief.data);
  };

  const fetchDataArea = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_AREA_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    setDataArea(result.data.getAreas.data);
  };
  
  const fetchDataSubArea = async (area_id: any) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_SINGLE_SUB_AREA_QUERY,
        variables: { area_id: Number(area_id) },
      }),
    });

    const result = await response.json();
    setDataSubArea(result.data.getOneSubArea);
  };

  const fetchDataBorrCompany = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BORROWER_COMPANIES,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    setDataBorrCompany(result.data.getBorrCompanies.data);
  };

  const handleRmBorrower = async (data: any) => {
    let variables: { input: any } = {
      input: {
        id: data.id,
        is_deleted: 1,
      },
    };
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You are deleting this borrower',
      'Confirm',
    );
    if (isConfirmed) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DELETE_BORROWER_QUERY,
          variables
        }),
      });
      const result = await response.json();
      if (result) {
        refresh(); // Use pagination hook's refresh function
        toast.success(result.data?.deleteBorrowerData?.message);
      }
    }
    
  };

  const handleDeleteSubArea = async (data: any) => {
    let variables: { input: any } = {
      input: {
        id: data.id,
        is_deleted: 1,
      },
    };
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // query: DELETE_SUB_AREA_MUTATION,
        variables
      }),
    });
    const result = await response.json();
    toast.success("Sub Area is Deleted!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    // fetchDataChief(100, 1);
    // fetchDataArea(100, 1);
    // fetchDataBorrCompany(100, 1);
    // fetchDataBorrower(100, 1);

    // fetchDataArea(100, 1);
    // fetchDataSubArea(10, 1);
  }, []);

  return {
    // Legacy data and functions (for backward compatibility)
    dataChief,
    dataArea,
    dataSubArea,
    fetchDataSubArea,
    dataBorrCompany,
    onSubmitBorrower,
    dataBorrower,
    borrowerLoading,
    fetchDataBorrower, // Legacy function - maintained for backward compatibility
    fetchDataChief,
    fetchDataArea,
    fetchDataBorrCompany,
    handleRmBorrower,
    borrCrudLoading,

    // New pagination functionality
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
    borrowerError,

    // Server-side pagination helpers for CustomDatatable
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
    },
  };
};

export default useBorrower;