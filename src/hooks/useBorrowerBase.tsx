"use client"

import { useState } from 'react';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import ChiefQueryMutations from '@/graphql/ChiefQueryMutations';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';
import BorrowerCompaniesQueryMutations from '@/graphql/BorrowerCompaniesQueryMutations';
import { BorrowerInfo, DataChief, DataArea, DataSubArea, DataBorrCompanies } from '@/utils/DataTypes';
import { checkBorrowerDuplicates, getAuthUserData } from '@/utils/borrowerDuplicateCheck';
import { toast } from "react-toastify";

/**
 * Base hook for borrower operations - shared functionality
 * Used by useBorrower (list) and useBorrowerDetail (detail page)
 */
const useBorrowerBase = () => {
  const { SAVE_BORROWER_MUTATION } = BorrowerQueryMutations;
  const { GET_CHIEF_QUERY } = ChiefQueryMutations;
  const { GET_AREA_QUERY, GET_SINGLE_SUB_AREA_QUERY } = AreaSubAreaQueryMutations;
  const { GET_BORROWER_COMPANIES } = BorrowerCompaniesQueryMutations;

  const [borrowerLoading, setBorrowerLoading] = useState<boolean>(false);
  const [dataChief, setDataChief] = useState<DataChief[] | undefined>(undefined);
  const [dataArea, setDataArea] = useState<DataArea[] | undefined>(undefined);
  const [dataSubArea, setDataSubArea] = useState<DataSubArea[] | undefined>(undefined);
  const [dataBorrCompany, setDataBorrCompany] = useState<DataBorrCompanies[] | undefined>(undefined);

  /**
   * Create GraphQL variables for borrower mutation
   */
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
      sub_area_id: data.sub_area_id || null,
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

  /**
   * Submit borrower (create or update)
   * @param data - Borrower form data
   * @param onSuccess - Optional callback on success
   */
  const submitBorrower = async (
    data: BorrowerInfo,
    onSuccess?: () => void
  ): Promise<{ success: boolean; error?: string; data?: any }> => {
    setBorrowerLoading(true);

    try {
      // Check for duplicates only for new borrowers
      if (!data.id) {
        const canProceed = await checkBorrowerDuplicates(data);
        if (!canProceed) {
          setBorrowerLoading(false);
          return { success: false, error: 'Cancelled by user due to duplicate' };
        }
      }

      const authData = getAuthUserData();
      const variables = createBorrVariables(data, Number(authData.user?.id));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SAVE_BORROWER_MUTATION,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful borrower creation/update
      if (result.data?.saveBorrower) {
        if (result.data.saveBorrower.success) {
          toast.success(result.data.saveBorrower.message);
          onSuccess?.();
          return { success: true, data: result.data.saveBorrower };
        } else {
          toast.error(result.data.saveBorrower.message || 'Failed to save borrower');
          return { success: false, error: result.data.saveBorrower.message };
        }
      }

      return { success: false, error: "Unknown error occurred" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBorrowerLoading(false);
    }
  };

  /**
   * Fetch chiefs data
   */
  const fetchDataChief = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_CHIEF_QUERY,
        variables: { first, page, orderBy: [{ column: "id", order: 'DESC' }] },
      }),
    });
    const result = await response.json();
    setDataChief(result.data.getChief.data);
  };

  /**
   * Fetch areas data
   */
  const fetchDataArea = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_AREA_QUERY,
        variables: { first, page, orderBy: [{ column: "id", order: 'DESC' }] },
      }),
    });
    const result = await response.json();
    setDataArea(result.data.getAreas.data);
  };

  /**
   * Fetch sub-areas for a specific area
   */
  const fetchDataSubArea = async (area_id: any) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_SINGLE_SUB_AREA_QUERY,
        variables: { area_id: Number(area_id) },
      }),
    });
    const result = await response.json();
    setDataSubArea(result.data.getOneSubArea);
  };

  /**
   * Fetch borrower companies data
   */
  const fetchDataBorrCompany = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_BORROWER_COMPANIES,
        variables: { first, page, orderBy: [{ column: "id", order: 'DESC' }] },
      }),
    });
    const result = await response.json();
    setDataBorrCompany(result.data.getBorrCompanies.data);
  };

  return {
    // State
    borrowerLoading,
    setBorrowerLoading,
    dataChief,
    dataArea,
    dataSubArea,
    dataBorrCompany,

    // Actions
    submitBorrower,
    fetchDataChief,
    fetchDataArea,
    fetchDataSubArea,
    fetchDataBorrCompany,
    createBorrVariables,
  };
};

export default useBorrowerBase;
