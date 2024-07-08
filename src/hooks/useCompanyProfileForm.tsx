"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataCompanyFormValues } from '@/utils/DataTypes';
import SAVE_COMPANY_PROFILE_MUTATION from '@/graphql/SaveCompanyProfileMutation';
import GET_COMPANY_PROFILE_QUERY from '@/graphql/GetCompanyProfileQuery';
import { toast } from "react-toastify";

const useCompanyProfileForm = (initialValues?: DataCompanyFormValues) => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DataCompanyFormValues>({
    defaultValues: initialValues,
  });

  // Watch for changes in company_logo
  const [companyLogo, setCompanyLogo] = useState<string | null>(null); // State for image preview

  // Function to fetch data based on ID
  const fetchData = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_COMPANY_PROFILE_QUERY,
        variables: {},
      }),
    });

    const result = await response.json();

    if (result.data.getCompanyProfile) {
      // Set form values after fetching data
      setValue('id', result.data.getCompanyProfile.id);
      setValue('company_name', result.data.getCompanyProfile.company_name);
      setValue('address', result.data.getCompanyProfile.address);
      setValue('tin', result.data.getCompanyProfile.tin);
      setValue('company_email', result.data.getCompanyProfile.company_email);
      setValue('company_website', result.data.getCompanyProfile.company_website);
      setValue('phone_no', result.data.getCompanyProfile.phone_no);
      setValue('mobile_no', result.data.getCompanyProfile.mobile_no);
      setValue('contact_person', result.data.getCompanyProfile.contact_person);
      setValue('contact_person_no', result.data.getCompanyProfile.contact_person_no);
      setValue('contact_email', result.data.getCompanyProfile.contact_email);
      setCompanyLogo(`${process.env.NEXT_PUBLIC_BASE_URL}/storage/` + result.data.getCompanyProfile.company_logo);
      // Assuming company_logo is a string URL
      // setValue('company_logo', result.data.saveCompanyProfile.company_logo);
    }

  };

  const onSubmit: SubmitHandler<DataCompanyFormValues> = async (data) => {

    const formData = new FormData();
    formData.append('operations', JSON.stringify({
      query: SAVE_COMPANY_PROFILE_MUTATION,
      variables: {
        input: {
          id: data.id,
          company_name: data.company_name,
          address: data.address,
          tin: data.tin,
          company_email: data.company_email,
          company_website: data.company_website,
          phone_no: data.phone_no,
          mobile_no: data.mobile_no,
          contact_person: data.contact_person,
          contact_person_no: data.contact_person_no,
          contact_email: data.contact_email,
        },
        file: null,
      },
    }));
    formData.append('map', JSON.stringify({ 'file': ['variables.file'] }));
    formData.append('file', data.company_logo[0]);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    toast.success("Company is Updated!");
    fetchData();
    console.log(result);
  };

  // Fetch data on component mount if id exists
  useEffect(() => {
    fetchData();
  }, [setValue]);

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    companyLogo
  };
};

export default useCompanyProfileForm;