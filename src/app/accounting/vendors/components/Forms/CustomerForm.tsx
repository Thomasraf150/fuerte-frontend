"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useVendor from '@/hooks/useVendor';
import { RowVendorsData, RowCustCatData, RowSupCatData } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (v: boolean) => void;
  fetchVendors: (v: string) => void;
  createVendor: (d: RowVendorsData) => void;
  vendorTypeId: string;
  loading: boolean;
  dataCustCat: RowCustCatData[] | undefined;
  singleData: RowVendorsData | undefined;
}

interface Option {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const CustomerForm: React.FC<ParentFormBr> = ({ setShowForm, vendorTypeId, fetchVendors, createVendor, loading, dataCustCat, singleData }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowVendorsData>();
  // const { createVendor, dataCustCat, loading } = useVendor();

  const [optionsCustCat, setOptionsCustCat] = useState<Option[]>([]);

  useEffect(() => {
    if (dataCustCat && Array.isArray(dataCustCat)) {
      const dynaOpt: Option[] = dataCustCat?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsCustCat([
        { value: '', label: 'Select a Category', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
    setValue('vendor_type_id', vendorTypeId);
    setValue('id', singleData?.id ?? '');
    setValue('name', singleData?.name ?? '');
    setValue('tin', singleData?.tin ?? '');
    setValue('address', singleData?.address ?? '');
    setValue('bill_address', singleData?.bill_address ?? '');
    setValue('customer_category_id', singleData?.customer_category_id ?? '');
    setValue('credit_limit', singleData?.credit_limit ?? '');
    setValue('is_allow_excess_limit', singleData?.is_allow_excess_limit ?? false);
    setValue('remarks', singleData?.remarks ?? '');
  }, [dataCustCat, vendorTypeId, singleData]);

  const onSubmit: SubmitHandler<RowVendorsData> = data => {
    console.log(data, ' data');
    createVendor(data);
    if (!loading) {
      fetchVendors(vendorTypeId);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-4">
        <div className='mt-2'>
          <FormInput
            label="Name"
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
            label="Bill Address"
            id="bill_address"
            type="text"
            icon={Edit3}
            register={register('bill_address', { required: true })}
            error={errors.bill_address && "bill address is required"}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Category"
            id="customer_category_id"
            type="select"
            icon={ChevronDown}
            register={register('customer_category_id')}
            error={errors.customer_category_id?.message}
            options={optionsCustCat}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Credit Limit"
            id="credit_limit"
            type="text"
            icon={Edit3}
            register={register('credit_limit', { required: true })}
            error={errors.credit_limit && "credit limit is required"}
            className='mt-2'
          />
        </div>

        <div className='col-span-1'>
          <FormInput
            label="Allow Excess Limit"
            id="is_allow_excess_limit"
            type="checkbox"
            icon={Edit3}
            register={register('is_allow_excess_limit')}
            error={errors.is_allow_excess_limit && "is allow excess limit is required"}
            className='mt-10'
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
          onClick={() => { setShowForm(false); }}
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

export default CustomerForm;