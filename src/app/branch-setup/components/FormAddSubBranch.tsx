"use client"
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';

interface FormValues {
  name: string;
  branch_id: string;
};

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
}

const FormAddSubBranch: React.FC<ParentFormBr> = ({ setShowForm }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = data => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Branch"
        id="branch_id"
        type="select"
        icon={ChevronDown}
        register={register('branch_id', { required: 'Branch is required' })}
        error={errors.branch_id?.message}
        options={[
          { value: '', label: 'Select a branch' },
          { value: 'admin', label: 'Branch 1' },
          { value: 'user', label: 'Branch 2' },
          { value: 'guest', label: 'Branch 3' }
        ]}
      />

      <FormInput
        label="Branch Name"
        id="name"
        type="text"
        icon={Home}
        register={register('name', { required: true })}
        error={errors.name && "This field is required"}
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

export default FormAddSubBranch;