"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, CheckSquare } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useLoanProceedAccount from '@/hooks/useLoanProceedAccount';
import { DataChartOfAccountList, DataSubBranches, DataLoanProceedList, DataLoanProceedAcctData, BorrLoanRowData } from '@/utils/DataTypes';

interface ParentFormBr {
  branchSubData: DataSubBranches[] | undefined;
  // lpsSingleData: DataLoanProceedAcctData[] | undefined;
  coaDataAccount: DataChartOfAccountList[];
  loanSingleData: BorrLoanRowData | undefined;
  setShowAcctgEntry: (b: boolean) => void;
  handleRefetchData: () => void;
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const AcctgEntryForm: React.FC<ParentFormBr> = ({ coaDataAccount, branchSubData, loanSingleData, setShowAcctgEntry, handleRefetchData }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<DataLoanProceedList>();
  const { onSubmitLoanProSettings } = useLoanProceedAccount();
  const [branchSubIdDisabled, setBranchSubIdDisabled] = useState<boolean>(false);

  useEffect(() => {
    setValue('loan_ref', String(loanSingleData?.loan_ref));
    setValue('branch_sub_id', String(loanSingleData?.user?.branch_sub_id));
  }, [loanSingleData])

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
    
  }, [coaDataAccount, setValue, branchSubData])

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
        value: account?.number?.toString(),
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
    onSubmitLoanProSettings(data, handleRefetchData);
    console.log(data, 'data');
    // fetchCoaDataTable();
    // setShowForm(false);
    setShowAcctgEntry(false);
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
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
                isDisabled={!!branchSubIdDisabled}
              />
            )}
          />
          {errors.branch_sub_id && <p className="mt-2 text-sm text-red-600">{errors.branch_sub_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Notes Receivale</label>
          <Controller
            name="nr_id"
            control={control}
            rules={{ required: 'Notes Receivale is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a NR..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.nr_id && <p className="mt-2 text-sm text-red-600">{errors.nr_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Outstanding Balance</label>
          <Controller
            name="ob_id"
            control={control}
            rules={{ required: 'Outstanding Balance is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a OB..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.ob_id && <p className="mt-2 text-sm text-red-600">{errors.ob_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>UDI</label>
          <Controller
            name="udi_id"
            control={control}
            rules={{ required: 'UDI is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a UDI..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.udi_id && <p className="mt-2 text-sm text-red-600">{errors.udi_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Processing</label>
          <Controller
            name="proc_id"
            control={control}
            rules={{ required: 'Processing is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Processing..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.proc_id && <p className="mt-2 text-sm text-red-600">{errors.proc_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Insurance</label>
          <Controller
            name="ins_id"
            control={control}
            rules={{ required: 'Insurance is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Insurance..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.ins_id && <p className="mt-2 text-sm text-red-600">{errors.ins_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Collection</label>
          <Controller
            name="col_id"
            control={control}
            rules={{ required: 'Collection is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Collection..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.col_id && <p className="mt-2 text-sm text-red-600">{errors.col_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Notarial</label>
          <Controller
            name="not_id"
            control={control}
            rules={{ required: 'Notarial is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Notarial..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.not_id && <p className="mt-2 text-sm text-red-600">{errors.not_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Rebates</label>
          <Controller
            name="reb_id"
            control={control}
            rules={{ required: 'Rebates is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Rebates..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.reb_id && <p className="mt-2 text-sm text-red-600">{errors.reb_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Agent Fee</label>
          <Controller
            name="agent_id"
            control={control}
            rules={{ required: 'Agent Fee is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Agent Fee..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.agent_id && <p className="mt-2 text-sm text-red-600">{errors.agent_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Penalty</label>
          <Controller
            name="pen_id"
            control={control}
            rules={{ required: 'Penalty is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Penalty..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.pen_id && <p className="mt-2 text-sm text-red-600">{errors.pen_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Addon Amount</label>
          <Controller
            name="addon_id"
            control={control}
            rules={{ required: 'Addon Amount is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Addon Amount..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.addon_id && <p className="mt-2 text-sm text-red-600">{errors.addon_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Addon UDI</label>
          <Controller
            name="addon_udi_id"
            control={control}
            rules={{ required: 'Addon UDI is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Addon UDI..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.addon_udi_id && <p className="mt-2 text-sm text-red-600">{errors.addon_udi_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Cash in Bank</label>
          <Controller
            name="cib_id"
            control={control}
            rules={{ required: 'Cash in Bank is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Cash in Bank..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.cib_id && <p className="mt-2 text-sm text-red-600">{errors.cib_id.message}</p>}
        </div>

      </div>

      <div className="w-full flex justify-end mt-6">
        <div className="flex gap-4">
          <button
            className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
            type="submit"
          >
            <span className="mt-1 mr-1">
              <CheckSquare size={17} /> 
            </span>
            Post
          </button>
        </div>
      </div>
    </form>
  );
};

export default AcctgEntryForm;