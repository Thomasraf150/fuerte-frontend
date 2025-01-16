"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useCoa from '@/hooks/useCoa';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchCoaDataTable: () => void;
  initialData?: DataChartOfAccountList | null;
  actionLbl: string;
}

interface OptionSubBranch {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const CoaForm: React.FC<ParentFormBr> = ({ setShowForm, fetchCoaDataTable, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataChartOfAccountList>();
  const { onSubmitCoa, branchSubData } = useCoa();

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
      if (actionLbl === 'Update Coa') {
        // setValue('id', initialData.id ?? '')
        // setValue('branch_sub_id', initialData.branch_sub_id)
        // setValue('name', initialData.name)
        // setValue('description', initialData.description)
      } else {
        // reset({
        //   id: '',
        //   branch_sub_id: 0,
        //   name: '',
        //   description: ''
        // });
      }
    }

    console.log(initialData, ' initialData');
  }, [initialData, setValue, actionLbl, branchSubData])

  const [selectedPlacement, setSelectedPlacement] = useState<string>("");

  const handleChangePlacement = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPlacement(event.target.value);
  };


  const onSubmit: SubmitHandler<DataChartOfAccountList> = data => {
    onSubmitCoa(data);
    fetchCoaDataTable()
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
        className='mb-4'
      />

      <FormInput
        label="Account Name"
        id="account_name"
        type="text"
        icon={Edit3}
        register={register('account_name', { required: true })}
        error={errors.account_name && "This field is required"}
      />

      <div className="space-y-2">
        <label
              className={`block text-sm font-medium text-black dark:text-white mr-2`}
        >
          Placement
        </label>
        <div className="flex items-center space-x-6">
          
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              {...register("is_debit", { required: "Please select Placement" })}
              value="1"
              checked={selectedPlacement === "1"}
              onChange={handleChangePlacement}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Debit</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="radio"
              {...register("is_debit", { required: "Please select Placement" })}
              name="option"
              value="0"
              checked={selectedPlacement === "0"}
              onChange={handleChangePlacement}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Credit</span>
          </label>
        </div>
      </div>
      
      <FormInput
        label="Description"
        id="description"
        type="text"
        icon={Edit3}
        register={register('description', { required: true })}
        error={errors.description && "This field is required"}
        className='mt-2'
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

export default CoaForm;