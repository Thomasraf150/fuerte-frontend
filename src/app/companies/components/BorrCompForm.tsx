"use client"
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User } from 'react-feather';
import FormInput from '@/components/FormInput';
import useBorrCompanies from '@/hooks/useBorrCompanies';
import { DataBranches, DataBorrCompanies, } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchDataBorrComp: (f: number, p: number) => void;
  initialData?: DataBorrCompanies | null;
  actionLbl: string;
}

const BorrCompForm: React.FC<ParentFormBr> = ({ setShowForm, fetchDataBorrComp, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataBorrCompanies>();
  const { onSubmitBorrComp } = useBorrCompanies();

  useEffect(()=>{
    if (initialData) {
      if (actionLbl === 'Update Borrower Companies') {
        setValue('id', initialData.id ?? '')
        setValue('name', initialData.name)
        setValue('address', initialData.address)
        setValue('contact_person', initialData.contact_person)
        setValue('contact_no', initialData.contact_no)
        setValue('contact_email', initialData.contact_email)
      } else {
        reset({
          id: '',
          name: '',
          address: '',
          contact_person: '',
          contact_no: '',
          contact_email: ''
        });
      }
    }
  }, [initialData, setValue, actionLbl])

  const onSubmit: SubmitHandler<DataBorrCompanies> = data => {
    onSubmitBorrComp(data);
    fetchDataBorrComp(10, 1)
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Name"
        id="name"
        type="text"
        icon={Home}
        register={register('name', { required: true })}
        error={errors.name && "This field is required"}
      />
      <FormInput
        label="Address"
        id="address"
        type="text"
        icon={Home}
        register={register('address', { required: true })}
        error={errors.address && "This field is required"}
      />
      <FormInput
        label="Contact Person"
        id="contact_person"
        type="text"
        icon={Home}
        register={register('contact_person', { required: true })}
        error={errors.contact_person && "This field is required"}
      />
      <FormInput
        label="Contact No."
        id="contact_no"
        type="text"
        icon={Home}
        register={register('contact_no', { required: true })}
        error={errors.contact_no && "This field is required"}
      />
      <FormInput
        label="Contact Email."
        id="contact_email"
        type="text"
        icon={Home}
        register={register('contact_email', { required: true })}
        error={errors.contact_email && "This field is required"}
      />

      <div className="flex justify-end gap-4.5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
        >
          Cancel
        </button>
        <button
          className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
          type="submit"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default BorrCompForm;