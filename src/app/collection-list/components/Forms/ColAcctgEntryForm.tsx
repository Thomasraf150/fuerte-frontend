"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Trash2, Save, RotateCw, Check } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useCoa from '@/hooks/useCoa';
import { DataChartOfAccountList, DataColEntries, DataRowLoanPayments } from '@/utils/DataTypes';
import useCollectionList from '@/hooks/useCollectionList';
import { showConfirmationModal } from '@/components/ConfirmationModal';
interface ParentFormBr {
  dataColEntry: DataRowLoanPayments[];
  coaDataAccount: DataChartOfAccountList[];
  fetchCollectionList: (a: number, b: number, c: number) => void;
  setShowForm: (b: boolean) => void;
}

const ColAcctgEntryForm: React.FC<ParentFormBr> = ({ dataColEntry, coaDataAccount, fetchCollectionList, setShowForm }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<DataColEntries>();
  const { postCollectionEntries, collectionLoading } = useCollectionList();
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
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
    
    const optionsCoaData = getAccountOptions(coaDataAccount ?? []);
  

  useEffect(() => {
    
  }, [dataColEntry])

  const onSubmit: SubmitHandler<DataColEntries> = async (data) => {
    // console.log(data, 'data');
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes it is!',
    );
    if (isConfirmed) {
      const result = await postCollectionEntries(dataColEntry, data);
      
      // Only close form and refetch on successful submission
      if (result.success) {
        setIsSuccess(true);
        // Small delay to ensure user sees the success state
        await new Promise(resolve => setTimeout(resolve, 800));
        fetchCollectionList(2000, 1, 0);
        setShowForm(false);
      }
      // Form stays open on errors for user to fix and retry
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-1">
        <div className='mt-2 col-span-2 w-100'>
          <label
              className={`block text-sm font-medium text-black dark:text-white mr-2 mb-2`}
          >
            Interest Income
          </label>
          <Controller
            control={control}
            name="interest_income" // Registering field dynamically
            render={({ field }) => {
              return (
                <ReactSelect
                  {...field}
                  options={optionsCoaData}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                  value={field.value ? optionsCoaData.find(opt => opt.value === String(field.value)) || null : null}
                  placeholder="Select Account"
                />
              );
            }}
          />
        </div>
        <div className='mt-2 col-span-2 w-100'>
          <label
              className={`block text-sm font-medium text-black dark:text-white mr-2 mb-2`}
          >
            Bank Charge
          </label>
          <Controller
            control={control}
            name="bank_charge" // Registering field dynamically
            render={({ field }) => {
              return (
                <ReactSelect
                  {...field}
                  options={optionsCoaData}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                  value={field.value ? optionsCoaData.find(opt => opt.value === String(field.value)) || null : null}
                  placeholder="Select Account"
                />
              );
            }}
          />
        </div>
        <div className='mt-2 col-span-2 w-100'>
          <label
              className={`block text-sm font-medium text-black dark:text-white mb-2`}
          >
            Penalty
          </label>
          <Controller
            control={control}
            name="penalty" // Registering field dynamically
            render={({ field }) => {
              return (
                <ReactSelect
                  {...field}
                  options={optionsCoaData}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                  value={field.value ? optionsCoaData.find(opt => opt.value === String(field.value)) || null : null}
                  placeholder="Select Account"
                />
              );
            }}
          />
        </div>

        
      </div>

      <div className="flex justify-end gap-4.5 mt-4">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false); }}
        >
          Cancel
        </button>
        <button
          className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${(collectionLoading || isSuccess) ? 'opacity-70' : ''}`}
          type="submit"
          disabled={collectionLoading || isSuccess}
        >
          {collectionLoading ? (
            <>
              <RotateCw size={17} className="animate-spin mr-1" />
              <span>Posting...</span>
            </>
          ) : isSuccess ? (
            <>
              <Check size={17} className="mr-1" />
              <span>Posted!</span>
            </>
          ) : (
            <>
              <Save size={17} className="mr-1" />
              <span>Post</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ColAcctgEntryForm;