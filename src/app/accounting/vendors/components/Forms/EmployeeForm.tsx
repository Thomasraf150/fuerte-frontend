"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useVendor from '@/hooks/useVendor';
import { RowVendorsData, DataSubBranches, RowSupCatData, RowDepartmentsData } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (v: boolean) => void;
  fetchVendors: (v: string) => void;
  createVendor: (d: RowVendorsData) => void;
  vendorTypeId: string;
  loading: boolean;
  dataDepartments: RowDepartmentsData[] | undefined;
  singleData: RowVendorsData | undefined;
}

interface Option {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const EmployeeForm: React.FC<ParentFormBr> = ({ setShowForm, vendorTypeId, fetchVendors, createVendor, dataDepartments, loading, singleData }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowVendorsData>();

  const [optionsDeps, setOptionsDeps] = useState<Option[]>([]);

  useEffect(() => {
    if (dataDepartments && Array.isArray(dataDepartments)) {
      const dynaOpt: Option[] = dataDepartments?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsDeps([
        { value: '', label: 'Select a Department', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
    setValue('vendor_type_id', vendorTypeId);
    setValue('id', singleData?.id ?? '');
    setValue('name', singleData?.name ?? '');
    setValue('employee_no', singleData?.employee_no ?? '');
    setValue('employee_position', singleData?.employee_position ?? '');
    setValue('department_id', singleData?.department_id ?? '');

    console.log(dataDepartments, 'dataDepartments')
  }, [dataDepartments, vendorTypeId, singleData]);

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
            label="Employee No."
            id="employee_no"
            type="text"
            icon={Edit3}
            register={register('employee_no', { required: true })}
            error={errors.employee_no && "employee no is required"}
            className='mt-2'
          />
        </div>

        <div className=''>
          <FormInput
            label="Employee Position"
            id="employee_position"
            type="text"
            icon={Edit3}
            register={register('employee_position')}
            error={errors.employee_position && "employee position is required"}
            className='mt-2'
          />
        </div>

        <div>
          <FormInput
            label="Department"
            id="department_id"
            type="select"
            icon={ChevronDown}
            register={register('department_id')}
            error={errors.department_id?.message}
            options={optionsDeps}
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

export default EmployeeForm;