"use client"
import Button from '@/components/Button';
import React, { useEffect, useMemo } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, Save, RotateCw } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useVendor from '@/hooks/useVendor';
import { RowVendorsData, DataSubBranches, RowSupCatData, RowDepartmentsData } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (v: boolean) => void;
  fetchVendors: (v: string) => void;
  createVendor: (d: RowVendorsData) => Promise<{success: boolean, error?: string, data?: any}>;
  vendorTypeId: string;
  vendorLoading: boolean;
  dataDepartments: RowDepartmentsData[] | undefined;
  singleData: RowVendorsData | undefined;
}

interface Option {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const EmployeeForm: React.FC<ParentFormBr> = ({ setShowForm, vendorTypeId, fetchVendors, createVendor, dataDepartments, vendorLoading, singleData }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowVendorsData>();

  // Built during render, not in an effect: the saved department's option must already be in the
  // select when its value goes in, or Edit opens blank (2026-10-13).
  const optionsDeps = useMemo<Option[]>(() => (dataDepartments && Array.isArray(dataDepartments) ? [
    { value: '', label: 'Select a Department', hidden: true },
    ...dataDepartments.map(bSub => ({ value: String(bSub.id), label: bSub.name })),
  ] : []), [dataDepartments]);

  // Fill the form when it opens or another vendor is picked -- never when the department list
  // arrives, which wiped (Create) or reverted (Edit) what was typed while it loaded (2026-10-13).
  useEffect(() => {
    setValue('vendor_type_id', vendorTypeId);
    setValue('id', singleData?.id ?? '');
    setValue('name', singleData?.name ?? '');
    setValue('employee_no', singleData?.employee_no ?? '');
    setValue('employee_position', singleData?.employee_position ?? '');
    setValue('department_id', singleData?.department_id ?? '');
  }, [vendorTypeId, singleData, setValue]);

  // Edit: the saved department goes in again once its options are in the select (a select cannot
  // take a value it has no option for).
  const departmentsReady = optionsDeps.length > 0;
  useEffect(() => {
    if (singleData && departmentsReady) setValue('department_id', singleData.department_id ?? '');
  }, [singleData, departmentsReady, setValue]);

  const onSubmit: SubmitHandler<RowVendorsData> = async (data) => {
    console.log(data, ' data');
    const result = await createVendor(data);
    
    // Only close form and refetch on successful submission
    if (result.success) {
      fetchVendors(vendorTypeId);
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            isLoading={!dataDepartments}
            loadingMessage="Loading departments..."
          />
        </div>

      </div>

      <div className="flex justify-end gap-4.5 mt-5">
        <Button variant="secondary"
          type="button"
          onClick={() => { setShowForm(false); }}>
          Cancel
        </Button>
        <Button variant="primary"
          type="submit"
          disabled={vendorLoading}>
          {vendorLoading ? (
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
    </form>
  );
};

export default EmployeeForm;