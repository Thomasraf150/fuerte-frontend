"use client"
import Button from '@/components/Button';
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

const CashPositionForm: React.FC<ParentFormBr> = ({ }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<DataChartOfAccountList>();

  const onSubmit: SubmitHandler<DataChartOfAccountList> = data => {
    
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        <div className='md:col-span-2'>
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
        <Button variant="secondary"
          type="button">
          Cancel
        </Button>
        <Button variant="primary"
          type="submit">
          Save
        </Button>
      </div>
    </form>
  );
};

export default CashPositionForm;