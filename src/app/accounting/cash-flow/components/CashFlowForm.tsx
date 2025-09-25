"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useCoa from '@/hooks/useCoa';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';

interface ParentFormBr {

}

const CashFlowForm: React.FC<ParentFormBr> = ({ }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<DataChartOfAccountList>();

  const onSubmit: SubmitHandler<DataChartOfAccountList> = data => {
    
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-4">
        <div className='mt-2'>
          <FormInput
            label="Area"
            id="account_name"
            type="text"
            icon={Edit3}
            register={register('account_name', { required: true })}
            error={errors.account_name && "Account name is required"}
          />
        </div>

        <div>
          <FormInput
            label="Description"
            id="description"
            type="text"
            icon={Edit3}
            register={register('description', { required: true })}
            error={errors.description && "Description is required"}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Balance"
            id="balance"
            type="text"
            icon={Edit3}
            formatType="number"
            register={register('balance', { required: true })}
            error={errors.balance && "Balance is required"}
            className='mt-2'
          />
        </div>
        <div className='col-span-2'>
          <FormInput
            label="Particulars"
            id="balance"
            type="text"
            icon={Edit3}
            register={register('balance', { required: true })}
            error={errors.balance && "Balance is required"}
            className='mt-2'
          />
        </div>
      </div>

      <div className="flex justify-end gap-4.5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
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

export default CashFlowForm;