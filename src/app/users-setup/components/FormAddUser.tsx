"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { DataBranches, DataFormUser, User } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchUsers: (first: number, page: number) => void;
  actionLbl: string;
  singleUserData: DataFormUser | undefined;
}
interface OptionBranch {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}
const FormAddUser: React.FC<ParentFormBr> = ({ setShowForm, actionLbl, fetchUsers, singleUserData }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<DataFormUser>();
  const { onSubmitUser, dataSubBranch } = useUsers();
  const [options, setOptions] = useState<OptionBranch[]>([
    { value: '', label: 'Select a branch', hidden: true },
  ]);

   // Watch the password field
   const password = watch('password', '');

  const onSubmit: SubmitHandler<DataFormUser> = data => {
    onSubmitUser(data);
    setShowForm(false);
    fetchUsers(10, 1);
  };

  useEffect(() => {
    if (dataSubBranch && Array.isArray(dataSubBranch)) {
      const dynamicOptions: OptionBranch[] = dataSubBranch?.map(subBranch => ({
        value: subBranch.id,
        label: subBranch.name, // assuming `name` is the key you want to use as label
      }));
      setOptions([
        { value: '', label: 'Select a branch', hidden: true }, // retain the default "Select a branch" option
        ...dynamicOptions,
      ]);
    }
    if (actionLbl === 'Create User') {
      reset({
        id: '',
        name: '',
        email: '',
        branch_sub_id: 0,
      });
    } else {
      if (singleUserData) {
        setValue('id', singleUserData.id);
        setValue('name', singleUserData.name);
        setValue('email', singleUserData.email);
        setValue('branch_sub_id', singleUserData.branch_sub_id);
      }
    }
  }, [dataSubBranch, singleUserData, actionLbl])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {(actionLbl === 'Create User' || actionLbl === 'Update User') && (
        <>
          <FormInput
            label="Branch"
            id="branch_id"
            type="select"
            icon={ChevronDown}
            register={register('branch_sub_id', { required: 'Branch is required' })}
            error={errors.branch_sub_id?.message}
            options={options}
          />

          <FormInput
            label="Email"
            id="name"
            type="text"
            icon={Home}
            register={register('email', { required: true })}
            error={errors.email && "This field is required"}
          />

          <FormInput
            label="Name"
            id="name"
            type="text"
            icon={Home}
            register={register('name', { required: true })}
            error={errors.name && "This field is required"}
          />
        </>
      )}

      {(actionLbl === 'Create User' || actionLbl === 'Update Password') && (
        <>
          <FormInput
            label="Password"
            id="name"
            type="password"
            icon={Home}
            register={register('password', { required: true })}
            error={errors.password && "This field is required"}
          />
          <FormInput
            label="Confirm Password"
            id="name"
            type="password"
            icon={Home}
            register={register('confirm_password', { 
              required: 'This field is required',
              validate: value => value === password || 'Passwords do not match'
            })}
            error={errors.confirm_password?.message}
          />
        </>
      )}
      
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

export default FormAddUser;