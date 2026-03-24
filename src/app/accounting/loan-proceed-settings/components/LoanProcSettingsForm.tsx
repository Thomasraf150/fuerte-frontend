"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, Save, RotateCw } from 'react-feather';
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
  onSaveSuccess?: () => void;
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const LoanProcSettingsForm: React.FC<ParentFormBr> = ({ setShowForm, actionLbl, coaDataAccount, branchSubData, lpsSingleData, onSaveSuccess }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<DataLoanProceedList>();
  const { onSubmitLoanProSettings, loanProcLoading } = useLoanProceedAccount();
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
        if (item?.description === 'agent fee') {
          setValue('agent_id', item?.account_id);
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
        if (item?.description === 'addon total') {
          setValue('addon_total_id', item?.account_id);
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
        { value: '', label: 'Select a Sub Branch', hidden: true },
        { value: 'global', label: '*** Global Defaults ***' },
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
      // Skip inactive accounts from dropdown options
      if (!account.is_active) return;

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

  const onSubmit: SubmitHandler<DataLoanProceedList> = async (data) => {
    const result = await onSubmitLoanProSettings(data, () => {});

    if (result.success) {
      onSaveSuccess?.();
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
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
        
        {[
          { name: 'nr_id' as const, label: 'Notes Receivable' },
          { name: 'ob_id' as const, label: 'Outstanding Balance' },
          { name: 'udi_id' as const, label: 'UDI' },
          { name: 'proc_id' as const, label: 'Processing' },
          { name: 'ins_id' as const, label: 'Insurance' },
          { name: 'ins_mfee_id' as const, label: 'Insurance Mfee' },
          { name: 'col_id' as const, label: 'Collection Fee' },
          { name: 'not_id' as const, label: 'Notarial' },
          { name: 'reb_id' as const, label: 'Rebates' },
          { name: 'agent_id' as const, label: 'Agent Fee' },
          { name: 'pen_id' as const, label: 'Penalty' },
          { name: 'addon_id' as const, label: 'Addon Amount' },
          { name: 'addon_udi_id' as const, label: 'Addon UDI' },
          { name: 'addon_total_id' as const, label: 'Addon Total' },
          { name: 'cib_id' as const, label: 'Cash in Bank' },
        ].map(({ name, label }) => (
          <div key={name} className="col-span-1 mb-4 mt-4">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">{label} <span style={{ color: '#ef4444' }}>*</span></label>
            <Controller
              name={name}
              control={control}
              rules={{ required: `${label} is required` }}
              render={({ field }) => (
                <ReactSelect
                  {...field}
                  options={optionsCoaData}
                  placeholder={`Select a ${label}...`}
                  onChange={(selectedOption: any) => field.onChange(selectedOption?.value)}
                  value={optionsCoaData.find(opt => String(opt.value) === String(field.value)) || null}
                  isLoading={!coaDataAccount}
                />
              )}
            />
            {errors[name] && <p className="mt-2 text-sm text-red-600">{errors[name]?.message}</p>}
          </div>
        ))}
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
            className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${loanProcLoading ? 'opacity-70' : ''}`}
            type="submit"
            disabled={loanProcLoading}
          >
            {loanProcLoading ? (
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
    </form>
  );
};

export default LoanProcSettingsForm;