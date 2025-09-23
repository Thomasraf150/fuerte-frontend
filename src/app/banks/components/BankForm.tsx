"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useBank from '@/hooks/useBank';
import { DataBank, DataSubBranches } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchDataBank: (f: number, p: number) => void;
  initialData?: DataBank | null;
  actionLbl: string;
}

interface OptionSubBranch {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const BankForm: React.FC<ParentFormBr> = ({ setShowForm, fetchDataBank, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataBank>();
  const { onSubmitBank, branchSubData } = useBank();

  const [optionsSubBranch, setOptionsSubBranch] = useState<OptionSubBranch[]>([]);

  useEffect(()=>{
    if (branchSubData && Array.isArray(branchSubData)) {
      const dynaOpt: OptionSubBranch[] = branchSubData?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubBranch([
        { value: '', label: 'Select a Sub Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }

    if (initialData) {
      if (actionLbl === 'Update Bank') {
        setValue('id', initialData.id ?? '')
        setValue('branch_sub_id', initialData.branch_sub_id)
        setValue('name', initialData.name)
        setValue('address', initialData.address)
        setValue('phone', initialData.phone)
        setValue('contact_person', initialData.contact_person)
        setValue('mobile', initialData.mobile)
        setValue('email', initialData.email)
      } else {
        reset({
          id: '',
          branch_sub_id: '',
          name: '',
          address: '',
          phone: '',
          contact_person: '',
          mobile: '',
          email: ''
        });
      }
    }

    console.log(initialData, ' initialData');
  }, [initialData, setValue, actionLbl, branchSubData])

  const onSubmit: SubmitHandler<DataBank> = data => {
    onSubmitBank(data);
    fetchDataBank(10, 1)
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Branch Sub"
        id="branch_sub_id"
        type="select"
        icon={ChevronDown}
        register={register('branch_sub_id', { required: 'Branch Sub is required' })}
        error={errors.branch_sub_id?.message}
        options={optionsSubBranch}
      />

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
        label="Phone"
        id="phone"
        type="text"
        formatType="contact"
        icon={Home}
        register={register('phone', { required: true })}
        error={errors.address && "This field is required"}
      />
      <FormInput
        label="Contact Person"
        id="contact_person"
        type="text"
        icon={Home}
        register={register('contact_person', { required: true })}
        error={errors.address && "This field is required"}
      />
      <FormInput
        label="Mobile"
        id="mobile"
        type="text"
        formatType="contact"
        icon={Home}
        register={register('mobile', { required: true })}
        error={errors.address && "This field is required"}
      />
      <FormInput
        label="Email"
        id="email"
        type="text"
        icon={Home}
        register={register('email', { required: true })}
        error={errors.address && "This field is required"}
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

export default BankForm;