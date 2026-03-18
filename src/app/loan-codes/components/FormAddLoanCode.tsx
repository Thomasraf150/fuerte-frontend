"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import FormLabel from '@/components/FormLabel';
import ReactSelect from '@/components/ReactSelect';
import useLoanCodes from '@/hooks/useLoanCodes';
import { DataFormLoanCodes, DataRowLoanCodes, SelectOption } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchLoanCodes: (value: string) => void;
  actionLbl: string;
  singleUserData: DataRowLoanCodes | undefined;
}

const FormAddLoanCode: React.FC<ParentFormBr> = ({ setShowForm, actionLbl, singleUserData, fetchLoanCodes }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<DataFormLoanCodes>();
  const { onSubmitLoanCode, dataClients, dataType, loanCodeLoading } = useLoanCodes();

  const [optionsClient, setOptionsClient] = useState<SelectOption[]>([]);
  const [optionsType, setOptionsType] = useState<SelectOption[]>([]);

  const onSubmit: SubmitHandler<DataFormLoanCodes> = async (data) => {
    const result = await onSubmitLoanCode(data) as { success: boolean; error?: string; data?: any };

    if (result.success) {
      fetchLoanCodes('id_desc');
      setShowForm(false);
    }
  };

  useEffect(() => {
    if (dataClients && Array.isArray(dataClients)) {
      setOptionsClient(dataClients.map(c => ({
        value: String(c.id),
        label: c.name,
      })));
    }
    if (dataType && Array.isArray(dataType)) {
      setOptionsType(dataType.map(t => ({
        value: String(t.id),
        label: t.name,
      })));
    }
  }, [dataClients, dataType]);

  useEffect(() => {
    if (actionLbl === 'Create Loan Code') {
      reset({
        loan_client_id: 0,
        loan_type_id: 0,
        code: '',
        description: '',
      });
    } else if (singleUserData) {
      setValue('id', singleUserData.id);
      setValue('loan_client_id', singleUserData.loan_client_id);
      setValue('loan_type_id', singleUserData.loan_type_id);
      setValue('code', singleUserData.code);
      setValue('description', singleUserData.description);
    }
  }, [actionLbl, singleUserData, reset, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <FormLabel title="Loan Clients" required />
        <Controller
          name="loan_client_id"
          control={control}
          rules={{ required: 'Loan Client is required' }}
          render={({ field }) => (
            <ReactSelect
              options={optionsClient}
              placeholder="Select a Client..."
              onChange={(selected) => field.onChange(selected ? Number(selected.value) : 0)}
              value={optionsClient.find(o => String(o.value) === String(field.value)) || null}
              isLoading={optionsClient.length === 0}
              loadingMessage={() => "Loading clients..."}
              noOptionsMessage={() => "No clients found"}
            />
          )}
        />
        {errors.loan_client_id && (
          <p className="mt-1 text-sm text-red-500">{errors.loan_client_id.message}</p>
        )}
      </div>

      <div className="mb-4">
        <FormLabel title="Loan Types" required />
        <Controller
          name="loan_type_id"
          control={control}
          rules={{ required: 'Loan Type is required' }}
          render={({ field }) => (
            <ReactSelect
              options={optionsType}
              placeholder="Select a Loan Type..."
              onChange={(selected) => field.onChange(selected ? Number(selected.value) : 0)}
              value={optionsType.find(o => String(o.value) === String(field.value)) || null}
              isLoading={optionsType.length === 0}
              loadingMessage={() => "Loading loan types..."}
              noOptionsMessage={() => "No loan types found"}
            />
          )}
        />
        {errors.loan_type_id && (
          <p className="mt-1 text-sm text-red-500">{errors.loan_type_id.message}</p>
        )}
      </div>

      <FormInput
        label="Code"
        id="code"
        type="text"
        icon={Home}
        register={register('code', { required: 'Code is required' })}
        error={errors.code?.message}
      />

      <FormInput
        label="Description"
        id="description"
        type="text"
        icon={Home}
        register={register('description', { required: 'Description is required' })}
        error={errors.description?.message}
      />

      <div className="flex justify-end gap-4.5 mt-6">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
        >
          Cancel
        </button>
        <button
          className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${loanCodeLoading ? 'opacity-70' : ''}`}
          type="submit"
          disabled={loanCodeLoading}
        >
          {loanCodeLoading ? (
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
    </form>
  );
};

export default FormAddLoanCode;
