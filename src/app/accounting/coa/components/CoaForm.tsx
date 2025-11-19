"use client"
import React, { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, Edit3, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
interface CoaFormProps {
  setShowForm: (value: boolean) => void;
  fetchCoaDataTable: () => void;
  actionLbl: string;
  coaDataAccount: DataChartOfAccountList[];
  selectedAccount?: DataChartOfAccountList | null;
  branchSubData: DataSubBranches[] | undefined;
  onSubmitCoa: SubmitHandler<DataChartOfAccountList>;
  coaLoading: boolean;
  onClose?: () => void; // Consistent close handler with logging
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const CoaForm: React.FC<CoaFormProps> = ({
  setShowForm,
  fetchCoaDataTable,
  actionLbl,
  coaDataAccount,
  selectedAccount,
  branchSubData,
  onSubmitCoa,
  coaLoading,
  onClose
}) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataChartOfAccountList>();

  const [selectedPlacement, setSelectedPlacement] = useState<string>("");

  // Memoized branch options - only recalculates when branchSubData changes
  const optionsSubBranch = useMemo(() => {
    if (!branchSubData || !Array.isArray(branchSubData)) {
      return [{ value: '', label: 'Select a Sub Branch', hidden: true }];
    }

    const dynaOpt: Option[] = branchSubData.map(bSub => ({
      value: String(bSub.id),
      label: bSub.name,
    }));

    return [
      { value: '', label: 'Select a Sub Branch', hidden: true },
      ...dynaOpt,
    ];
  }, [branchSubData])

  // Memoized parent account options - flattens tree into select options
  const flattenedAccountOptions = useMemo(() => {
    const flattenAccountsToOptions = (
      accounts: DataChartOfAccountList[],
      level: number = 1
    ): { label: string; value: string }[] => {
      let options: { label: string; value: string }[] = [];
      accounts.forEach((account) => {
        options.push({
          label: `${'—'.repeat(level - 1)} ${account.account_name}`,
          value: account?.id?.toString(),
        });
        if (account.subAccounts) {
          options = options.concat(flattenAccountsToOptions(account.subAccounts, level + 1));
        }
      });
      return options;
    };

    const flattenedOptions = flattenAccountsToOptions(coaDataAccount || []);
    return [{ label: "Select a Parent account", value: "" }, ...flattenedOptions];
  }, [coaDataAccount]);

  // Populate form when editing an existing account
  useEffect(() => {
    if (selectedAccount) {
      // Populate all form fields with selectedAccount data
      setValue('id', selectedAccount.id);
      setValue('account_name', selectedAccount.account_name);
      setValue('description', selectedAccount.description || '');
      // Handle null branch for root/general accounts (branch is optional)
      setValue('branch_sub_id', selectedAccount.branch_sub_id ? String(selectedAccount.branch_sub_id) : '');
      setValue('balance', selectedAccount.balance || '0');
      setValue('is_debit', selectedAccount.is_debit);
      setValue('parent_account_id', selectedAccount.parent_account_id ? String(selectedAccount.parent_account_id) : '');
      setSelectedPlacement(selectedAccount.is_debit || '');
    } else {
      // Reset form when creating new account
      reset();
      setSelectedPlacement('');
    }
  }, [selectedAccount, setValue, reset]);

  const handleChangePlacement = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPlacement(event.target.value);
  };


  const onSubmit: SubmitHandler<DataChartOfAccountList> = async (data) => {
    const result = await onSubmitCoa(data) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result && typeof result === 'object' && 'success' in result && result.success) {
      // Use onClose if provided (includes logging), otherwise fallback to setShowForm
      onClose ? onClose() : setShowForm(false);
      fetchCoaDataTable();        // Refresh table in background (non-blocking)
    }
    // Form stays open on errors for user to fix and retry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Branch"
        id="branch_sub_id"
        type="select"
        icon={ChevronDown}
        register={register('branch_sub_id')}
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
        required={true}
      />

      <div className="space-y-2 mt-4">
        <label
              className={`block text-sm font-medium text-black dark:text-white mr-2`}
        >
          Placement
          <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>
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
            <span className="text-gray-700 dark:text-gray-300">Debit</span>
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
            <span className="text-gray-700 dark:text-gray-300">Credit</span>
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
        required={true}
      />

      <FormInput
        label="Balance"
        id="balance"
        type="text"
        icon={Edit3}
        formatType="number"
        register={register('balance')}
        error={errors.balance?.message}
        className='mt-2'
      />

      <FormInput
        label="Parent Account"
        id="parent_account_id"
        type="select"
        icon={ChevronDown}
        register={register('parent_account_id')}
        error={errors.parent_account_id?.message}
        options={flattenedAccountOptions}
        className='mb-4 mt-4'
      />

      <div className="flex justify-end gap-4.5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { onClose ? onClose() : setShowForm(false) }}
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

export default React.memo(CoaForm);