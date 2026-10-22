"use client"
import React, { useEffect, useMemo, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw, AlertCircle } from 'react-feather';
import { toast } from '@/utils/notify';
import FormInput from '@/components/FormInput';
import FormLabel from '@/components/FormLabel';
import ReactSelect from '@/components/ReactSelect';
import useUsers from '@/hooks/useUsers';
import { DataBranches, DataFormUser, User, DataRowLoanProducts, DataFormLoanProducts, DataRowLoanCodes, SelectOption } from '@/utils/DataTypes';
import { fetchAllLoanCodes } from '@/hooks/useLoanCodes';
import useLoanProducts from '@/hooks/useLoanProducts';
import Button from '@/components/Button';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchLoanProducts: (value: string) => void;
  actionLbl: string;
  singleData: DataRowLoanProducts | undefined;
}
interface OptionLoanCode {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const FormAddLoanProduct: React.FC<ParentFormBr> = ({ setShowForm, fetchLoanProducts, actionLbl, singleData }) => {
  const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm<DataFormLoanProducts>();
  const { onSubmitLoanProduct, loanProductLoading } = useLoanProducts();
  // Every live loan code, not the list page's newest 20 (582 on 2026-10-13): a product with an
  // older code opened blank, and most codes could not be picked at all.
  const [loanCodeData, setLoanCodeData] = useState<DataRowLoanCodes[]>();
  useEffect(() => {
    let live = true;
    fetchAllLoanCodes()
      .then((codes) => { if (live) setLoanCodeData(codes); })
      .catch((error) => {
        console.error('Loan Product form: the loan codes did not load', error);
        if (!live) return; // the form has closed: nobody to tell
        toast.error("The loan codes didn't load. Reload the page to try again.");
        setLoanCodeData([]);
      });
    return () => { live = false; };
  }, []);
  // The searchable select below reads its value from the form on every render, so the saved
  // code shows as soon as its option exists, whichever of the two arrives first (2026-10-13).
  const optionsClient = useMemo<SelectOption[]>(() => (loanCodeData ?? []).map(dLCodes => (
    { value: String(dLCodes.id), label: dLCodes.code + ' - ' + dLCodes.description }
  )), [loanCodeData]);
  const [selectedOptIsAuto, setSelectedOptIsAuto] = useState<string>();
  const [baseCompOptions, setBaseCompOptions] = useState<OptionLoanCode[]>([
    { value: '', label: 'Select Base Deduction', hidden: true },
    { value: '0', label: 'Loan Proceeds' },
    { value: '1', label: 'PN' },
  ]);
  // const [isAutoOptions, setIsAutoOptions] = useState<OptionLoanCode[]>([
  //   { value: '', label: 'Select Is Auto compute', hidden: true },
  //   { value: '0', label: 'Yes' },
  //   { value: '1', label: 'No' },
  // ]);

   // Watch the password field
  //  const password = watch('password', '');

  const onSubmit: SubmitHandler<DataFormLoanProducts> = async (data) => {
    const result = await onSubmitLoanProduct(data) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result.success) {
      setShowForm(false);
      fetchLoanProducts('id_desc');
    }
    // Form stays open on errors for user to fix and retry
  };

  const handleComputeUdi = () => {
    const interest_rate = String(watch('interest_rate')).replace(/,/g, '');
    const terms = String(watch('terms')).replace(/,/g, '');
    const processing = String(watch('processing')).replace(/,/g, '');
    const agent_fee = String(watch('agent_fee')).replace(/,/g, '');
    const collection = String(watch('collection')).replace(/,/g, '');
    const udi = (((Number(interest_rate) / 100) * Number(terms)) - ((Number(processing) / 100) + (Number(collection) / 100) + (Number(agent_fee) / 100))) * 100;

    if (!isNaN(udi)) {
      setValue('udi', parseFloat(udi.toFixed(2)));
    } else {
      setValue('udi', ''); // or handle the invalid number case as needed
    }
  }

  // Fill the form when it opens or another product is picked -- never when the loan codes
  // arrive, which wiped (Create) or reverted (Edit) what was typed while they loaded (2026-10-13).
  useEffect(() => {
    if (singleData) {
      setValue('id', singleData.id);
      setValue('loan_code_id', singleData.loan_code_id);
      setValue('description', singleData.description);
      setValue('terms', singleData.terms);
      setValue('interest_rate', singleData.interest_rate);
      setValue('udi', singleData.udi);
      setValue('processing', singleData.processing);
      setValue('agent_fee', singleData.agent_fee);
      setValue('insurance', singleData.insurance);
      setValue('insurance_fee', singleData.insurance_fee);
      setValue('collection', singleData.collection);
      setValue('notarial', singleData.notarial);
      setValue('base_deduction', singleData.base_deduction);
      setValue('addon_terms', singleData.addon_terms);
      setValue('addon_udi_rate', singleData.addon_udi_rate);
      setValue('is_active', singleData.is_active);
    } else {
      reset({
        id: '',
        loan_code_id: '',
        description: '',
        terms: '',
        interest_rate: '',
        processing: '',
        agent_fee: '',
        insurance: '',
        insurance_fee: '',
        collection: '',
        notarial: '',
        base_deduction: '',
        addon_terms: '',
        addon_udi_rate: '',
        is_active: ''
      })
    }
  }, [singleData, setValue, reset])

