"use client"
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Layout, Save, RotateCw } from 'react-feather';
import PesoSign from '@/components/PesoSign';
import FormInput from '@/components/FormInput';
import { BorrowerRowInfo, BorrLoanFormValues, DataSubBranches, DataRenewalData, SelectOption } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import ReactSelect from '@/components/ReactSelect';
import AsyncReactSelect from '@/components/ReactSelect/AsyncReactSelect';
import FormLoanComputation from './FormLoanComputation';
import RenewalAmntForm from './RenewalAmntForm';
import useLoans from '@/hooks/useLoans';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { toast } from "react-toastify";

interface ParentFormBr {
  createLoans: (value: boolean) => void;
  singleData: BorrowerRowInfo | undefined;
  dataBranchSub: DataSubBranches[] | undefined;
  myAccessibleBranchSubs: DataSubBranches[] | undefined;
  loadingMyAccessibleBranches: boolean;
  dataLoanRenewal: string[] | [];
  dataComputedRenewal: DataRenewalData | undefined;
}

const FormLoans: React.FC<ParentFormBr> = ({ createLoans, singleData: BorrowerData, dataBranchSub: _dataBranchSub, myAccessibleBranchSubs, loadingMyAccessibleBranches, dataLoanRenewal, dataComputedRenewal }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors }, control } = useForm<BorrLoanFormValues>();
  const { dataComputedLoans, onSubmitLoanComp, loanProduct, loading, searchLoanProducts } = useLoans();

  // State to track which action was triggered (compute vs save)
  const [actionType, setActionType] = useState<'compute' | 'save' | null>(null);


  // Safety utility to ensure numeric values are clean (backup for edge cases)
  const ensureNumericString = (value: any): string => {
    if (value === null || value === undefined) return "0.00";
    const cleanValue = String(value).replace(/[^0-9.-]/g, '');
    return cleanValue || "0.00";
  };

  // Standard React Hook Form pattern (following BorrowerDetails.tsx)
  const onSubmit = (data: BorrLoanFormValues, submitActionType?: 'compute' | 'save') => {
    // Basic validation for required fields
    if (!data.branch_sub_id || !data.loan_product_id) {
      toast.error("Please select branch and loan product");
      return;
    }

    if (!data.loan_amount || Number(data.loan_amount) <= 0) {
      toast.error("Please enter a valid loan amount");
      return;
    }

    // Handle undefined borrower_id for new borrowers
    const borrowerId = BorrowerData?.id ? Number(BorrowerData.id) : 0;
    if (borrowerId === 0) {
      toast.error("Please save borrower information first");
      return;
    }

    // Use passed action type or fallback to state
    const currentActionType = submitActionType || actionType;

    // Clean data (React Hook Form provides clean values automatically)
    const cleanData = {
      'borrower_id': borrowerId,
      'loan_amount': ensureNumericString(data.loan_amount),
      'branch_sub_id': String(data.branch_sub_id),
      'loan_product_id': String(data.loan_product_id),
      'ob': ensureNumericString(data.ob),
      'penalty': ensureNumericString(data.penalty),
      'rebates': ensureNumericString(data.rebates),
      'renewal_loan_id': dataLoanRenewal?.join(','),
      'renewal_details': watch('renewal_details')// Array.isArray(dataComputedRenewal) ? dataComputedRenewal : []
    };

    if (currentActionType === 'compute') {
      setShowComputation(true);
      onSubmitLoanComp(cleanData, "Compute");
    } else if (currentActionType === 'save') {
      handleSaveWithConfirmation(cleanData);
    }

    // Reset action type
    setActionType(null);
  };

  // Separate save handler for better organization
  const handleSaveWithConfirmation = async (cleanData: any) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes Save it!',
    );
    if (isConfirmed) {
      const success = await onSubmitLoanComp(cleanData, "Create");
      if (success) {
        createLoans(false);  // Only close form on success
      }
      // Form stays open on errors for user to fix and retry
    }
  };

  
  const handleCompTblDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    // Value is already formatted to 2 decimals by FormInput currency formatType
    setValue(type, value);

    // Defer submission to next event loop tick to allow React Hook Form state to update
    setTimeout(() => {
      handleSubmit((data) => onSubmit(data, 'compute'))();
    }, 0);
  };


  const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
  const [loanProdOptions, setLoanProdOptions] = useState<SelectOption[]>([]);
  const [showComputation, setShowComputation] = useState<boolean>(false);
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<SelectOption | null>(null);

  useEffect(() => {
    // Show user's accessible branches directly (not filtered by borrower's area)
    if (loadingMyAccessibleBranches || myAccessibleBranchSubs === undefined) {
      setBranchOptions([{ value: '', label: 'Loading branches...', hidden: true }]);
      return;
    }

    if (myAccessibleBranchSubs && Array.isArray(myAccessibleBranchSubs) && myAccessibleBranchSubs.length > 0) {
      const dynaOpt: SelectOption[] = myAccessibleBranchSubs.map(branch => ({
        value: String(branch.id),
        label: branch.name,
      }));
      setBranchOptions([
        { value: '', label: 'Select a Branch...', hidden: true },
        ...dynaOpt,
      ]);
    } else {
      setBranchOptions([{ value: '', label: 'No accessible branches', hidden: true }]);
    }
  }, [myAccessibleBranchSubs, loadingMyAccessibleBranches]);
  
  useEffect(() => {
    if (loanProduct && Array.isArray(loanProduct)) {
      const dynaOpt: SelectOption[] = loanProduct.map(dLCodes => ({
        value: String(dLCodes.id),
        label: dLCodes.description,
      }));
      setLoanProdOptions([
        { value: '', label: 'Select a Loan Product...', hidden: true },
        ...dynaOpt,
      ]);
    } else {
      setLoanProdOptions([{ value: '', label: 'No loan products available', hidden: true }]);
    }
  }, [loanProduct]);
  
  const setRenewalDetails = (details: any) => {
    setValue('renewal_details', details);
  }

  return (

    <div className="max-w-8xl mx-auto m-4">
      <div className="bg-black border-b mb-3 border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-whiter dark:text-white">
          Create Loans
        </h3>
      </div>
      <div className="max-w-full px-0 z-999999">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 m-5">
        <div className="border-2 border-emerald-200 p-3 sm:p-4"> {/* column 1 */}
          <form onSubmit={handleSubmit((data) => onSubmit(data))} >
            {/* Renewal Form */}
            {dataLoanRenewal.length > 0 && <RenewalAmntForm renewalIDs={dataLoanRenewal} setValue={setValue} watch={watch} dataComputedRenewal={dataComputedRenewal} loading={loading} fnGetRenewalDetails={setRenewalDetails} />}
            <div className="mb-3">
              <FormLabel title={`Branch`}/>
              <Controller
                name="branch_sub_id"
                control={control}
                rules={{ required: 'Branch is required' }} 
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    options={branchOptions}
                    placeholder="Select a branch..."
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption?.value);
                    }}
                    value={branchOptions.find(option => String(option.value) === String(field.value)) || null}
                    isLoading={loadingMyAccessibleBranches}
                    loadingMessage={() => "Loading accessible branches..."}
                  />
                )}
              />
              {errors.branch_sub_id && <p className="mt-2 text-sm text-red-600">{errors.branch_sub_id.message}</p>}
            </div>
            <div className="mb-3">
              <FormLabel title={`Loan Product`}/>
              <Controller
                name="loan_product_id"
                control={control}
                rules={{ required: 'Loan Product is required' }}
                render={({ field }) => (
                  <AsyncReactSelect
                    loadOptions={searchLoanProducts}
                    defaultOptions={loanProdOptions}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    placeholder="Type to search loan products..."
                    onChange={(selectedOption) => {
                      setSelectedLoanProduct(selectedOption);
                      field.onChange(selectedOption?.value);
                    }}
                    value={selectedLoanProduct || loanProdOptions.find(option => String(option.value) === String(field.value)) || null}
                    isLoading={loading || !loanProduct || loanProdOptions.length <= 1}
                    loadingMessage={() => "Searching loan products..."}
                    noOptionsMessage={({ inputValue }) =>
                      inputValue.length < 2
                        ? "Type at least 2 characters to search..."
                        : "No loan products found"
                    }
                    cacheOptions
                  />
                )}
              />
              {errors.loan_product_id && <p className="mt-2 text-sm text-red-600">{errors.loan_product_id.message}</p>}
            </div>
            <FormInput
              label="Loan Amount"
              id="loan_amount"
              type="text"
              icon={PesoSign}
              register={register('loan_amount', { required: "Loan Amount is required!" })}
              error={errors.loan_amount?.message}
              formatType="number"
            />

            <div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
                <button
                  className="flex justify-center items-center rounded border border-stroke px-4 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white w-full sm:w-auto"
                  type="button"
                  onClick={()=>{ createLoans(false) }}
                >
                  Back
                </button>
                <button
                  className="flex justify-center items-center rounded bg-primary px-4 py-2 font-medium text-gray hover:bg-opacity-90 w-full sm:w-auto"
                  type="button"
                  onClick={() => {
                    handleSubmit((data) => onSubmit(data, 'compute'))();
                  }}
                >
                  <span className="mr-1">
                    <Layout size={17} />
                  </span>
                  <span>Compute</span>
                </button>
                <button
                  className="flex justify-center items-center rounded bg-yellow-400 px-4 py-2 font-medium text-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    handleSubmit((data) => onSubmit(data, 'save'))();
                  }}
                >
                  {loading ? (
                    <>
                      <RotateCw size={17} className="animate-spin mr-1" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-1">
                        <Save size={17} />
                      </span>
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            </form>
          </div>

          {showComputation && (
            <div className={`${showComputation ? 'fade-in' : 'fade-out'}`}>
              <FormLoanComputation setValue={setValue} register={register} watch={watch} handleCompTblDecimal={handleCompTblDecimal} dataComputedLoans={dataComputedLoans} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FormLoans;