"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw } from 'react-feather';
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
  const { onSubmitLoanProduct, loanProductLoading } = useLoanProducts();
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

  const onSubmit: SubmitHandler<DataFormLoanProducts> = async (data) => {
    const result = await onSubmitLoanProduct(data);

    // Only close form on successful submission
    if (result.success) {
      setShowForm(false);
      fetchLoanProducts('id_desc');
    }
    // Form stays open on errors for user to fix and retry
  };

  const handleComputeUdi = () => {
    const interest_rate = watch('interest_rate');
    const terms = watch('terms');
    const processing = watch('processing');
    const agent_fee = watch('agent_fee');
    const collection = watch('collection');
    const udi = (((Number(interest_rate) / 100) * Number(terms)) - ((Number(processing) / 100) + (Number(collection) / 100) + (Number(agent_fee) / 100))) * 100;

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
      setValue('agent_fee', singleData.agent_fee);
      setValue('insurance', singleData.insurance);
      setValue('insurance_fee', singleData.insurance_fee);
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
        agent_fee: '',
        insurance: '',
        insurance_fee: '',
        collection: '',
        notarial: '',
        base_deduction: '',
        addon_terms: '',
        addon_udi_rate: '',
        is_active: ''
      })
    }
  }, [loanCodeData, singleData])

  useEffect(() => {
  }, [selectedOptIsAuto])

  return (

    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Column */}
        <div className="col-span-1 md:col-span-2">
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
        <div className="col-span-1 md:col-span-2">
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
        <div className="col-span-1 md:col-span-2">
          <FormInput
            label="Description"
            id="description"
            type="text"
            icon={Home}
            register={register('description', { required: 'Loan Code is required' })}
            error={errors.description ? "This field is required" : undefined}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Interest Rate (%)"
            id="interest_rate"
            type="text"
            icon={Home}
            register={register('interest_rate', { required: true })}
            error={errors.interest_rate && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Terms / No of Mos."
            id="terms"
            type="text"
            icon={Home}
            register={register('terms', { required: true })}
            error={errors.terms && "This field is required"}
            required={true}
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
            label="Agent Fee (%)"
            id="agent_fee"
            type="text"
            icon={Home}
            register={register('agent_fee')}
            error={errors.agent_fee && "This field is required"}
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
        <div>
          <FormInput
            label="UDI (%)"
            id="udi"
            type="text"
            icon={Home}
            register={register('udi', { required: true })}
            error={errors.udi && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Addon Terms."
            id="terms"
            type="text"
            icon={Home}
            register={register('addon_terms', { required: true })}
            error={errors.terms && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Addon UDI Rate (%)"
            id="terms"
            type="text"
            icon={Home}
            register={register('addon_udi_rate', { required: true })}
            error={errors.terms && "This field is required"}
            required={true}
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
            label="Insurance Manual Fee"
            id="insurance_fee"
            type="text"
            icon={Home}
            register={register('insurance_fee')}
            error={errors.insurance_fee && "This field is required"}
            formatType="number"
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


        <div className="col-span-1 md:col-span-2 mt-4">
          <div className="flex justify-end gap-4.5">
            <button
              className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              type="button"
              onClick={()=>{ setShowForm(false) }}
            >
              Back
            </button>
            <button
              className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${loanProductLoading ? 'opacity-70' : ''}`}
              type="submit"
              disabled={loanProductLoading}
            >
              {loanProductLoading ? (
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

export default FormAddLoanProduct;