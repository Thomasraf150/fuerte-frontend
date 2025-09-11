"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import ChiefQueryMutations from '@/graphql/ChiefQueryMutations';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';
import BorrowerCompaniesQueryMutations from '@/graphql/BorrowerCompaniesQueryMutations';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { useAuthStore } from "@/store";
import { useSmartPagination } from './useSmartPagination';

import { BorrowerInfo, DataChief, DataArea, DataSubArea, DataBorrCompanies, BorrowerRowInfo } from '@/utils/DataTypes';
import { toast } from "react-toastify";

interface BatchData<T> {
  data: T[];
  pagination: {
    currentBatch: number;
    totalBatches: number;
    batchStartPage: number;
    batchEndPage: number;
    totalRecords: number;
    hasNextBatch: boolean;
  };
  loadedAt?: number;
}

const useBorrower = () => {

  const { SAVE_BORROWER_MUTATION, GET_BORROWER_QUERY, DELETE_BORROWER_QUERY, GET_BORROWERS_BATCH_QUERY } = BorrowerQueryMutations;
  const { GET_CHIEF_QUERY } = ChiefQueryMutations;
  const { GET_AREA_QUERY, GET_SINGLE_SUB_AREA_QUERY } = AreaSubAreaQueryMutations;
  const { GET_BORROWER_COMPANIES } = BorrowerCompaniesQueryMutations;
  
  const [borrowerLoading, setBorrowerLoading] = useState<boolean>(false);
  const [borrCrudLoading, setBorrCrudLoading] = useState<boolean>(false);
  const [dataChief, setDataChief] = useState<DataChief[] | undefined>(undefined);
  const [dataArea, setDataArea] = useState<DataArea[] | undefined>(undefined);
  const [dataSubArea, setDataSubArea] = useState<DataSubArea[] | undefined>(undefined);
  const [dataBorrCompany, setDataBorrCompany] = useState<DataBorrCompanies[] | undefined>(undefined);
  
  // Smart pagination fetch function for borrowers with proper error handling
  const fetchBorrowersBatch = async (page: number, perPage: number, pagesPerBatch: number): Promise<BatchData<BorrowerRowInfo>> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_BORROWERS_BATCH_QUERY,
          variables: { 
            page,
            perPage,
            pagesPerBatch,
            orderBy: [{ column: "id", order: 'DESC' }]
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      if (!result.data?.getBorrowersBatch) {
        throw new Error('Invalid response structure from server');
      }

      return result.data.getBorrowersBatch;
    } catch (error) {
      console.error('Error fetching borrowers batch:', error);
      throw error;
    }
  };

  // Use smart pagination for borrowers
  const borrowersPagination = useSmartPagination(fetchBorrowersBatch, {
    perPage: 20,
    pagesPerBatch: 1,
    maxCachedBatches: 3
  });


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
      borrowersPagination.refresh(); // Use smart pagination refresh instead
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
  
  const fetchDataBorrower = async (first: number, page: number) => {
    setBorrowerLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BORROWER_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    setBorrowerLoading(false);
    // Note: With smart pagination, data is managed by borrowersPagination.data
    // This legacy function is kept for backwards compatibility but doesn't update state
    return result.data.getBorrowers.data;
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
        borrowersPagination.refresh(); // Use smart pagination refresh instead
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
    dataBorrower: borrowersPagination.data,
    allBorrowerData: borrowersPagination.allLoadedData,
    currentPage: borrowersPagination.currentPage,
    totalPages: borrowersPagination.totalPages,
    totalRecords: borrowersPagination.totalRecords,
    hasNextPage: borrowersPagination.hasNextPage,
    borrowerLoading: borrowersPagination.loading || borrowerLoading,
    prefetching: borrowersPagination.prefetching,
    navigateToPage: borrowersPagination.navigateToPage,
    refreshBorrowers: borrowersPagination.refresh,
    dataChief,
    dataArea,
    dataSubArea,
    fetchDataSubArea,
    dataBorrCompany,
    onSubmitBorrower,
    fetchDataBorrower, // Legacy function for backward compatibility
    fetchDataChief,
    fetchDataArea,
    fetchDataBorrCompany,
    handleRmBorrower,
    borrCrudLoading
  };
};

export default useBorrower;