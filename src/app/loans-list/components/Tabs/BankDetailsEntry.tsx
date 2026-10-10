import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EyeOff, Eye, CreditCard, Save } from 'react-feather';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import { LoanBankFormValues, BorrLoanRowData } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import useLoans from '@/hooks/useLoans';
import useBank from '@/hooks/useBank';
import { useStableLoading } from '@/hooks/useStableLoading';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { LoadingSpinner } from '@/components/LoadingStates';
import Button from '@/components/Button';
import moment from 'moment';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  handleRefetchData: () => void;
  // handleApproveRelease: (status: number) => void;
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const BankDetailsEntry: React.FC<OMProps> = ({ handleRefetchData, loanSingleData }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<LoanBankFormValues>();

  const [bankOptions1, setBankOptions1] = useState<Option[]>([]);
  const [bankOptions2, setBankOptions2] = useState<Option[]>([]);
  const { submitPNSigned, onSubmitLoanBankDetails, loading } = useLoans();
  const showLoadingOverlay = useStableLoading(loading);
  const { dataBank, loading: banksLoading } = useBank();
  const [showPin1, setShowPin1] = useState(false);
  const [showPin2, setShowPin2] = useState(false);

  const toggleShowPin1 = () => {
    setShowPin1(!showPin1);
  };

  const toggleShowPin2 = () => {
    setShowPin2(!showPin2);
  };

  const isCashBank = (bankId: number | string | undefined) => {
    if (!bankId || !dataBank) return false;
    const bank = dataBank.find(b => String(b.id) === String(bankId));
    return bank?.name?.toLowerCase().includes('cash') || false;
  };

  // Check if bank is NONE or N/A (case-insensitive)
  const isNoneOrNaBank = (bankId: number | string | undefined) => {
    if (!bankId || !dataBank) return false;
    const bank = dataBank.find(b => String(b.id) === String(bankId));
    const name = bank?.name?.toUpperCase() || '';
    return name === 'NONE' || name === 'N/A';
  };

  // Combined check: skip validation for Cash, NONE, or N/A banks
  const isSkipValidationBank = (bankId: number | string | undefined) => {
    return isCashBank(bankId) || isNoneOrNaBank(bankId);
  };

  // Clean card number: remove dashes and spaces
  const cleanCardNumber = (value: string) => value.replace(/[-\s]/g, '');

  // Watch both bank selections to detect when special bank is selected
  const surrenderedBankId = watch('surrendered_bank_id');
  const issuedBankId = watch('issued_bank_id');

  // Check if each bank should skip validation (Cash, NONE, or N/A)
  const isSurrenderedSkip = isSkipValidationBank(surrenderedBankId);
  const isIssuedSkip = isSkipValidationBank(issuedBankId);

  const onSubmit: SubmitHandler<LoanBankFormValues> = async (data) => {
    // Clean card numbers before submitting (remove dashes and spaces)
    const cleanedData = {
      ...data,
      surrendered_acct_no: cleanCardNumber(data.surrendered_acct_no || ''),
      issued_acct_no: cleanCardNumber(data.issued_acct_no || ''),
    };
    onSubmitLoanBankDetails(cleanedData, handleRefetchData);
  };

  const handleLoanBank = (data: LoanBankFormValues | undefined) => {
    // submitPNSigned(data, handleRefetchData);
  }

  useEffect(() => {
    if (dataBank) {
      const dynaOpt: Option[] = dataBank.map(item => ({
        value: String(item.id),
        label: item.name, // assuming `name` is the key you want to use as label
      }));
      setBankOptions1([
        ...dynaOpt,
      ]);
      setBankOptions2([
        ...dynaOpt,
      ]);
    }
  }, [dataBank])

  // Where an unsaved Step 3 got its starting values, shown under Account Name so staff check them.
  const [prefillNote, setPrefillNote] = useState<string | null>(null);
  const prefilledFor = useRef<string | null>(null);

  /**
   * Unsaved Step 3 only, once per loan: a repeat borrower starts from their previous loan's
   * name, banks and card numbers (same banks 87% of the time); a first loan starts from the
   * borrower's name, FIRST LAST in caps (91% of saved names are the borrower). PINs are never
   * pre-filled. Everything stays editable.
   */
  const prefillUnsaved = useCallback((loan: BorrLoanRowData) => {
    if (prefilledFor.current === loan.id) return;
    prefilledFor.current = loan.id;
    const prev = loan.previous_bank_details;
    if (prev) {
      if (prev.account_name) setValue('account_name', prev.account_name);
      if (prev.surrendered_bank_id) setValue('surrendered_bank_id', Number(prev.surrendered_bank_id));
      if (prev.issued_bank_id) setValue('issued_bank_id', Number(prev.issued_bank_id));
      if (prev.surrendered_acct_no) setValue('surrendered_acct_no', prev.surrendered_acct_no);
      if (prev.issued_acct_no) setValue('issued_acct_no', prev.issued_acct_no);
      setPrefillNote(`Filled in from loan ${prev.loan_ref ?? 'before this one'}. Check it against the card, then enter the PINs.`);
      return;
    }
    const name = [loan.borrower?.firstname, loan.borrower?.lastname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().toUpperCase();
    if (name) {
      setValue('account_name', name);
      setPrefillNote("Filled in with the borrower's name. Change it if the card is in someone else's name.");
    }
  }, [setValue]);

  useEffect(() => {
    if (loanSingleData) {
      setValue('loan_id', Number(loanSingleData?.id));
      if (!loanSingleData.loan_bank_details) {
        prefillUnsaved(loanSingleData);
      } else {
        setPrefillNote(null);
        // CRITICAL FIX: Add id field to enable UPDATE instead of CREATE
        setValue('id', loanSingleData?.loan_bank_details?.id);
        setValue('account_name', loanSingleData?.loan_bank_details?.account_name);
        setValue('issued_acct_no', loanSingleData?.loan_bank_details?.issued_acct_no);
        setValue('issued_bank_id', loanSingleData?.loan_bank_details?.issued_bank_id);
        setValue('issued_pin', loanSingleData?.loan_bank_details?.issued_pin);
        setValue('loan_id', loanSingleData?.loan_bank_details?.loan_id);
        setValue('surrendered_acct_no', loanSingleData?.loan_bank_details?.surrendered_acct_no);
        setValue('surrendered_bank_id', loanSingleData?.loan_bank_details?.surrendered_bank_id);
        setValue('surrendered_pin', loanSingleData?.loan_bank_details?.surrendered_pin);
      }
    }
    console.log(loanSingleData?.status, ' loanSingleData?.status')
  }, [loanSingleData, setValue, prefillUnsaved]);

  // Smart value management for surrendered bank details
  useEffect(() => {
    if (isSurrenderedSkip) {
      // Auto-fill with "000000" for Cash, NONE, or N/A banks
      setValue('surrendered_acct_no', '000000');
      setValue('surrendered_pin', '000000');
    } else {
      // When switching from skip bank to regular bank, clear ONLY "000000" placeholder
      // Preserve real account numbers if switching between regular banks
      const currentAcctNo = watch('surrendered_acct_no');
      const currentPin = watch('surrendered_pin');

      if (currentAcctNo === '000000') {
        setValue('surrendered_acct_no', '');
      }
      if (currentPin === '000000') {
        setValue('surrendered_pin', '');
      }
    }
  }, [surrenderedBankId, isSurrenderedSkip, setValue, watch]);

  // Smart value management for issued bank details
  useEffect(() => {
    if (isIssuedSkip) {
      // Auto-fill with "000000" for Cash, NONE, or N/A banks
      setValue('issued_acct_no', '000000');
      setValue('issued_pin', '000000');
    } else {
      // When switching from skip bank to regular bank, clear ONLY "000000" placeholder
      // Preserve real account numbers if switching between regular banks
      const currentAcctNo = watch('issued_acct_no');
      const currentPin = watch('issued_pin');

      if (currentAcctNo === '000000') {
        setValue('issued_acct_no', '');
      }
      if (currentPin === '000000') {
        setValue('issued_pin', '');
      }
    }
  }, [issuedBankId, isIssuedSkip, setValue, watch]);

  return (
    <div className="w-full max-w-3xl relative" data-testid="bank-details-entry-section">
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-50 flex items-center justify-center rounded-lg" data-testid="bank-details-loading-overlay">
          <LoadingSpinner size="lg" message="Saving bank details..." />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} >
      <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4">
        <div>
          <label htmlFor="account_name" className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Account Name</label>
          {/* autoComplete off: next to the PIN password boxes, browsers took this for a login
              username and filled staff emails (admin@gmail.com) in here. */}
          <input
            type="text"
            id="account_name"
            autoComplete="off"
            aria-describedby={prefillNote ? 'account_name_note' : undefined}
            className="h-12 md:h-11 w-full sm:w-72 rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
            placeholder="Card Account Name"
            {...register('account_name', { required: "Account name is required!" })}
          />
          {prefillNote && <p id="account_name_note" className="mt-1.5 text-xs text-body dark:text-bodydark">{prefillNote}</p>}
          {errors.account_name && <p className="mt-2 text-sm text-danger">{errors.account_name.message}</p>}
        </div>
        {loanSingleData?.loan_bank_details?.updated_at && (
          <div className="text-base font-semibold text-body dark:text-bodydark px-1">
            Last saved: {moment(loanSingleData.loan_bank_details.updated_at).format('LLL')}
          </div>
        )}
        <div className="flow-root border border-stroke dark:border-strokedark py-3 shadow-sm bg-white dark:bg-boxdark">
          <dl className="-my-3 divide-y divide-stroke dark:divide-strokedark text-sm">
            {/* Column titles from sm up; on phones each field carries its own caption instead. */}
            <div className="hidden gap-4 p-3 sm:grid sm:grid-cols-3 bg-whiten dark:bg-meta-4 text-black dark:text-white">
              <dt className="font-medium text-left text-black dark:text-bodydark dark:text-white"></dt>
              <dt className="font-medium text-center text-black dark:text-bodydark dark:text-white">ATM Surrender</dt>
              <dd className="text-black dark:text-bodydark text-center">ATM Issued</dd>
            </div>
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-left sm:text-right text-black dark:text-bodydark sm:leading-9">
                Bank:
              </dt>
              <dd className="text-black dark:text-white text-left">
                <span aria-hidden="true" className="mb-1 block text-left text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark sm:hidden">ATM Surrender</span>
                <div className="">
                  <Controller
                    name="surrendered_bank_id"
                    control={control}
                    rules={{ required: 'Surrendered Bank is required' }}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        aria-label="ATM Surrender bank"
                        options={bankOptions1}
                        placeholder="Select a Bank..."
                        isLoading={banksLoading}
                        loadingMessage={() => 'Loading banks...'}
                        noOptionsMessage={() => banksLoading ? 'Loading banks...' : 'No banks available'}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.value);
                        }}
                        value={bankOptions1.find(option => String(option.value) === String(field.value)) || null}
                      />
                    )}
                  />
                  {errors.surrendered_bank_id && <p className="mt-2 text-sm text-danger">{errors.surrendered_bank_id.message}</p>}
                </div>
              </dd>
              <dt className="font-medium text-left text-black dark:text-bodydark">
                <span aria-hidden="true" className="mb-1 block text-left text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark sm:hidden">ATM Issued</span>
                <div className="">
                  <Controller
                    name="issued_bank_id"
                    control={control}
                    rules={{ required: 'Issued Bank is required' }}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        aria-label="ATM Issued bank"
                        options={bankOptions2}
                        placeholder="Select a Bank..."
                        isLoading={banksLoading}
                        loadingMessage={() => 'Loading banks...'}
                        noOptionsMessage={() => banksLoading ? 'Loading banks...' : 'No banks available'}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.value);
                        }}
                        value={bankOptions2.find(option => String(option.value) === String(field.value)) || null}
                      />
                    )}
                  />
                  {errors.issued_bank_id && <p className="mt-2 text-sm text-danger">{errors.issued_bank_id.message}</p>}
                </div>
              </dt>
            </div>
            {/* Account/Card Number Row - Hidden when skip validation bank is selected */}
            {(!isSurrenderedSkip || !isIssuedSkip) && (
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-left sm:text-right text-black dark:text-white sm:leading-9">
                  Account / Card No.:
                </dt>
                {!isSurrenderedSkip && (
                  <dd className="text-black dark:text-white text-center">
                    <span aria-hidden="true" className="mb-1 block text-left text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark sm:hidden">ATM Surrender</span>
                    <div className="relative">
                      <Controller
                        name="surrendered_acct_no"
                        control={control}
                        rules={{ required: "Surrendered Card is required!" }}
                        render={({ field }) => (
                          <input
                            className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 pr-10 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                            type="text"
                            id="surrendered_acct_no"
                            autoComplete="off"
                            placeholder="000000"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        )}
                      />
                      <span className="absolute right-3 top-3.5 md:top-3 pointer-events-none">
                        <CreditCard size="18" />
                      </span>
                      {errors.surrendered_acct_no && <p className="mt-2 text-sm text-danger">{errors.surrendered_acct_no.message}</p>}
                    </div>
                  </dd>
                )}
                {isSurrenderedSkip && <dd className="text-black dark:text-white text-center"></dd>}
                {!isIssuedSkip && (
                  <dt className="font-medium text-center text-black dark:text-white">
                    <span aria-hidden="true" className="mb-1 block text-left text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark sm:hidden">ATM Issued</span>
                    <div className="relative">
                      <Controller
                        name="issued_acct_no"
                        control={control}
                        rules={{ required: "Issued Card No. is required!" }}
                        render={({ field }) => (
                          <input
                            className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 pr-10 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                            type="text"
                            id="issued_acct_no"
                            autoComplete="off"
                            placeholder="000000"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        )}
                      />
                      <span className="absolute right-3 top-3.5 md:top-3 pointer-events-none">
                        <CreditCard size="18" />
                      </span>
                      {errors.issued_acct_no && <p className="mt-2 text-sm text-danger">{errors.issued_acct_no.message}</p>}
                    </div>
                  </dt>
                )}
                {isIssuedSkip && <dt className="font-medium text-center text-black dark:text-white"></dt>}
              </div>
            )}
            {/* PIN Row - Hidden when skip validation bank is selected */}
            {(!isSurrenderedSkip || !isIssuedSkip) && (
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-left sm:text-right text-black dark:text-white sm:leading-9">
                  PIN.:
                </dt>
                {!isSurrenderedSkip && (
                  <dd className="text-black dark:text-white text-center">
                    <span aria-hidden="true" className="mb-1 block text-left text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark sm:hidden">ATM Surrender</span>
                    <div className="relative">
                      <input
                        type={showPin1 ? 'text' : 'password'}
                        className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 pr-10 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                        placeholder="000000"
                        autoComplete="new-password"
                        {...register('surrendered_pin', { required: "Surrendered Pin. is required!" })}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-2"
                        onClick={toggleShowPin1}
                        aria-label={showPin1 ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showPin1 ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.surrendered_pin && <p className="mt-2 text-sm text-danger">{errors.surrendered_pin.message}</p>}
                  </dd>
                )}
                {isSurrenderedSkip && <dd className="text-black dark:text-white text-center relative"></dd>}
                {!isIssuedSkip && (
                  <dt className="font-medium text-center text-black dark:text-white">
                    <span aria-hidden="true" className="mb-1 block text-left text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark sm:hidden">ATM Issued</span>
                    <div className="relative">
                      <input
                        type={showPin2 ? 'text' : 'password'}
                        className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 pr-10 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                        placeholder="000000"
                        autoComplete="new-password"
                        {...register('issued_pin', { required: "Issued Pin. is required!" })}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-2"
                        onClick={toggleShowPin2}
                        aria-label={showPin2 ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showPin2 ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.issued_pin && <p className="mt-2 text-sm text-danger">{errors.issued_pin.message}</p>}
                  </dt>
                )}
                {isIssuedSkip && <dt className="font-medium text-center text-black dark:text-white relative"></dt>}
              </div>
            )}
          </dl>

        </div>
        <div>
        <Button
          variant="primary"
          className="float-right"
          type="submit"
          disabled={loanSingleData?.status === 1 ? false : true}
        >
          <Save size={17} />
          <span>Save and Submit for Releasing</span>
        </Button>
        </div>
      </div>
      </form>
    </div>
  )
}

export default BankDetailsEntry;
