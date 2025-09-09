"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useCoa from '@/hooks/useCoa';
import useLoanProceedAccount from '@/hooks/useLoanProceedAccount';
import { DataChartOfAccountList, DataSubBranches, DataLoanProceedList, DataLoanProceedAcctData } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  actionLbl: string;
  branchSubData: DataSubBranches[] | undefined;
  lpsSingleData: DataLoanProceedAcctData[] | undefined;
  coaDataAccount: DataChartOfAccountList[];
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const LoanProcSettingsForm: React.FC<ParentFormBr> = ({ setShowForm, actionLbl, coaDataAccount, branchSubData, lpsSingleData }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<DataLoanProceedList>();
  const { onSubmitLoanProSettings } = useLoanProceedAccount();
  const [branchSubIdDisabled, setBranchSubIdDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (actionLbl === 'Create Account') {
      reset();
    } else {
      setBranchSubIdDisabled(true);
      lpsSingleData?.map(item => {
        if (item?.description === 'notes receivable') {
          setValue('branch_sub_id', item?.branch_sub_id);
          setValue('nr_id', item?.account_id);
        }
        if (item?.description === 'outstanding balance') {
          setValue('ob_id', item?.account_id);
        }
        if (item?.description === 'udi') {
          setValue('udi_id', item?.account_id);
        }
        if (item?.description === 'processing') {
          setValue('proc_id', item?.account_id);
        }
        if (item?.description === 'insurance') {
          setValue('ins_id', item?.account_id);
        }
        if (item?.description === 'insurance mfee') {
          setValue('ins_mfee_id', item?.account_id);
        }
        if (item?.description === 'collection') {
          setValue('col_id', item?.account_id);
        }
        if (item?.description === 'notarial') {
          setValue('not_id', item?.account_id);
        }
        if (item?.description === 'rebates') {
          setValue('reb_id', item?.account_id);
        }
        if (item?.description === 'penalty') {
          setValue('pen_id', item?.account_id);
        }
        if (item?.description === 'addon amount') {
          setValue('addon_id', item?.account_id);
        }
        if (item?.description === 'addon udi') {
          setValue('addon_udi_id', item?.account_id);
        }
        if (item?.description === 'cash in bank') {
          setValue('cib_id', item?.account_id);
        }
      });
    }
  }, [lpsSingleData, actionLbl])

  useEffect(()=>{
    console.log(coaDataAccount, 'coaData');
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

    console.log(coaDataAccount, ' coaDataAccount');
  }, [coaDataAccount, setValue, actionLbl, branchSubData])

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

  const onSubmit: SubmitHandler<DataLoanProceedList> = data => {
    // onSubmitLoanProSettings(data);
    console.log(data, 'data');
    // fetchCoaDataTable();
    // setShowForm(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 mb-4 mt-4">
        <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Branch</label>
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
                isDisabled={!!branchSubIdDisabled}
              />
            )}
          />
          {errors.branch_sub_id && <p className="mt-2 text-sm text-red-600">{errors.branch_sub_id.message}</p>}
        </div>
        
        {/* <FormInput
          label="Description"
          id="description"
          type="text"
          icon={Edit3}
          register={register('description', { required: true })}
          error={errors.description && "Description is required"}
          className='mt-4 mb-4'
        /> */}

        <FormInput
          label="Notes Receivale"
          id="nr_id"
          type="select"
          icon={ChevronDown}
          register={register('nr_id')}
          error={errors.nr_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />

        <FormInput
          label="Outstanding Balance"
          id="ob_id"
          type="select"
          icon={ChevronDown}
          register={register('ob_id')}
          error={errors.ob_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />

        <FormInput
          label="UDI"
          id="udi_id"
          type="select"
          icon={ChevronDown}
          register={register('udi_id')}
          error={errors.udi_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />

        <FormInput
          label="Processing"
          id="proc_id"
          type="select"
          icon={ChevronDown}
          register={register('proc_id')}
          error={errors.proc_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />

        <FormInput
          label="Insurance"
          id="ins_id"
          type="select"
          icon={ChevronDown}
          register={register('ins_id')}
          error={errors.ins_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />
        
        <FormInput
          label="Insurance Mfee"
          id="ins_mfee_id"
          type="select"
          icon={ChevronDown}
          register={register('ins_mfee_id')}
          error={errors.ins_mfee_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />

        <FormInput
          label="Collection Fee"
          id="col_id"
          type="select"
          icon={ChevronDown}
          register={register('col_id')}
          error={errors.col_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />
        
        <FormInput
          label="Notarial"
          id="not_id"
          type="select"
          icon={ChevronDown}
          register={register('not_id')}
          error={errors.not_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />
        
        <FormInput
          label="Rebates"
          id="reb_id"
          type="select"
          icon={ChevronDown}
          register={register('reb_id')}
          error={errors.reb_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />
        
        <FormInput
          label="Penalty"
          id="pen_id"
          type="select"
          icon={ChevronDown}
          register={register('pen_id')}
          error={errors.pen_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />
        
        <FormInput
          label="Addon Amount"
          id="addon_id"
          type="select"
          icon={ChevronDown}
          register={register('addon_id')}
          error={errors.addon_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />
        
        <FormInput
          label="Addon UDI"
          id="addon_udi_id"
          type="select"
          icon={ChevronDown}
          register={register('addon_udi_id')}
          error={errors.addon_udi_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />

        <FormInput
          label="Cash in Bank"
          id="cib_id"
          type="select"
          icon={ChevronDown}
          register={register('cib_id')}
          error={errors.cib_id?.message}
          options={optionsCoaData}
          className='mb-4 mt-4'
        />
      </div>

      <div className="w-full flex justify-end mt-6">
        <div className="flex gap-4">
          <button
            className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
            type="button"
            onClick={() => { setShowForm(false) }}
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
    </form>
  );
};

export default LoanProcSettingsForm;