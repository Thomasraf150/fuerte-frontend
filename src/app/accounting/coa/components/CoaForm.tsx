"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, Save, RotateCw } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useCoa from '@/hooks/useCoa';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchCoaDataTable: () => void;
  actionLbl: string;
  coaDataAccount: DataChartOfAccountList[];
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const LoanProcSettingsForm: React.FC<ParentFormBr> = ({ setShowForm, fetchCoaDataTable, actionLbl, coaDataAccount }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<DataChartOfAccountList>();
  const { onSubmitCoa, branchSubData, coaLoading } = useCoa();

  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

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
        value: account?.id?.toString(),
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
    if (branchSubData && Array.isArray(branchSubData)) {
      const dynaOpt: Option[] = branchSubData?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubBranch([
        { value: '', label: 'Select a Sub Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }

    console.log(coaDataAccount, ' initialData');
  }, [coaDataAccount, setValue, actionLbl, branchSubData])

  const [selectedPlacement, setSelectedPlacement] = useState<string>("");

  const handleChangePlacement = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPlacement(event.target.value);
  };


  const onSubmit: SubmitHandler<DataChartOfAccountList> = async (data) => {
    const result = await onSubmitCoa(data);

    // Only close form on successful submission
    if (result.success) {
      fetchCoaDataTable();
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3">
        <FormLabel title={`Branch`}/>
        <Controller
          name="branch_sub_id"
          control={control}
          rules={{ required: 'Branch is required' }} 
          render={({ field }) => (
            <ReactSelect
              {...field}
              options={optionsSubBranch}
              placeholder="Select a branch..."
              onChange={(selectedOption) => {
                field.onChange(selectedOption?.value);
              }}
              value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
              isLoading={!branchSubData || optionsSubBranch.length <= 1}
              loadingMessage={() => "Loading branches..."}
            />
          )}
        />
        {errors.branch_sub_id && <p className="mt-2 text-sm text-red-600">{errors.branch_sub_id.message}</p>}
      </div>

      {/* <FormInput
        label="Branch Sub"
        id="branch_sub_id"
        type="select"
        icon={ChevronDown}
        register={register('branch_sub_id')}
        error={errors.branch_sub_id?.message}
        options={optionsSubBranch}
        className='mb-4'
      /> */}

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
        formatType="number"
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
          className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${coaLoading ? 'opacity-70' : ''}`}
          type="submit"
          disabled={coaLoading}
        >
          {coaLoading ? (
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

export default LoanProcSettingsForm;