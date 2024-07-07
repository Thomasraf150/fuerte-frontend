"use client"
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User } from 'react-feather';
import FormInput from '@/components/FormInput';
import useBranches from '@/hooks/useBranches';
import { DataBranches, DataFormBranch } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchDataList: () => void;
  initialData?: DataBranches | null;
  actionLbl: string;
}

const FormAddBranch: React.FC<ParentFormBr> = ({ setShowForm, fetchDataList, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataFormBranch>();
  const { onSubmitBranch } = useBranches();

  useEffect(()=>{
    if (initialData) {
      if (actionLbl === 'Update Branch') {
        setValue('id', initialData.id ?? '')
        setValue('name', initialData.name)
      } else {
        reset({
          id: '',
          name: ''
        });
      }
    }
  }, [initialData, setValue, actionLbl])

  const onSubmit: SubmitHandler<DataFormBranch> = data => {
    onSubmitBranch(data);
    fetchDataList()
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

export default FormAddBranch;