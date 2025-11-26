"use client"

import { useState } from 'react';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import ChiefQueryMutations from '@/graphql/ChiefQueryMutations';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';
import BorrowerCompaniesQueryMutations from '@/graphql/BorrowerCompaniesQueryMutations';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { BorrowerInfo, DataChief, DataArea, DataSubArea, DataBorrCompanies } from '@/utils/DataTypes';
import { toast } from "react-toastify";

const useBorrowerDetail = () => {
  const { SAVE_BORROWER_MUTATION, CHECK_BORROWER_DUPLICATE, GET_SINGLE_BORROWER_QUERY } = BorrowerQueryMutations;
  const { GET_CHIEF_QUERY } = ChiefQueryMutations;
  const { GET_AREA_QUERY, GET_SINGLE_SUB_AREA_QUERY } = AreaSubAreaQueryMutations;
  const { GET_BORROWER_COMPANIES } = BorrowerCompaniesQueryMutations;

  const [borrowerLoading, setBorrowerLoading] = useState<boolean>(false);
  const [dataChief, setDataChief] = useState<DataChief[] | undefined>(undefined);
  const [dataArea, setDataArea] = useState<DataArea[] | undefined>(undefined);
  const [dataSubArea, setDataSubArea] = useState<DataSubArea[] | undefined>(undefined);
  const [dataBorrCompany, setDataBorrCompany] = useState<DataBorrCompanies[] | undefined>(undefined);

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

  const checkForDuplicates = async (data: BorrowerInfo): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CHECK_BORROWER_DUPLICATE,
          variables: {
            firstname: data.firstname,
            middlename: data.middlename,
            lastname: data.lastname,
            dob: data.dob,
            email: data.email || null,
            contact_no: data.contact_no || null,
            excludeId: data.id || null,
          },
        }),
      });

      const result = await response.json();

      if (result.data?.checkBorrowerDuplicate?.isDuplicate) {
        const duplicate = result.data.checkBorrowerDuplicate;
        const borrower = duplicate.duplicateBorrower;

        // Build middlename display (include space if it exists)
        const middlename = borrower.middlename ? ` ${borrower.middlename}` : '';

        // Parse duplicate types (can be comma-separated: "contact_number,full_name")
        const duplicateTypes = duplicate.duplicateType?.split(',') || [];

        // Build dynamic duplicate message with bold formatting
        let duplicateMessage = 'A borrower with the same ';

        if (duplicateTypes.length === 2) {
          // Both contact number and full name are duplicates
          duplicateMessage += '<strong>contact number</strong> and <strong>full name</strong>';
        } else if (duplicateTypes.includes('contact_number')) {
          duplicateMessage += '<strong>contact number</strong>';
        } else if (duplicateTypes.includes('full_name')) {
          duplicateMessage += '<strong>full name</strong>';
        }

        duplicateMessage += ' already exists in the system:';

        await showConfirmationModal(
          'Duplicate Borrower Found',
          `<p>${duplicateMessage}</p>` +
          `<br/>` +
          `<p><strong>Full Name:</strong> ${borrower.firstname}${middlename} ${borrower.lastname}</p>` +
          `<p><strong>Contact Number:</strong> ${borrower.borrower_details?.contact_no || 'N/A'}</p>` +
          `<br/>` +
          `<p>Please verify if this is the same person. The borrower was not created to prevent duplicates.</p>`,
          'Close',
          false, // Hide cancel button - only show Close
          true   // Use HTML formatting
        );

        // Always return false - do not allow duplicate creation
        return false;
      }

      return true; // No duplicates, proceed
    } catch (error) {
      console.error('Duplicate check error:', error);
      // On error, allow to proceed (don't block user)
      return true;
    }
  };

  const onSubmitBorrower = async (data: BorrowerInfo, refreshCallback?: () => void): Promise<{ success: boolean; error?: string; data?: any }> => {
    setBorrowerLoading(true);

    try {
      // Check for duplicates only for new borrowers
      if (!data.id) {
        const canProceed = await checkForDuplicates(data);
        if (!canProceed) {
          setBorrowerLoading(false);
          return { success: false, error: 'Cancelled by user due to duplicate' };
        }
      }

      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      const variables = createBorrVariables(data, Number(userData?.user?.id));

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
        toast.success(result.data.saveBorrower.message);
        if (refreshCallback) {
          refreshCallback();
        }
        return { success: true, data: result.data.saveBorrower };
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

  const fetchSingleBorrower = async (borrowerId: number) => {
    setBorrowerLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_SINGLE_BORROWER_QUERY,
          variables: {
            id: borrowerId.toString()
          }
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to fetch borrower');
      }

      const borrower = result.data?.getBorrower;

      if (!borrower) {
        throw new Error('Borrower not found');
      }

      setBorrowerLoading(false);
      return borrower;
    } catch (error) {
      console.error('Error fetching single borrower:', error);
      toast.error('Failed to load borrower details');
      setBorrowerLoading(false);
      throw error;
    }
  };

  return {
    dataChief,
    dataArea,
    dataSubArea,
    fetchDataSubArea,
    dataBorrCompany,
    onSubmitBorrower,
    borrowerLoading,
    fetchDataChief,
    fetchDataArea,
    fetchDataBorrCompany,
    fetchSingleBorrower,
  };
};

export default useBorrowerDetail;
