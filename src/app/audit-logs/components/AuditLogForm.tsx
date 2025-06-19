"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, ChevronDown } from 'react-feather';
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

const AuditLogForm: React.FC<ParentFormBr> = ({ setShowForm, fetchDataArea, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataArea>();
  const { onSubmitArea, branchSubData } = useArea();

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

  const onSubmit: SubmitHandler<DataArea> = data => {
    onSubmitArea(data);
    fetchDataArea(10, 1)
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
        label="Description"
        id="description"
        type="text"
        icon={Home}
        register={register('description', { required: true })}
        error={errors.description && "This field is required"}
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

export default AuditLogForm;