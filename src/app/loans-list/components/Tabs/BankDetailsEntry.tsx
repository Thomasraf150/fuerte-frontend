import React, { useEffect, useState } from 'react';
import { EyeOff, Eye, CreditCard, Save } from 'react-feather';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import { LoanBankFormValues, BorrLoanRowData } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import useLoans from '@/hooks/useLoans';
import useBank from '@/hooks/useBank';
import { showConfirmationModal } from '@/components/ConfirmationModal';

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
  const { submitPNSigned, onSubmitLoanBankDetails } = useLoans();
  const { dataBank } = useBank();
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

  // Watch both bank selections to detect when "Cash on hand" is selected
  const surrenderedBankId = watch('surrendered_bank_id');
  const issuedBankId = watch('issued_bank_id');

  // Check if each bank is cash (independently)
  const isSurrenderedCash = isCashBank(surrenderedBankId);
  const isIssuedCash = isCashBank(issuedBankId);

  const onSubmit: SubmitHandler<LoanBankFormValues> = async (data) => {
    onSubmitLoanBankDetails(data, handleRefetchData);
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

  useEffect(() => {
    if (loanSingleData) {
      setValue('loan_id', Number(loanSingleData?.id));
      if (loanSingleData?.loan_bank_details) {
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
  }, [loanSingleData, setValue]);

  // Auto-fill surrendered account/PIN with "000000" when "Cash on hand" is selected
  useEffect(() => {
    if (isSurrenderedCash) {
      setValue('surrendered_acct_no', '000000');
      setValue('surrendered_pin', '000000');
    }
  }, [surrenderedBankId, isSurrenderedCash, setValue]);

  // Auto-fill issued account/PIN with "000000" when "Cash on hand" is selected
  useEffect(() => {
    if (isIssuedCash) {
      setValue('issued_acct_no', '000000');
      setValue('issued_pin', '000000');
    }
  }, [issuedBankId, isIssuedCash, setValue]);

  return (
    <div className="w-1/2">
      <form onSubmit={handleSubmit(onSubmit)} >
      <div className="grid grid-cols-2 gap-3 p-3 lg:grid-cols-1 sm:grid-cols-3 sm:gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">Account Name</h3>
          <input
            type="text"
            className="block w-60 p-2 mb-2 border border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
            placeholder="Card Account Name"
            {...register('account_name', { required: "Account name is required!" })}
          />
          {errors.account_name && <p className="mt-2 text-sm text-red-600">{errors.account_name.message}</p>}
        </div>
        <div className="flow-root border border-gray-100 py-3 shadow-sm">
          <dl className="-my-3 divide-y divide-gray-100 text-sm">
            <div className="grid grid-cols-2 gap-1 p-3 lg:grid-cols-3 sm:grid-cols-3 sm:gap-4 bg-boxdark-2 text-lime-100">
              <dt className="font-medium text-left text-gray-900"></dt>
              <dt className="font-medium text-center text-gray-900">ATM Surrender</dt>
              <dd className="text-gray-700 text-center">ATM Issued</dd>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-right text-gray-900 leading-9">
                Bank:
              </dt>
              <dd className="text-gray-700 text-left">
                <div className="">
                  <Controller
                    name="surrendered_bank_id"
                    control={control}
                    rules={{ required: 'Surrendered Bank is required' }} 
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        options={bankOptions1}
                        placeholder="Select a Bank..."
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.value);
                        }}
                        value={bankOptions1.find(option => String(option.value) === String(field.value)) || null}
                      />
                    )}
                  />
                  {errors.surrendered_bank_id && <p className="mt-2 text-sm text-red-600">{errors.surrendered_bank_id.message}</p>}
                </div>
              </dd>
              <dt className="font-medium text-left text-gray-900">
                <div className="">
                  <Controller
                    name="issued_bank_id"
                    control={control}
                    rules={{ required: 'Issued Bank is required' }} 
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        options={bankOptions2}
                        placeholder="Select a Bank..."
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.value);
                        }}
                        value={bankOptions2.find(option => String(option.value) === String(field.value)) || null}
                      />
                    )}
                  />
                  {errors.issued_bank_id && <p className="mt-2 text-sm text-red-600">{errors.issued_bank_id.message}</p>}
                </div>
              </dt>
            </div>
            {/* Account/Card Number Row - Hidden when cash is selected */}
            {(!isSurrenderedCash || !isIssuedCash) && (
              <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-right text-gray-900 leading-9">
                  Account / Card No.:
                </dt>
                {!isSurrenderedCash && (
                  <dd className="text-gray-700 text-center">
                    <div className="relative">
                      <input
                        className={`block p-2 border border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                        type="text"
                        id="surrendered_acct_no"
                        placeholder="Card Account No."
                        {...register('surrendered_acct_no', { required: "Surrendered Card is required!" })}
                      />
                      <span className="absolute right-3 top-2.5">
                        <CreditCard size="18" />
                      </span>
                      {errors.surrendered_acct_no && <p className="mt-2 text-sm text-red-600">{errors.surrendered_acct_no.message}</p>}
                    </div>
                  </dd>
                )}
                {isSurrenderedCash && <dd className="text-gray-700 text-center"></dd>}
                {!isIssuedCash && (
                  <dt className="font-medium text-center text-gray-900">
                    <div className="relative">
                      <input
                        className={`block p-2 border border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                        type="text"
                        id="issued_acct_no"
                        placeholder="Card Account No."
                        {...register('issued_acct_no', { required: "Issued Card No. is required!" })}
                      />
                      <span className="absolute right-3 top-2.5">
                        <CreditCard size="18" />
                      </span>
                      {errors.issued_acct_no && <p className="mt-2 text-sm text-red-600">{errors.issued_acct_no.message}</p>}
                    </div>
                  </dt>
                )}
                {isIssuedCash && <dt className="font-medium text-center text-gray-900"></dt>}
              </div>
            )}
            {/* PIN Row - Hidden when cash is selected */}
            {(!isSurrenderedCash || !isIssuedCash) && (
              <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-right text-gray-900 leading-9">
                  PIN.:
                </dt>
                {!isSurrenderedCash && (
                  <dd className="text-gray-700 text-center relative">
                    <input
                      type={showPin1 ? 'text' : 'password'}
                      className="block p-2 border border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      placeholder="Account PIN"
                      {...register('surrendered_pin', { required: "Surrendered Pin. is required!" })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-2"
                      onClick={toggleShowPin1}
                    >
                      {showPin1 ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </dd>
                )}
                {isSurrenderedCash && <dd className="text-gray-700 text-center relative"></dd>}
                {!isIssuedCash && (
                  <dt className="font-medium text-center text-gray-900 relative">
                    <input
                      type={showPin2 ? 'text' : 'password'}
                      className="block p-2 border border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      placeholder="Account PIN"
                      {...register('issued_pin', { required: "Issued Pin. is required!" })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-2"
                      onClick={toggleShowPin2}
                    >
                      {showPin2 ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </dt>
                )}
                {isIssuedCash && <dt className="font-medium text-center text-gray-900 relative"></dt>}
              </div>
            )}
          </dl>

        </div>
        <div>
        <button
          className="bg-purple-700 flex justify-between float-right items-center text-white py-2 px-4 rounded hover:bg-purple-800 text-sm"
          type="submit"
          disabled={loanSingleData?.status === 1 ? false : true}
        >
          <span className="mt-1 mr-1">
            <Save size={17} /> 
          </span>
          <span>Save and Submit for Releasing</span>
        </button>
        </div>
      </div>
      </form>
    </div>
  )
}

export default BankDetailsEntry;
