"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { BorrowerRowInfo, BorrCoMakerFormValues, BorrCoMakerRowData } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';
import useBorrowerCoMaker from '@/hooks/useBorrowerCoMaker';
import FormInputFile from '@/components/FormInputFile';
import FormLabel from '@/components/FormLabel';
import Image from 'next/image'; // Import next/image

interface ParentFormBr {
  createCoMaker: (value: boolean) => void;
  singleData: BorrowerRowInfo | undefined;
  coMakerData: any;
  borrowerLoading: boolean;
}

const FormComaker: React.FC<ParentFormBr> = ({ createCoMaker, singleData: BorrowerData, coMakerData, borrowerLoading }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrCoMakerFormValues>();

  const { onSubmitBorrCoMaker } = useBorrowerCoMaker();

  const onSubmit: SubmitHandler<BorrCoMakerFormValues> = async (data) => {
    data.borrower_id = Number(BorrowerData?.id);

    const result = await onSubmitBorrCoMaker(data);

    // Only close form on successful submission
    if (result.success) {
      createCoMaker(false);
    }
    // Form stays open on errors for user to fix and retry
  };

  useEffect(() => {
    if (coMakerData) {
      setValue('id', coMakerData.id);
      setValue('borrower_id', coMakerData.borrower_id);
      setValue('user_id', coMakerData.borrower_id);
      setValue('name', coMakerData.name);
      setValue('relationship', coMakerData.relationship);
      setValue('marital_status', coMakerData.marital_status);
      setValue('address', coMakerData.address);
      setValue('birthdate', coMakerData.birthdate);
      setValue('contact_no', coMakerData.contact_no);
    }
  }, [coMakerData])

  return (

    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-black border-b mb-3 border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-whiter dark:text-white">
          Create Attachments
        </h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        {/* First Column */}
        <div>
          <FormInput
            label="* Full Name"
            id="name"
            type="text"
            icon={Home}
            register={register('name', { required: true })}
            error={errors.name && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Relationship with borrower"
            id="relationship"
            type="text"
            icon={Home}
            register={register('relationship', { required: true })}
            error={errors.relationship && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Marital Status"
            id="marital_status"
            type="select"
            icon={ChevronDown}
            register={register('marital_status', { required: 'Fily type is required' })}
            error={errors.marital_status?.message}
            options={[
              { value: '', label: 'Select a Marital', hidden: true },
              { value: 'Single', label: 'Single' },
              { value: 'Married', label: 'Married' },
              { value: 'Separated', label: 'Separated' },
              { value: 'Widow/er', label: 'Widow/er' },
              { value: 'Unknown', label: 'Unknown' },
            ]}
          />
        </div>
        <div>
          <FormInput
            label="Address"
            id="address"
            type="text"
            icon={Home}
            register={register('address', { required: true })}
            error={errors.address && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Date of Birth"
            id="birthdate"
            type="date"
            icon={Home}
            register={register('birthdate', { required: true })}
            error={errors.birthdate && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Contact No./s"
            id="contact_no"
            type="text"
            icon={Home}
            register={register('contact_no', { required: true })}
            error={errors.contact_no && "This field is required"}
          />
        </div>
        <div>
        </div>
        <div>
          <div className="flex justify-end gap-4.5">
            <button
              className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              type="button"
              onClick={()=>{ createCoMaker(false) }}
            >
              Back
            </button>
            <button
              className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${borrowerLoading ? 'opacity-70' : ''}`}
              type="submit"
              disabled={borrowerLoading}
            >
              {borrowerLoading ? (
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
        </div>

        {/* Add more columns if necessary */}

        {/* Submit Button */}
        
      </form>
    </div>
  );
};

export default FormComaker;