"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { DataBranches, DataFormUser, User } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  onSaved: () => void;
  actionLbl: string;
  singleUserData: DataFormUser | undefined;
}
interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}
const FormAddUser: React.FC<ParentFormBr> = ({ setShowForm, actionLbl, onSaved, singleUserData }) => {
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
  // Additional sub-branches granted to this user beyond branch_sub_id.
  // OWNER-ONLY: cross-branch grants are a privileged operation, so we
  // hide the section entirely for non-Owner editors.
  const [additionalIds, setAdditionalIds] = useState<number[]>([]);
  const [callerIsOwner, setCallerIsOwner] = useState<boolean>(false);
  const homeBranchId = Number(watch('branch_sub_id'));

  // Watch the password field
  const password = watch('password', '');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('authStore') ?? '{}';
      const state = JSON.parse(raw)?.state ?? {};
      const code = state?.user?.role?.code;
      setCallerIsOwner(code === 'OWN');
    } catch {
      setCallerIsOwner(false);
    }
  }, []);

  const onSubmit: SubmitHandler<DataFormUser> = async (data) => {
    // Validate branch_sub_id is selected and valid (not 0 or empty)
    if (!data.branch_sub_id || Number(data.branch_sub_id) === 0) {
      return; // Form validation will show error
    }

    // Only attach additional grants when an Owner is editing — preserves
    // the "Create User" flow and non-Owner Update flow exactly as before.
    // The hook will only call setUserBranchAccess if this field is defined.
    const payload: DataFormUser =
      actionLbl === 'Update User' && callerIsOwner
        ? { ...data, additional_branch_sub_ids: additionalIds }
        : data;

    const result = await onSubmitUser(payload) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result.success) {
      setShowForm(false);
      onSaved();
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
        branch_sub_id: undefined,  // Force user to select a valid branch
        role_id: undefined,        // Force user to select a valid role
      });
    } else {
      if (singleUserData) {
        setValue('id', singleUserData.id);
        setValue('name', singleUserData.name);
        setValue('email', singleUserData.email);
        setValue('branch_sub_id', singleUserData.branch_sub_id);
        setValue('role_id', singleUserData.role_id);
        const existing = (singleUserData as any)?.additionalBranchSubs ?? [];
        setAdditionalIds(
          Array.isArray(existing)
            ? existing.map((b: any) => Number(b?.id)).filter((n: number) => !Number.isNaN(n))
            : []
        );
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

          {actionLbl === 'Update User' && callerIsOwner && (
            <div className="mb-6 mt-6 rounded-md border border-stroke bg-gray-50 px-4 py-4 dark:border-strokedark dark:bg-meta-4">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <label className="block text-sm font-semibold text-black dark:text-white">
                  Cross-Branch Access
                </label>
                <span className="text-[11px] uppercase tracking-wide text-meta-1">
                  Owner only
                </span>
              </div>
              <p className="mb-3 text-xs text-body">
                Grants the user access to <strong>additional</strong> sub-branches
                beyond their home branch above. When creating a borrower or loan,
                the user can pick any of these branches from the form&apos;s branch
                dropdown.
              </p>
              {localBranchLoading || !dataSubBranch ? (
                <div className="rounded border border-stroke bg-white px-4 py-3 text-sm text-body dark:border-form-strokedark dark:bg-form-input">
                  Loading branches...
                </div>
              ) : (
                <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded border border-stroke bg-white px-4 py-3 dark:border-form-strokedark dark:bg-form-input">
                  {dataSubBranch.map((sb) => {
                    const sbId = Number(sb.id);
                    const isHome = sbId === homeBranchId;
                    const isChecked = additionalIds.includes(sbId);
                    return (
                      <label
                        key={sb.id}
                        className={`flex items-center gap-2 text-sm ${isHome ? 'opacity-50' : ''}`}
                        title={isHome ? 'Home branch — already granted via branch_sub_id' : ''}
                      >
                        <input
                          type="checkbox"
                          disabled={isHome}
                          checked={isChecked && !isHome}
                          onChange={(e) => {
                            if (isHome) return;
                            setAdditionalIds((prev) =>
                              e.target.checked
                                ? [...prev, sbId]
                                : prev.filter((id) => id !== sbId)
                            );
                          }}
                        />
                        <span>{sb.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {additionalIds.length === 0 ? (
                <p className="mt-3 text-xs text-body">
                  No extra branches selected — user has access to home branch only.
                </p>
              ) : (
                <p className="mt-3 text-xs font-medium text-meta-3">
                  {additionalIds.length} additional branch{additionalIds.length === 1 ? '' : 'es'} selected.
                  The user can pick any of these on the branch dropdown when
                  creating borrowers or loans.
                </p>
              )}
            </div>
          )}

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