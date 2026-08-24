"use client"
import React, { useEffect, useMemo } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import ReactSelect from '@/components/ReactSelect';
import useBranches from '@/hooks/useBranches';
import { DataBranches, DataFormBranch } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchDataList: () => void;
  initialData?: DataBranches | null;
  actionLbl: string;
}

const FormAddBranch: React.FC<ParentFormBr> = ({ setShowForm, fetchDataList, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<DataFormBranch>();
  const { onSubmitBranch, branchLoading, dataBranchGroup, fetchBranchGroupList, loadingBranchGroups } = useBranches();

  // The four groups (FA/FB/FC/FD). Without this the form could not assign one,
  // so every branch created since the Group tier shipped landed with a blank
  // Group column in the list.
  useEffect(() => {
    fetchBranchGroupList();
  }, []);

  const optionsGroup = useMemo(
    () => (dataBranchGroup ?? []).map((g) => ({ value: String(g.id), label: g.name })),
    [dataBranchGroup],
  );

  useEffect(()=>{
    if (initialData) {
      if (actionLbl === 'Update Branch') {
        setValue('id', initialData.id ?? '')
        setValue('name', initialData.name)
        setValue('branch_group_id', initialData.branch_group_id != null ? String(initialData.branch_group_id) : '')
      } else {
        reset({
          id: '',
          name: '',
          branch_group_id: ''
        });
      }
    }
  }, [initialData, setValue, actionLbl])

  const onSubmit: SubmitHandler<DataFormBranch> = async (data) => {
    const result = await onSubmitBranch(data) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result.success) {
      fetchDataList();
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Branch Name"
        id="name"
        type="text"
        icon={Home}
        register={register('name', { required: true })}
        error={errors.name && "This field is required"}
        required={true}
      />

      <div className="mt-4">
        <label className="mb-2.5 block text-black dark:text-white">
          Group <span className="text-meta-1">*</span>
        </label>
        <Controller
          name="branch_group_id"
          control={control}
          rules={{ required: 'Group is required' }}
          render={({ field }) => (
            <ReactSelect
              {...field}
              options={optionsGroup}
              placeholder="Select a group..."
              isLoading={loadingBranchGroups}
              loadingMessage={() => 'Loading groups...'}
              onChange={(selectedOption: any) => field.onChange(selectedOption?.value ?? '')}
              value={optionsGroup.find((o) => String(o.value) === String(field.value)) || null}
            />
          )}
        />
        {errors.branch_group_id && (
          <span className="text-meta-1 text-sm">{errors.branch_group_id.message}</span>
        )}
      </div>

      <div className="flex justify-end gap-4.5 mt-6">
        <button
          className="flex justify-center rounded border border-stroke px-4 py-2 sm:px-6 sm:py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
        >
          Cancel
        </button>
        <button
          className={`flex justify-center rounded bg-primary px-4 py-2 sm:px-6 sm:py-2 font-medium text-gray hover:bg-opacity-90 ${branchLoading ? 'opacity-70' : ''}`}
          type="submit"
          disabled={branchLoading}
        >
          {branchLoading ? (
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

export default FormAddBranch;