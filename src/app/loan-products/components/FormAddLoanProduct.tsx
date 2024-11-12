"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { DataBranches, DataFormUser, User, DataRowLoanProducts, DataFormLoanProducts } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';
import useLoanProducts from '@/hooks/useLoanProducts';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchLoanProducts: (value: string) => void;
  actionLbl: string;
  singleData: DataRowLoanProducts | undefined;
}
interface OptionLoanCode {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const FormAddLoanProduct: React.FC<ParentFormBr> = ({ setShowForm, fetchLoanProducts, actionLbl, singleData }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<DataFormLoanProducts>();
  const { onSubmitLoanProduct } = useLoanProducts();
  const { data: loanCodeData } = useLoanCodes();
  const [optionsClient, setOptionsClient] = useState<OptionLoanCode[]>([]);
  const [selectedOptIsAuto, setSelectedOptIsAuto] = useState<string>();
  const [baseCompOptions, setBaseCompOptions] = useState<OptionLoanCode[]>([
    { value: '', label: 'Select Base Deduction', hidden: true },
    { value: '0', label: 'Loan Proceeds' },
    { value: '1', label: 'PN' },
  ]);
  // const [isAutoOptions, setIsAutoOptions] = useState<OptionLoanCode[]>([
  //   { value: '', label: 'Select Is Auto compute', hidden: true },
  //   { value: '0', label: 'Yes' },
  //   { value: '1', label: 'No' },
  // ]);

   // Watch the password field
  //  const password = watch('password', '');

  const onSubmit: SubmitHandler<DataFormLoanProducts> = data => {
    onSubmitLoanProduct(data);
    setShowForm(false);
    fetchLoanProducts('id_desc');
  };

  const handleComputeUdi = () => {
    const interest_rate = watch('interest_rate');
    const terms = watch('terms');
    const processing = watch('processing');
    const collection = watch('collection');
    const udi = (((Number(interest_rate) / 100) * Number(terms)) - ((Number(processing) / 100) + (Number(collection) / 100))) * 100;
    console.log(udi, 'udi')

    if (!isNaN(udi)) {
      setValue('udi', parseFloat(udi.toFixed(2)));
    } else {
      setValue('udi', ''); // or handle the invalid number case as needed
    }
  }

  useEffect(() => {
    if (loanCodeData && Array.isArray(loanCodeData)) {
      const dynaOpt: OptionLoanCode[] = loanCodeData?.map(dLCodes => ({
        value: String(dLCodes.id),
        label: dLCodes.code + ' - ' + dLCodes.description, // assuming `name` is the key you want to use as label
      }));
      setOptionsClient([
        { value: '', label: 'Select a Loan Code', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
    if (singleData) {
      setValue('id', singleData.id);
      setValue('loan_code_id', singleData.loan_code_id);
      setValue('description', singleData.description);
      setValue('terms', singleData.terms);
      setValue('interest_rate', singleData.interest_rate);
      setValue('udi', singleData.udi);
      setValue('processing', singleData.processing);
      setValue('insurance', singleData.insurance);
      setValue('collection', singleData.collection);
      setValue('notarial', singleData.notarial);
      setValue('base_deduction', singleData.base_deduction);
      setValue('addon_terms', singleData.addon_terms);
      setValue('addon_udi_rate', singleData.addon_udi_rate);
      setValue('is_active', singleData.is_active);
    } else {
      reset({
        id: '',
        loan_code_id: '',
        description: '',
        terms: '',
        interest_rate: '',
        processing: '',
        insurance: '',
        collection: '',
        notarial: '',
        base_deduction: '',
        addon_terms: '',
        addon_udi_rate: '',
        is_active: ''
      })
    }
  }, [loanCodeData, singleData])

  const handleOnChangeAutoCompute = (e: any) => {
    setSelectedOptIsAuto(e.target.value);
  }

  useEffect(() => {
    console.log(selectedOptIsAuto, ' selectedOptIsAuto')
  }, [selectedOptIsAuto])

  return (

    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        {/* First Column */}
        <div className="col-span-2">
           <FormInput
            label="Base Deduction"
            id="base_deduction"
            type="select"
            icon={ChevronDown}
            register={register('base_deduction', { required: 'Base Deduction is required' })}
            error={errors.base_deduction?.message}
            options={baseCompOptions}
          />
        </div>
        <div className="col-span-2">
           <FormInput
            label="Loan Code"
            id="loan_code_id"
            type="select"
            icon={ChevronDown}
            register={register('loan_code_id', { required: 'Loan Code is required' })}
            error={errors.loan_code_id?.message}
            options={optionsClient}
          />
        </div>
        <div className="col-span-2">
          <FormInput
            label="* Description"
            id="description"
            type="text"
            icon={Home}
            register={register('description', { required: 'Loan Code is required' })}
            error={errors.description ? "This field is required" : undefined}
          />
        </div>
        <div>
          <FormInput
            label="* Interest Rate (%)"
            id="interest_rate"
            type="text"
            icon={Home}
            register={register('interest_rate', { required: true })}
            error={errors.interest_rate && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="* Terms / No of Mos."
            id="terms"
            type="text"
            icon={Home}
            register={register('terms', { required: true })}
            error={errors.terms && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Processing (%)"
            id="processing"
            type="text"
            icon={Home}
            register={register('processing')}
            error={errors.processing && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Collection (%)"
            id="collection"
            type="text"
            icon={Home}
            register={register('collection')}
            error={errors.collection && "This field is required"}
          />
        </div>
        {/* {selectedOptIsAuto === '0' ? (
          <div className='relative col-span-2'>
            <div className="absolute bottom-0 right-1 z-10 xsm:bottom-0 xsm:right-0">
              <label
                htmlFor="cover"
                onClick={handleComputeUdi}
                className="flex cursor-pointer items-center justify-center gap-2 rounded bg-primary px-2 py-1 text-sm font-medium text-white hover:bg-opacity-80 xsm:px-4"
              >
                <span>Compute UDI</span>
              </label>
            </div>
          </div>
        ) : (<></>)} */}
        <div>
          <FormInput
            label="* UDI (%)"
            id="udi"
            type="text"
            icon={Home}
            register={register('udi', { required: true })}
            error={errors.udi && "This field is required"}
          />
        </div>
        {/* <div>
          <FormInput
            label="Addon (%)"
            id="addon"
            type="text"
            icon={Home}
            register={register('addon')}
            error={errors.addon && "This field is required"}
          />
        </div> */}
        <div>
          <FormInput
            label="* Addon Terms."
            id="terms"
            type="text"
            icon={Home}
            register={register('addon_terms', { required: true })}
            error={errors.terms && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="* Addon UDI Rate (%)"
            id="terms"
            type="text"
            icon={Home}
            register={register('addon_udi_rate', { required: true })}
            error={errors.terms && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Notarial"
            id="notarial"
            type="text"
            icon={Home}
            register={register('notarial')}
            error={errors.notarial && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Insurance Rate (%)"
            id="insurance"
            type="text"
            icon={Home}
            register={register('insurance')}
            error={errors.insurance && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Active"
            id="is_active"
            type="checkbox"
            icon={Home} // icon is not used for checkbox, can be omitted or replaced
            register={register('is_active')}
          />
        </div>
        

        <div>
          <div className="flex justify-end gap-4.5">
            <button
              className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              type="button"
              onClick={()=>{ setShowForm(false) }}
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

export default FormAddLoanProduct;