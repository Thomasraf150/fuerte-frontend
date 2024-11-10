"use client"
import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { DollarSign, Layout, Save } from 'react-feather';
import FormInput from '@/components/FormInput';
import { BorrowerRowInfo, DataRowLoanProducts, BorrLoanFormValues, BorrLoanComputationValues, DataSubBranches, BorrLoanRowData } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import ReactSelect from '@/components/ReactSelect';
import FormLoanComputation from './FormLoanComputation';
import useLoans from '@/hooks/useLoans';
import { showConfirmationModal } from '@/components/ConfirmationModal';

interface ParentFormBr {
  createLoans: (value: boolean) => void;
  singleData: BorrowerRowInfo | undefined;
  dataBranchSub: DataSubBranches[] | undefined;
  dataLoanRenewal: BorrLoanRowData | undefined;
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const FormLoans: React.FC<ParentFormBr> = ({ createLoans, singleData: BorrowerData, dataBranchSub, dataLoanRenewal }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<BorrLoanFormValues>();
  const { dataComputedLoans, onSubmitLoanComp, loanProduct } = useLoans();

  const dataLoanComp = {
    'borrower_id': Number(BorrowerData?.id),
    'loan_proceeds': watch('loan_proceeds'),
    'branch_sub_id': String(watch('branch_sub_id')),
    'loan_product_id': String(watch('loan_product_id')),
    'ob': String(watch('ob') ?? "0.00"),
    'penalty': String(watch('penalty') ?? "0.00"),
    'rebates': String(watch('rebates') ?? "0.00"),
    'renewal_loan_id': String(dataLoanRenewal?.id)
  };

  const onSubmit: SubmitHandler<BorrLoanFormValues> = async (data) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes Save it!',
    );
    if (isConfirmed) {
      onSubmitLoanComp(dataLoanComp, "Create");
    }
  };

  const handleDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    const formattedValue = formatToTwoDecimalPlaces(value);
    setValue(type, formattedValue);
  };
  
  const handleCompTblDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    const formattedValue = formatToTwoDecimalPlaces(value);
    setValue(type, formattedValue);

    onSubmitLoanComp(dataLoanComp, "Compute");
  };

  const formatToTwoDecimalPlaces = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toFixed(2);
    }
    return '';
  };

  const [branchOptions, setBranchOptions] = useState<Option[]>([]);
  const [loanProdOptions, setLoanProdOptions] = useState<Option[]>([]);
  const [showComputation, setShowComputation] = useState<boolean>(false);

  useEffect(() => {
    if (dataBranchSub && Array.isArray(dataBranchSub)) {
      const dynaOpt: Option[] = dataBranchSub.map(dLCodes => ({
        value: String(dLCodes.id),
        label: dLCodes.name, // assuming `name` is the key you want to use as label
      }));
      setBranchOptions([
        ...dynaOpt,
      ]);
    }
  }, [dataBranchSub]);
  
  useEffect(() => {
    if (loanProduct && Array.isArray(loanProduct)) {
      const dynaOpt: Option[] = loanProduct.map(dLCodes => ({
        value: String(dLCodes.id),
        label: dLCodes.description, // assuming `name` is the key you want to use as label
      }));
      setLoanProdOptions([
        ...dynaOpt,
      ]);
    }
  }, [loanProduct, errors]);

  const handleComputeLoan = () => {
    setShowComputation(true);
    onSubmitLoanComp(dataLoanComp, "Compute");
  }

  return (

    <div className="max-w-8xl mx-auto m-4">
      <div className="bg-black border-b mb-3 border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-whiter dark:text-white">
          Create Loans
        </h3>
      </div>
      <div className="max-w-6xl px-0 z-999999">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4 m-5">
        <div className="border-2 border-emerald-200 p-4"> {/* column 1 */}
          <form onSubmit={handleSubmit(onSubmit)} >
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
                  <ReactSelect
                    {...field}
                    options={loanProdOptions}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    placeholder="Select a Loan Product..."
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption?.value);
                    }}
                    value={loanProdOptions.find(option => String(option.value) === String(field.value)) || null}
                  />
                )}
              />
              {errors.loan_product_id && <p className="mt-2 text-sm text-red-600">{errors.loan_product_id.message}</p>}
            </div>
            <div>
              <FormLabel title={`Loan Proceeds`}/>
              <div className="relative">
                <input
                  className={`w-full h-10 text-sm border border-stroke py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary`}
                  type="text"
                  id="loan_proceeds"
                  {...register('loan_proceeds', { required: "Loan Proceeds is required!" })}
                  onBlur={(e: any) => { return handleDecimal(e, 'loan_proceeds'); }}
                />
                <span className="absolute left-4.5 top-3">
                  <DollarSign size="18" />
                </span>
                {errors.loan_proceeds && <p className="mt-2 text-sm text-red-600">{errors.loan_proceeds.message}</p>}
              </div>
            </div>

            <div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="flex justify-center rounded border border-stroke px-4 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                  type="button"
                  onClick={()=>{ createLoans(false) }}
                >
                  Back
                </button>
                <button
                  className="flex justify-center rounded bg-primary px-4 py-2 font-medium text-gray hover:bg-opacity-90"
                  type="button"
                  onClick={handleComputeLoan}
                >
                  <span className="mt-1 mr-1">
                    <Layout size={17} /> 
                  </span>
                  <span>Compute</span>
                </button>
                <button
                  className="flex justify-center rounded bg-yellow-400 px-4 py-2 font-medium text-black hover:bg-opacity-90"
                  type="submit"
                >
                  <span className="mt-1 mr-1">
                    <Save size={17} /> 
                  </span>
                  <span>Save</span>
                </button>
              </div>
            </div>

            </form>
          </div>

          {showComputation && (
            <div className={`${showComputation ? 'fade-in' : 'fade-out'}`}>
              <FormLoanComputation setValue={setValue} register={register} handleCompTblDecimal={handleCompTblDecimal} dataComputedLoans={dataComputedLoans} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FormLoans;