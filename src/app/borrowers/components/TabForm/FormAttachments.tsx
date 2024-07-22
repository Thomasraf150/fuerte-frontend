"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { BorrowerDataAttachments } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';
import useLoanProducts from '@/hooks/useLoanProducts';
import FormInputFile from '@/components/FormInputFile';

interface ParentFormBr {
  // setShowForm: (value: boolean) => void;
  // fetchLoanProducts: (value: string) => void;
  // actionLbl: string;
  // singleData: BorrowerDataAttachments | undefined;
}

const FormAttachments: React.FC<ParentFormBr> = ({ }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrowerDataAttachments>();

  const [logoPreview, setLogoPreview] = useState<string | null>(null); // State for image preview

   // Watch the password field
  //  const password = watch('password', '');

  const onSubmit: SubmitHandler<BorrowerDataAttachments> = data => {
    console.log(data, 'data')
    // onSubmitLoanProduct(data);
    // setShowForm(false);
    // fetchLoanProducts('id_desc');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Update preview image URL
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    
  }, [])

  return (

    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        {/* First Column */}
        <div>
           <FormInput
            label="File Type"
            id="file_type"
            type="select"
            icon={ChevronDown}
            register={register('file_type', { required: 'Loan Code is required' })}
            error={errors.file_type?.message}
            options={[
              { value: '', label: 'Select a Loan Code', hidden: true },
              { value: 'Image', label: 'Image' },
              { value: 'CI Form', label: 'CI Form' },
              { value: 'Application Form', label: 'Application Form' },
              { value: 'Promissory Note', label: 'Promissory Note' },
              { value: 'Release Form', label: 'Release Form' },
              { value: 'Salary and Payable Verification', label: 'Salary and Payable Verification' },
              { value: 'First Demand Letter', label: 'First Demand Letter' },
              { value: 'Second Demand Letter', label: 'Second Demand Letter' },
              { value: 'Proof of Payment', label: 'Proof of Payment' },
              { value: 'Co-Borrower Form', label: 'Co-Borrower Form' },
            ]}
          />
        </div>
        <div>
          <FormInput
            label=" File"
            id="file_path"
            type="file"
            icon={Home}
            register={register('file_path', { required: true })}
            error={errors.file_path && "This field is required"}
          />
        </div>
      
        
        <div></div>

        <div>
          <div className="flex justify-end gap-4.5">
            <button
              className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              type="button"
              // onClick={()=>{ setShowForm(false) }}
            >
              Back
            </button>
            <button
              className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
              type="submit"
            >
              Save
            </button>
          </div>
        </div>

        {/* Add more columns if necessary */}

        {/* Submit Button */}
        
      </form>
    </div>
  );
};

export default FormAttachments;