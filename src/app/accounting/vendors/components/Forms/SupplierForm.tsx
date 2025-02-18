"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useVendor from '@/hooks/useVendor';
import { RowVendorsData, DataSubBranches, RowSupCatData } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (v: string) => void;
  vendorTypeId: string;
}

interface Option {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const SupplierForm: React.FC<ParentFormBr> = ({ setShowForm, vendorTypeId }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowVendorsData>();
  const { dataSupplierCat, createVendor } = useVendor();

  const [optionsSubCat, setOptionsSubCat] = useState<Option[]>([]);

  useEffect(() => {
    if (dataSupplierCat && Array.isArray(dataSupplierCat)) {
      const dynaOpt: Option[] = dataSupplierCat?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubCat([
        { value: '', label: 'Select a Category', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
    setValue('vendor_type_id', vendorTypeId);
  }, [dataSupplierCat, vendorTypeId]);

  const onSubmit: SubmitHandler<RowVendorsData> = data => {
    console.log(data, ' data');
    createVendor(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-4">
        <div className='mt-2'>
          <FormInput
            label="Supplier Name"
            id="name"
            type="text"
            icon={Edit3}
            register={register('name', { required: true })}
            error={errors.name && "Account name is required"}
          />
        </div>

        <div>
          <FormInput
            label="TIN"
            id="tin"
            type="text"
            icon={Edit3}
            register={register('tin', { required: true })}
            error={errors.tin && "tin is required"}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Address"
            id="address"
            type="text"
            icon={Edit3}
            register={register('address', { required: true })}
            error={errors.address && "address is required"}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Supplier Category"
            id="supplier_category_id"
            type="select"
            icon={ChevronDown}
            register={register('supplier_category_id')}
            error={errors.supplier_category_id?.message}
            options={optionsSubCat}
            className='mt-2'
          />
        </div>

        <div className=''>
          <FormInput
            label="Tax Excempt Date"
            id="tax_excempty_date"
            type="date"
            icon={Edit3}
            register={register('tax_excempty_date')}
            error={errors.tax_excempty_date && "tax excempty date is required"}
            className='mt-2'
          />
        </div>

        <div className=''>
          <FormInput
            label="Remarks"
            id="remarks"
            type="text"
            icon={Edit3}
            register={register('remarks')}
            error={errors.remarks && "remarks is required"}
            className='mt-2'
          />
        </div>
      </div>

      <div className="flex justify-end gap-4.5 mt-5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(''); }}
        >
          Cancel
        </button>
        <button
          className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
          type="submit"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;