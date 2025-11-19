"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import VendorQueryMutations from '@/graphql/VendorQueryMutations';
import { RowVendorTypeData, RowVendorsData, RowSupCatData, RowCustCatData, RowDepartmentsData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';

const useVendor = () => {

  const { 
    GET_VENDOR_TYPE_QUERY, 
    GET_VENDOR_LIST_QUERY, 
    GET_SUPPLIER_CAT_QUERY,
    GET_CUSTOMER_CAT_QUERY, 
    GET_DEPARTMENT_QUERY,
    CREATE_VENDOR_QUERY } = VendorQueryMutations;
  
  const [dataVendorType, setDataVendorType] = useState<RowVendorTypeData>();
  const [dataVendors, setDataVendors] = useState<RowVendorsData[]>();
  const [dataSupplierCat, setDataSupplierCat] = useState<RowSupCatData[]>();
  const [dataCustCat, setDataCustCat] = useState<RowCustCatData[]>();
  const [dataDepartments, setDataDepartments] = useState<RowDepartmentsData[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [vendorLoading, setVendorLoading] = useState<boolean>(false);
  // Function to fetchdata

  const fetchVendorType = async () => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        code: ""
      },
    };

    mutation = GET_VENDOR_TYPE_QUERY;
    setLoading(true);

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
    const result = await response.json();
    setDataVendorType(result?.data.getVendorType);
    setLoading(false);
  };

  const fetchSupplierCategory = async () => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        code: ""
      },
    };

    mutation = GET_SUPPLIER_CAT_QUERY;
    setLoading(true);

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
    const result = await response.json();
    setDataSupplierCat(result?.data.getSupplierCategory);
    setLoading(false);
  };

  const fetchCustomerCategory = async () => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        code: ""
      },
    };

    mutation = GET_CUSTOMER_CAT_QUERY;
    setLoading(true);

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
    const result = await response.json();
    setDataCustCat(result?.data.getCustomerCategory);
    setLoading(false);
  };

  const fetchDepartments = async () => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        code: ""
      },
    };

    mutation = GET_DEPARTMENT_QUERY;
    setLoading(true);

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
    const result = await response.json();
    setDataDepartments(result?.data.getDepartment);
    setLoading(false);
  };

  const fetchVendors = async (vendor_type_id: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        vendor_type_id
      },
    };

    mutation = GET_VENDOR_LIST_QUERY;
    setLoading(true);

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
    const result = await response.json();
    setDataVendors(result?.data.getVendors);
    setLoading(false);
  };

  const createVendor = async (row: RowVendorsData) => {
    setVendorLoading(true);
    try {
      let mutation;
      let variables: { input: any } = {
        input: {
          id: row?.id,
          vendor_type_id: row?.vendor_type_id,
          customer_category_id: row?.customer_category_id,
          supplier_category_id: row?.supplier_category_id,
          department_id: row?.department_id,
          name: row?.name,
          employee_no: row?.employee_no,
          contact_no: row?.contact_no,
          employee_position: row?.employee_position,
          tin: row?.tin,
          address: row?.address,
          tax_excempty_date: row?.tax_excempty_date,
          remarks: row?.remarks,
          bill_address: row?.bill_address,
          office_no: row?.office_no,
          credit_limit: row?.credit_limit,
          is_allow_excess_limit: row?.is_allow_excess_limit
        },
      };

      mutation = CREATE_VENDOR_QUERY;

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

      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for response data
      const responseData = result.data?.createVendors;
      if (responseData) {
        // Check status field explicitly (handles both boolean and string "true"/"false")
        const status = responseData.status === true || responseData.status === 'true';

        if (status) {
          toast.success(responseData.message || "Vendor created successfully!");
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
      setVendorLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchVendorType();
    fetchSupplierCategory();
    fetchCustomerCategory();
    fetchDepartments();
  }, []);

  return {
    fetchVendors,
    createVendor,
    dataVendorType,
    dataSupplierCat,
    dataCustCat,
    dataVendors,
    dataDepartments,
    loading,
    vendorLoading
  };
};

export default useVendor;