  useEffect(() => {
  }, [selectedOptIsAuto])

  return (

    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Column */}
        <div className="col-span-1 md:col-span-2">
           <FormInput
            label="Base Deduction"
            id="base_deduction"
            type="select"
            icon={ChevronDown}
            register={register('base_deduction', { required: 'Base Deduction is required' })}
            error={errors.base_deduction?.message}
            options={baseCompOptions}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          {/* Searchable: there are hundreds of codes. The label and the error are tied to the
              combobox input the way FormInput ties them to its fields. */}
          <FormLabel title="Loan Code" htmlFor="loan_code_id" />
          <Controller
            name="loan_code_id"
            control={control}
            rules={{ required: 'Loan Code is required' }}
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={optionsClient}
                placeholder={loanCodeData ? 'Select a Loan Code' : 'Loading loan codes...'}
                onChange={(option) => field.onChange(option?.value ?? '')}
                value={optionsClient.find((option) => option.value === String(field.value)) ?? null}
                isLoading={!loanCodeData}
                loadingMessage={() => 'Loading loan codes...'}
                inputId="loan_code_id"
                aria-invalid={errors.loan_code_id ? true : undefined}
                aria-errormessage={errors.loan_code_id ? 'loan_code_id-error' : undefined}
              />
            )}
          />
          {errors.loan_code_id?.message && (
            <p id="loan_code_id-error" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
              <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              {errors.loan_code_id.message}
            </p>
          )}
        </div>
        <div className="col-span-1 md:col-span-2">
          <FormInput
            label="Description"
            id="description"
            type="text"
            icon={Home}
            register={register('description', { required: 'Loan Code is required' })}
            error={errors.description ? "This field is required" : undefined}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Interest Rate (%)"
            id="interest_rate"
            type="text"
            icon={Home}
            register={register('interest_rate', { required: true })}
            error={errors.interest_rate && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Terms / No of Mos."
            id="terms"
            type="text"
            icon={Home}
            register={register('terms', { required: true })}
            error={errors.terms && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Processing (%)"
            id="processing"
            type="text"
            icon={Home}
            register={register('processing')}
            error={errors.processing && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Agent Fee (%)"
            id="agent_fee"
            type="text"
            icon={Home}
            register={register('agent_fee')}
            error={errors.agent_fee && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Collection (%)"
            id="collection"
            type="text"
            icon={Home}
            register={register('collection')}
            error={errors.collection && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="UDI (%)"
            id="udi"
            type="text"
            icon={Home}
            register={register('udi', { required: true })}
            error={errors.udi && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Addon Terms."
            id="terms"
            type="text"
            icon={Home}
            register={register('addon_terms', { required: true })}
            error={errors.terms && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Addon UDI Rate (%)"
            id="terms"
            type="text"
            icon={Home}
            register={register('addon_udi_rate', { required: true })}
            error={errors.terms && "This field is required"}
            required={true}
          />
        </div>
        <div>
          <FormInput
            label="Notarial"
            id="notarial"
            type="text"
            icon={Home}
            register={register('notarial')}
            error={errors.notarial && "This field is required"}
          />
        </div>
        <div>
          <FormInput
            label="Insurance Rate (%)"
            id="insurance"
            type="text"
            icon={Home}
            register={register('insurance')}
            error={errors.insurance && "This field is required"}
          />
        </div>
        <div>
          {/* value={watch(...)} is REQUIRED on a formatted FormInput: it
              renders formatType="number"/"currency" as CONTROLLED on its own
              displayValue (FormInput/index.tsx:338), and displayValue is only
              ever seeded from the value/defaultValue props. So the
              setValue('insurance_fee', …) on line 89 wrote form state that
              React then painted over with an empty string, and EDITING a loan
              product showed a blank Insurance Fee while the real figure sat
              in form state — saving silently rewrote it.

              Audited the other 18 money FormInputs while here: this was the
              only remaining one that is both formatted AND prefilled. The
              rest are fresh-entry fields, where binding a value would make an
              uncontrolled input controlled for no gain. */}
          <FormInput
            label="Insurance Manual Fee"
            id="insurance_fee"
            type="text"
            icon={Home}
            register={register('insurance_fee')}
            error={errors.insurance_fee && "This field is required"}
            formatType="number"
            value={watch('insurance_fee') ? String(watch('insurance_fee')) : ''}
          />
        </div>
        <div>
          <FormInput
            label="Active"
            id="is_active"
            type="checkbox"
            icon={Home} // icon is not used for checkbox, can be omitted or replaced
            register={register('is_active')}
          />
        </div>


        <div className="col-span-1 md:col-span-2 mt-4">
          <div className="flex justify-end gap-4.5">
            <Button variant="secondary"
              type="button"
              onClick={()=>{ setShowForm(false) }}>
              Back
            </Button>
            <Button variant="primary"
              type="submit"
              disabled={loanProductLoading}>
              {loanProductLoading ? (
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
            </Button>
          </div>
        </div>

        {/* Add more columns if necessary */}

        {/* Submit Button */}
        
      </form>
    </div>
  );
};

export default FormAddLoanProduct;