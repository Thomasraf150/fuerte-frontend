"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, CheckSquare, RotateCw, RefreshCw } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useLoanProceedAccount from '@/hooks/useLoanProceedAccount';
import { DataChartOfAccountList, DataSubBranches, DataLoanProceedList, DataLoanProceedAcctData, BorrLoanRowData } from '@/utils/DataTypes';

interface ParentFormBr {
  branchSubData: DataSubBranches[] | undefined;
  coaDataAccount: DataChartOfAccountList[];
  loanSingleData: BorrLoanRowData | undefined;
  setShowAcctgEntry: (b: boolean) => void;
  handleRefetchData: () => void;
  lpsSingleData?: DataLoanProceedAcctData[];
  onAfterSave?: (handleRefetchData: () => void, accountOverrides?: Record<string, string>) => void;
  isRepostMode?: boolean;
  isReposting?: boolean;
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

// Maps LPS description → form field name
const descriptionToField: Record<string, keyof DataLoanProceedList> = {
  'notes receivable': 'nr_id',
  'outstanding balance': 'ob_id',
  'udi': 'udi_id',
  'processing': 'proc_id',
  'insurance': 'ins_id',
  'insurance mfee': 'ins_mfee_id',
  'collection': 'col_id',
  'notarial': 'not_id',
  'rebates': 'reb_id',
  'agent fee': 'agent_id',
  'penalty': 'pen_id',
  'addon amount': 'addon_id',
  'addon udi': 'addon_udi_id',
  'cash in bank': 'cib_id',
};

const AcctgEntryForm: React.FC<ParentFormBr> = ({ coaDataAccount, branchSubData, loanSingleData, setShowAcctgEntry, handleRefetchData, lpsSingleData, onAfterSave, isRepostMode, isReposting }) => {
  const { register, handleSubmit, setValue, reset, getValues, watch, formState: { errors, isDirty }, control } = useForm<DataLoanProceedList>();
  const { onSubmitLoanProSettings, loanProcLoading } = useLoanProceedAccount();
  const [branchSubIdDisabled, setBranchSubIdDisabled] = useState<boolean>(false);

  useEffect(() => {
    const branchSubId = loanSingleData?.branch_sub?.id ?? loanSingleData?.user?.branch_sub_id;
    setValue('loan_ref', String(loanSingleData?.loan_ref));
    setValue('branch_sub_id', String(branchSubId));
  }, [loanSingleData])

  // Build flat acctnumber → account_id map from COA tree
  const buildAcctnumberMap = (accounts: DataChartOfAccountList[]): Record<string, string> => {
    const map: Record<string, string> = {};
    const traverse = (accts: DataChartOfAccountList[]) => {
      accts.forEach(a => {
        if (a.number && a.id) map[String(a.number)] = String(a.id);
        if (a.subAccounts) traverse(a.subAccounts);
      });
    };
    traverse(accounts);
    return map;
  };

  // Pre-fill priority: 1) existing acctg entry, 2) localStorage overrides, 3) LPS defaults
  // Fields filled by higher-priority sources are NOT overwritten by lower-priority ones.
  useEffect(() => {
    const filledFields = new Set<string>();

    // 1) In re-post mode, pre-fill from the existing accounting entry's actual accounts
    if (isRepostMode && loanSingleData?.acctg_entry?.acctg_details && loanSingleData?.loan_details && coaDataAccount?.length > 0) {
      const acctgDetails = loanSingleData.acctg_entry.acctg_details;
      const loanDetails = loanSingleData.loan_details;
      const acctnumberToId = buildAcctnumberMap(coaDataAccount);

      const availableDetails = [...acctgDetails];

      loanDetails.forEach((ld: { description?: string; debit?: string; credit?: string }) => {
        const desc = ld.description?.toLowerCase()?.trim();
        if (!desc) return;
        const fieldKey = descriptionToField[desc];
        if (!fieldKey) return;

        const ldDebit = parseFloat(ld.debit || '0');
        const ldCredit = parseFloat(ld.credit || '0');
        if (ldDebit === 0 && ldCredit === 0) return;

        // Find matching acctg_detail by debit/credit amounts
        const matchIdx = availableDetails.findIndex(ad => {
          const adDebit = parseFloat(ad.debit || '0');
          const adCredit = parseFloat(ad.credit || '0');
          return Math.abs(adDebit - ldDebit) < 0.01 && Math.abs(adCredit - ldCredit) < 0.01;
        });

        if (matchIdx >= 0) {
          const match = availableDetails[matchIdx];
          availableDetails.splice(matchIdx, 1);
          const accountId = acctnumberToId[match.acctnumber];
          if (accountId) {
            setValue(fieldKey, accountId);
            filledFields.add(fieldKey);
          }
        }
      });
    }

    // 2) In re-post mode, try localStorage overrides for any remaining empty fields
    if (isRepostMode && loanSingleData?.id) {
      const fieldKeys = ['nr_id','ob_id','udi_id','proc_id','agent_id','ins_id','ins_mfee_id','col_id','not_id','reb_id','pen_id','addon_id','addon_udi_id','cib_id'] as const;
      try {
        const saved = localStorage.getItem(`lps_repost_${loanSingleData.id}`);
        if (saved) {
          const overrides = JSON.parse(saved) as Record<string, string>;
          fieldKeys.forEach(k => {
            if (overrides[k] && !filledFields.has(k)) {
              setValue(k, overrides[k]);
              filledFields.add(k);
            }
          });
        }
      } catch { /* invalid JSON, fall through to LPS */ }
    }

    // 3) Fill remaining empty fields from LPS defaults
    if (lpsSingleData && lpsSingleData.length > 0) {
      const seen = new Set<keyof DataLoanProceedList>();
      lpsSingleData.forEach((item) => {
        const key = descriptionToField[item.description?.toLowerCase()?.trim()];
        if (key && !seen.has(key) && !filledFields.has(key)) {
          seen.add(key);
          setValue(key, String(item.account?.id ?? item.account_id));
          filledFields.add(key);
        }
      });
    }

    if (filledFields.size > 0) {
      setTimeout(() => reset(getValues(), { keepDirty: false }), 50);
    }
  }, [lpsSingleData, loanSingleData?.acctg_entry])

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

  const onSubmit: SubmitHandler<DataLoanProceedList> = data => {
    const afterSave = onAfterSave ? onAfterSave : handleRefetchData;
    onSubmitLoanProSettings(data, afterSave as () => void);
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Notes Receivale <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Outstanding Balance <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>UDI <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Processing <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Insurance <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Insurance Manual Fee <span style={{ color: '#ef4444' }}>*</span></label>
          <Controller
            name="ins_mfee_id"
            control={control}
            rules={{ required: 'Insurance Mfee is required' }} 
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsCoaData}
                placeholder="Select a Insurance Mfee..."
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || "");
                }}
                value={optionsCoaData.find(option => String(option.value) === String(field.value)) || null}
              />
            )}
          />
          {errors.ins_mfee_id && <p className="mt-2 text-sm text-red-600">{errors.ins_mfee_id.message}</p>}
        </div>

        <div className="col-span-1 mb-4 mt-4">
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Collection <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Notarial <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Rebates <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Agent Fee <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Penalty <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Addon Amount <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Addon UDI <span style={{ color: '#ef4444' }}>*</span></label>
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
          <label className={`mb-3 block text-sm font-medium text-black dark:text-white`}>Cash in Bank <span style={{ color: '#ef4444' }}>*</span></label>
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
          {isRepostMode ? (
            <button
              className={`flex justify-center items-center gap-1 rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${(!isDirty || isReposting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="button"
              disabled={!isDirty || !!isReposting}
              onClick={() => {
                const vals = getValues();
                // Pass form values as one-time overrides directly — does NOT modify LPS defaults
                const overrides: Record<string, string> = {};
                const fieldKeys = ['nr_id','ob_id','udi_id','proc_id','agent_id','ins_id','ins_mfee_id','col_id','not_id','reb_id','pen_id','addon_id','addon_udi_id','cib_id'] as const;
                fieldKeys.forEach(k => { if (vals[k]) overrides[k] = String(vals[k]); });
                onAfterSave?.(handleRefetchData, overrides);
              }}
            >
              {isReposting ? <RotateCw size={17} className="animate-spin mr-1" /> : <RefreshCw size={17} className="mr-1" />}
              <span>{isReposting ? 'Re-posting...' : 'Re-post'}</span>
            </button>
          ) : (
            <button
              className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${loanProcLoading ? 'opacity-70' : ''}`}
              type="submit"
              disabled={loanProcLoading}
            >
              {loanProcLoading ? (
                <>
                  <RotateCw size={17} className="animate-spin mr-1" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <CheckSquare size={17} className="mr-1" />
                  <span>Post</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default AcctgEntryForm;