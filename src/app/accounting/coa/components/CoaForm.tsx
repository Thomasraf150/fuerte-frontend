"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useCoa from '@/hooks/useCoa';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchCoaDataTable: () => void;
  actionLbl: string;
  coaDataAccount: DataChartOfAccountList[];
}

interface OptionSubBranch {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const CoaForm: React.FC<ParentFormBr> = ({ setShowForm, fetchCoaDataTable, actionLbl, coaDataAccount }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataChartOfAccountList>();
  const { onSubmitCoa, branchSubData } = useCoa();

  const [optionsSubBranch, setOptionsSubBranch] = useState<OptionSubBranch[]>([]);

  const flattenAccountsToOptions = (
    accounts: DataChartOfAccountList[],
    level: number = 1
  ): { label: string; value: string }[] => {
    // Initialize an empty array for options
    let options: { label: string; value: string }[] = [];
  
    accounts.forEach((account) => {
      // Add the current account with indentation based on level
      options.push({
        label: `${'—'.repeat(level - 1)} ${account.account_name}`,
        value: account.id.toString(),
      });
  
      // Recursively process sub-accounts
      if (account.subAccounts) {
        options = options.concat(flattenAccountsToOptions(account.subAccounts, level + 1));
      }
    });
  
    return options;
  };

  // Add the default empty option only once at the top
  const getAccountOptions = (accounts: DataChartOfAccountList[]): { label: string; value: string }[] => {
    const flattenedOptions = flattenAccountsToOptions(accounts);
    return [{ label: "Select a Parent account", value: "" }, ...flattenedOptions];
  };

  const optionsCoaData = getAccountOptions(coaDataAccount);

  useEffect(()=>{
    console.log(coaDataAccount, 'coaData');
    if (branchSubData && Array.isArray(branchSubData)) {
      const dynaOpt: OptionSubBranch[] = branchSubData?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubBranch([
        { value: '', label: 'Select a Sub Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }

    if (coaDataAccount) {
      if (actionLbl === 'Update Coa') {
        // setValue('id', initialData.id ?? '')
        // setValue('branch_sub_id', initialData.branch_sub_id)
        // setValue('name', initialData.name)
        // setValue('description', initialData.description)
      } else {
        // reset({
        //   id: '',
        //   branch_sub_id: 0,
        //   name: '',
        //   description: ''
        // });
      }
    }

    console.log(coaDataAccount, ' initialData');
  }, [coaDataAccount, setValue, actionLbl, branchSubData])

  const [selectedPlacement, setSelectedPlacement] = useState<string>("");

  const handleChangePlacement = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPlacement(event.target.value);
  };


  const onSubmit: SubmitHandler<DataChartOfAccountList> = data => {
    onSubmitCoa(data);
    fetchCoaDataTable();
    console.log(data, ' oowa');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Branch Sub"
        id="branch_sub_id"
        type="select"
        icon={ChevronDown}
        register={register('branch_sub_id', { required: 'Branch Sub is required' })}
        error={errors.branch_sub_id?.message}
        options={optionsSubBranch}
        className='mb-4'
      />

      <FormInput
        label="Account Name"
        id="account_name"
        type="text"
        icon={Edit3}
        register={register('account_name', { required: true })}
        error={errors.account_name && "Account name is required"}
      />

      <div className="space-y-2 mt-4">
        <label
              className={`block text-sm font-medium text-black dark:text-white mr-2`}
        >
          Placement
        </label>
        <div className="flex items-center space-x-6">
          
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              {...register("is_debit", { required: "Please select Placement" })}
              value="1"
              checked={selectedPlacement === "1"}
              onChange={handleChangePlacement}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Debit</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="radio"
              {...register("is_debit", { required: "Please select Placement" })}
              name="option"
              value="0"
              checked={selectedPlacement === "0"}
              onChange={handleChangePlacement}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Credit</span>
          </label>
        </div>
        {errors && <p className="mt-2 text-sm text-red-600">{errors.is_debit && "Placement is required!"}</p>}
      </div>
      
      <FormInput
        label="Description"
        id="description"
        type="text"
        icon={Edit3}
        register={register('description', { required: true })}
        error={errors.description && "Description is required"}
        className='mt-2'
      />

      <FormInput
        label="Balance"
        id="balance"
        type="text"
        icon={Edit3}
        register={register('balance', { required: true })}
        error={errors.balance && "Balance is required"}
        className='mt-2'
      />

      <FormInput
        label="Parent Account"
        id="parent_account_id"
        type="select"
        icon={ChevronDown}
        register={register('parent_account_id')}
        error={errors.parent_account_id?.message}
        options={optionsCoaData}
        className='mb-4 mt-4'
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

export default CoaForm;