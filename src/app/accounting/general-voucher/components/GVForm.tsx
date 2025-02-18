"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import VoucherDetailsTbl from './VoucherDetailsTbl';
import useCoa from '@/hooks/useCoa';
import { RowAcctgEntry, DataSubBranches, RowAcctgDetails } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (b: boolean) => void;
}

const GVForm: React.FC<ParentFormBr> = ({ setShowForm }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowAcctgEntry>();
  const [rows, setRows] = useState<RowAcctgDetails[]>([{ accountCode: "", debit: "", credit: "" }]);

  const onSubmit: SubmitHandler<RowAcctgEntry> = data => {
    
  };

  useEffect(() => {
    setValue('acctg_detals', rows);
  }, [rows])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className='mt-2'>
          <FormInput
            label="Date"
            id="journal_date"
            type="text"
            icon={Edit3}
            register={register('journal_date', { required: true })}
            error={errors.journal_date && "Account name is required"}
          /> 
        </div>
        
        {/* <div className='mt-2'>
          <button
            className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 text-sm dark:border-strokedark dark:text-white"
            type="button"
          >
            ...
          </button>
        </div> */}

        <div>
          <FormInput
            label="Check #"
            id="check_no"
            type="text"
            icon={Edit3}
            register={register('check_no', { required: true })}
            error={errors.check_no && "check no is required"}
            className='mt-2'
          />
        </div>

        <div>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <FormInput
                label="Payee"
                id="journal_desc"
                type="text"
                icon={Edit3}
                register={register('journal_desc', { required: true })}
                error={errors.journal_desc && "journal desc is required"}
                className='mt-2'
                readOnly
              />
            </div>
            <div>
              <button
                className="flex justify-center mt-10 bg-orange-300 rounded border border-stroke px-6 py-2 font-medium text-white hover:shadow-1 text-sm dark:border-strokedark dark:text-white"
                type="button"
              >
                Select
              </button>
            </div>
          </div>
        </div>
        <div className='col-span-3'>
          <FormInput
            label="Particulars"
            id="journal_desc"
            type="text"
            icon={Edit3}
            register={register('journal_desc', { required: true })}
            error={errors.journal_desc && "journal_desc is required"}
            className='mt-2'
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-5">
        <div>
          <VoucherDetailsTbl rows={rows} setRows={setRows} />
        </div>
      </div>

      <div className="flex justify-end gap-4.5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 text-sm dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </button>
        <button
          className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 text-sm"
          type="submit"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default GVForm;