"use client"
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, Save, RotateCw } from 'react-feather';
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
  const { onSubmitBranch, branchLoading } = useBranches();

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

  const onSubmit: SubmitHandler<DataFormBranch> = async (data) => {
    const result = await onSubmitBranch(data);

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