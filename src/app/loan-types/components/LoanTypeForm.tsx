"use client";

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import { DataFormLoanType, DataRowLoanTypeList } from '@/utils/DataTypes';
import Button from '@/components/Button';

interface LoanTypeFormProps {
  onSubmit: (data: DataFormLoanType) => Promise<{ success: boolean }>;
  onCancel: () => void;
  initialData?: DataRowLoanTypeList | null;
  submitting: boolean;
}

const LoanTypeForm: React.FC<LoanTypeFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  submitting,
}) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<DataFormLoanType>();

  useEffect(() => {
    if (initialData) {
      setValue('id', initialData.id);
      setValue('name', initialData.name);
    } else {
      reset({ name: '' });
    }
  }, [initialData, reset, setValue]);

  const handleFormSubmit: SubmitHandler<DataFormLoanType> = async (data) => {
    const result = await onSubmit(data);
    if (result.success && !initialData) {
      reset({ name: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormInput
        label="Name"
        id="name"
        type="text"
        icon={Home}
        register={register('name', { required: 'Name is required' })}
        error={errors.name?.message}
      />

      <div className="flex justify-end gap-4.5 mt-6">
        <Button variant="secondary"
          type="button"
          onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary"
          type="submit"
          disabled={submitting}>
          {submitting ? (
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
        </Button>
      </div>
    </form>
  );
};

export default LoanTypeForm;
