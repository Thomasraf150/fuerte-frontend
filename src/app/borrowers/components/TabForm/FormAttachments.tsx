"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { BorrowerRowInfo, BorrAttachmentsFormValues } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';
import useBorrowerAttachments from '@/hooks/useBorrowerAttachments';
import FormInputFile from '@/components/FormInputFile';
import FormLabel from '@/components/FormLabel';
import Image from 'next/image'; // Import next/image
// import ReactSelect from '@/components/ReactSelect';

interface ParentFormBr {
  createAttachments: (value: boolean) => void;
  singleData: BorrowerRowInfo | undefined;
  // fetchLoanProducts: (value: string) => void;
  // actionLbl: string;
  // singleData: BorrAttachmentsFormValues | undefined;
}

const FormAttachments: React.FC<ParentFormBr> = ({ createAttachments, singleData: BorrowerData }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrAttachmentsFormValues>();

  const [logoPreview, setLogoPreview] = useState<string | null>(null); // State for image preview
  const { onSubmitBorrAttm } = useBorrowerAttachments();

  const onSubmit: SubmitHandler<BorrAttachmentsFormValues> = data => {
    data.borrower_id = Number(BorrowerData?.id);
    onSubmitBorrAttm(data);
    createAttachments(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Update preview image URL
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // const options = [
  //   { value: '1', label: 'Option 1' },
  //   { value: '2', label: 'Option 2' },
  //   { value: '3', label: 'Option 3' },
  // ];
  
  // const handleChange = (selectedOption: any) => {
  //   console.log(selectedOption);
  // };

  useEffect(() => {
    
  }, [])

  return (

    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-black border-b mb-3 border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-whiter dark:text-white">
          Create Attachments
        </h3>
      </div>

      {/* <ReactSelect
        options={options}
        onChange={handleChange}
        value={null}
      /> */}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        {/* First Column */}
        <div>
          <FormLabel title={`File Type`}/>
          <FormInput
            label=""
            id="file_type"
            type="select"
            icon={ChevronDown}
            register={register('file_type', { required: 'Fily type is required' })}
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
          <FormLabel title={`Image`}/>
          <FormInput
            label=""
            id="collection"
            type="file"
            icon={Home}
            register={register('file', { required: true })}
            error={errors.file && "This field is required"}
            onChange={(e: any) => handleFileChange(e) }
          />
          {logoPreview && (
            <div className="image-preview">
              <Image src={logoPreview} alt="Preview" width={700} height={300} priority unoptimized={true}/>
            </div>
          )}
        </div>
        <div></div>
        <div>
          <div className="flex justify-end gap-4.5">
            <button
              className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              type="button"
              onClick={()=>{ createAttachments(true) }}
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