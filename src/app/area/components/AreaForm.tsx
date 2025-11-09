"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useArea from '@/hooks/useArea';
import { DataArea, DataSubBranches } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchDataArea: (f: number, p: number) => void;
  initialData?: DataArea | null;
  actionLbl: string;
}

interface OptionSubBranch {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const AreaForm: React.FC<ParentFormBr> = ({ setShowForm, fetchDataArea, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataArea>();
  const { onSubmitArea, branchSubData, areaLoading } = useArea();

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
      if (actionLbl === 'Update Area') {
        setValue('id', initialData.id ?? '')
        setValue('branch_sub_id', initialData.branch_sub_id)
        setValue('name', initialData.name)
        setValue('description', initialData.description)
      } else {
        reset({
          id: '',
          branch_sub_id: 0,
          name: '',
          description: ''
        });
      }
    }

    console.log(initialData, ' initialData');
  }, [initialData, setValue, actionLbl, branchSubData])

  const onSubmit: SubmitHandler<DataArea> = async (data) => {
    const result = await onSubmitArea(data) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result && typeof result === 'object' && 'success' in result && result.success) {
      fetchDataArea(10, 1);
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
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
        isLoading={!branchSubData}
        loadingMessage="Loading branches..."
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
        label="Description"
        id="description"
        type="text"
        icon={Home}
        register={register('description', { required: true })}
        error={errors.description && "This field is required"}
      />

      <div className="flex justify-end gap-4.5 mt-6">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
        >
          Cancel
        </button>
        <button
          className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${areaLoading ? 'opacity-70' : ''}`}
          type="submit"
          disabled={areaLoading}
        >
          {areaLoading ? (
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

export default AreaForm;