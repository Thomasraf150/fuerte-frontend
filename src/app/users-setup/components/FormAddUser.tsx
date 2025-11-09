"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { DataBranches, DataFormUser, User } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchUsers: (first: number, page: number) => void;
  actionLbl: string;
  singleUserData: DataFormUser | undefined;
}
interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}
const FormAddUser: React.FC<ParentFormBr> = ({ setShowForm, actionLbl, fetchUsers, singleUserData }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<DataFormUser>();
  const { onSubmitUser, userLoading, dataSubBranch, dataRole, rolesLoading, subBranchLoading } = useUsers();
  const [options, setOptions] = useState<OptionProps[]>([
    { value: '', label: 'Select a branch', hidden: true },
  ]);
  const [optionsRole, setOptionsRole] = useState<OptionProps[]>([
    { value: '', label: 'Select a branch', hidden: true },
  ]);
  const [localBranchLoading, setLocalBranchLoading] = useState<boolean>(true);
  const [loadingStartTime] = useState<number>(Date.now());
  
  console.log('🔍 FormAddUser render - localBranchLoading:', localBranchLoading, 'dataSubBranch:', !!dataSubBranch, 'length:', dataSubBranch?.length);

   // Watch the password field
   const password = watch('password', '');

  const onSubmit: SubmitHandler<DataFormUser> = async (data) => {
    const result = await onSubmitUser(data) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result.success) {
      setShowForm(false);
      fetchUsers(10, 1);
    }
    // Form stays open on errors for user to fix and retry
  };

  useEffect(() => {
    if (dataSubBranch && Array.isArray(dataSubBranch)) {
      const dynamicOptions: OptionProps[] = dataSubBranch?.map(subBranch => ({
        value: subBranch.id,
        label: subBranch.name, // assuming `name` is the key you want to use as label
      }));
      setOptions([
        { value: '', label: 'Select a branch', hidden: true }, // retain the default "Select a branch" option
        ...dynamicOptions,
      ]);
      
      // Ensure minimum loading duration for user feedback
      const elapsedTime = Date.now() - loadingStartTime;
      const minLoadingDuration = 300; // 300ms minimum
      
      if (elapsedTime >= minLoadingDuration) {
        setLocalBranchLoading(false);
      } else {
        setTimeout(() => {
          setLocalBranchLoading(false);
        }, minLoadingDuration - elapsedTime);
      }
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
        setValue('role_id', singleUserData.role_id);
      }
    }
  }, [dataSubBranch, singleUserData, actionLbl, loadingStartTime])

  useEffect(() => {
    if (dataRole && Array.isArray(dataRole)) {
      const dynamicOptions: OptionProps[] = dataRole?.map(item => ({
        value: item.id,
        label: item.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsRole([
        { value: '', label: 'Select a Role', hidden: true }, // retain the default "Select a branch" option
        ...dynamicOptions,
      ]);
    }
  }, [dataRole])

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
            isLoading={localBranchLoading}
            loadingMessage="Loading branches..."
          />
          
          <FormInput
            label="Roles"
            id="role_id"
            type="select"
            icon={ChevronDown}
            register={register('role_id', { required: 'Role is required' })}
            error={errors.role_id?.message}
            options={optionsRole}
            isLoading={rolesLoading || !dataRole}
            loadingMessage="Loading roles..."
          />

          <FormInput
            label="Email"
            id="name"
            type="text"
            icon={Home}
            register={register('email', { required: true })}
            error={errors.email && "This field is required"}
            required={true}
          />

          <FormInput
            label="Name"
            id="name"
            type="text"
            icon={Home}
            register={register('name', { required: true })}
            error={errors.name && "This field is required"}
            required={true}
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
            required={true}
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
            required={true}
          />
        </>
      )}

      <div className="flex justify-end gap-4.5 mt-6">
        <button
          className="flex justify-center rounded border border-stroke px-4 py-2 sm:px-6 sm:py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
        >
          Cancel
        </button>
        <button
          className={`flex justify-center rounded bg-primary px-4 py-2 sm:px-6 sm:py-2 font-medium text-gray hover:bg-opacity-90 ${userLoading ? 'opacity-70' : ''}`}
          type="submit"
          disabled={userLoading}
        >
          {userLoading ? (
            <>
              <RotateCw size={17} className="animate-spin mr-1" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={17} className="mr-1" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default FormAddUser;