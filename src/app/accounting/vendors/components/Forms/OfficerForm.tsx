"use client"
import Button from '@/components/Button';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, Save, RotateCw } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useVendor from '@/hooks/useVendor';
import { RowVendorsData, DataSubBranches, RowSupCatData } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (v: boolean) => void;
  fetchVendors: (v: string) => void;
  createVendor: (d: RowVendorsData) => Promise<{success: boolean, error?: string, data?: any}>;
  vendorTypeId: string;
  vendorLoading: boolean;
  singleData: RowVendorsData | undefined;
}

interface Option {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const OfficerForm: React.FC<ParentFormBr> = ({ setShowForm, vendorTypeId, fetchVendors, vendorLoading, createVendor, singleData }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowVendorsData>();

  useEffect(() => {
    setValue('vendor_type_id', vendorTypeId);
    setValue('id', singleData?.id ?? '');
    setValue('name', singleData?.name ?? '');
    setValue('tin', singleData?.tin ?? '');
    setValue('office_no', singleData?.office_no ?? '');
    setValue('employee_position', singleData?.employee_position ?? '');
  }, [singleData])

  const onSubmit: SubmitHandler<RowVendorsData> = async (data) => {
    console.log(data, ' data');
    const result = await createVendor(data);
    
    // Only close form and refetch on successful submission
    if (result.success) {
      fetchVendors(vendorTypeId);
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className='mt-2'>
          <FormInput
            label="Office Name"
            id="name"
            type="text"
            icon={Edit3}
            register={register('name', { required: true })}
            error={errors.name && "Account name is required"}
          />
        </div>

        <div>
          <FormInput
            label="TIN"
            id="tin"
            type="text"
            icon={Edit3}
            register={register('tin', { required: true })}
            error={errors.tin && "tin is required"}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Office No."
            id="office_no"
            type="text"
            icon={Edit3}
            register={register('office_no', { required: true })}
            error={errors.office_no && "office no is required"}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Position"
            id="employee_position"
            type="text"
            icon={Edit3}
            register={register('employee_position', { required: true })}
            error={errors.employee_position && "employee position is required"}
            className='mt-2'
          />
        </div>

      </div>

      <div className="flex justify-end gap-4.5 mt-5">
        <Button variant="secondary"
          type="button"
          onClick={() => { setShowForm(false); }}>
          Cancel
        </Button>
        <Button variant="primary"
          type="submit"
          disabled={vendorLoading}>
          {vendorLoading ? (
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

export default OfficerForm;