"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useLoanCodes from '@/hooks/useLoanCodes';
import { DataFormLoanCodes, DataRowClientList, DataRowLoanCodes } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchLoanCodes: (value: string) => void;
  actionLbl: string;
  singleUserData: DataRowLoanCodes | undefined;
  // dataClients: DataRowClientList | undefined;
}

interface OptionClient {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

interface OptionType {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const FormAddLoanCode: React.FC<ParentFormBr> = ({ setShowForm, actionLbl, singleUserData, fetchLoanCodes }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<DataFormLoanCodes>();
  const { onSubmitLoanCode, dataClients, dataType } = useLoanCodes();
  const [optionsClient, setOptionsClient] = useState<OptionClient[]>([
    { value: '', label: 'Select a Client', hidden: true },
  ]);
  const [optionsType, setOptionsType] = useState<OptionType[]>([
    { value: '', label: 'Select a Loan Type', hidden: true },
  ]);

  const onSubmit: SubmitHandler<DataFormLoanCodes> = data => {
    onSubmitLoanCode(data);
    setShowForm(false);
    fetchLoanCodes('id_desc');
  };

  useEffect(() => {
    if (dataClients && Array.isArray(dataClients)) {
      const dynaOpt: OptionClient[] = dataClients?.map(dClients => ({
        value: String(dClients.id),
        label: dClients.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsClient([
        { value: '', label: 'Select a Client', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
    if (dataType && Array.isArray(dataType)) {
      const dynaOpt: OptionType[] = dataType?.map(dType => ({
        value: String(dType.id),
        label: dType.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsType([
        { value: '', label: 'Select a Loan Type', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
    if (actionLbl === 'Create Loan Code') {
      reset({
        loan_client_id: 0,
        loan_type_id: 0,
        code: '',
        description: '',
      });
    } else {
      if (singleUserData) {
        setValue('id', singleUserData.id);
        setValue('loan_client_id', singleUserData.loan_client_id);
        setValue('loan_type_id', singleUserData.loan_type_id);
        setValue('code', singleUserData.code);
        setValue('description', singleUserData.description);
      }
    }
  }, [dataClients, dataType, actionLbl, singleUserData, reset, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Loan Clients"
        id="loan_client_id"
        type="select"
        icon={ChevronDown}
        register={register('loan_client_id', { required: 'Loan Clients is required' })}
        error={errors.loan_client_id?.message}
        options={optionsClient}
      />

      <FormInput
        label="Loan Types"
        id="loan_type_id"
        type="select"
        icon={ChevronDown}
        register={register('loan_type_id', { required: 'Loan Types is required' })}
        error={errors.loan_type_id?.message}
        options={optionsType}
      />

      <FormInput
        label="Code"
        id="name"
        type="text"
        icon={Home}
        register={register('code', { required: true })}
        error={errors.code && "This field is required"}
      />

      <FormInput
        label="Description"
        id="name"
        type="text"
        icon={Home}
        register={register('description', { required: true })}
        error={errors.description && "This field is required"}
      />

      <div className="flex justify-end gap-4.5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
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

export default FormAddLoanCode;