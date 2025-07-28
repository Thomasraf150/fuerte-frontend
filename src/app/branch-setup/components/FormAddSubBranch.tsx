"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormInput from '@/components/FormInput';
import FormLabel from '@/components/FormLabel';
import { DataFormSubBranches, DataSubBranches } from '@/utils/DataTypes';
import useBranches from '@/hooks/useBranches';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  selectedBranchId: number;
  actionLbl: string;
  fetchSubDataList: (order: string, branch_id: number) => void;
  initialSubData?: DataSubBranches | null; 
}

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const FormAddSubBranch: React.FC<ParentFormBr> = ({ setShowForm, selectedBranchId, actionLbl, fetchSubDataList, initialSubData }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<DataFormSubBranches>();
  const { onSubmitSubBranch, dataBranch } = useBranches();

  useEffect(() => {
      if (initialSubData) {
        if (actionLbl === 'Update Sub Branch') {
          setValue('id', initialSubData.id ?? '')
          setValue('code', initialSubData?.code);
          setValue('branch_id', initialSubData?.branch_id);
          setValue('name', initialSubData?.name);
          setValue('address', initialSubData?.address);
          setValue('contact_no', initialSubData?.contact_no);
          setValue('head_contact', initialSubData?.head_contact);
          setValue('head_email', initialSubData?.head_email);
          setValue('head_name', initialSubData?.head_name);
          setValue('ref_ctr_year', initialSubData?.ref_ctr_year);
          setValue('ref_current_value', initialSubData?.ref_current_value);
          setValue('ref_no_length', initialSubData?.ref_no_length);
        } else {
          reset({
            code: '',
            name: '',
            address: '',
            contact_no: '',
            head_contact: '',
            head_email: '',
            head_name: '',
            ref_ctr_year: 0,
            ref_current_value: 0,
            ref_no_length: 0
          });
        }
      }
  }, [selectedBranchId, actionLbl, initialSubData]);

  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

  useEffect(()=>{
    if (dataBranch && Array.isArray(dataBranch)) {
      const dynaOpt: Option[] = dataBranch?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubBranch([
        { value: '', label: 'Select a Sub Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
      
    }
  }, [dataBranch])

  const onSubmit: SubmitHandler<DataFormSubBranches> = data => {
    // data.branch_id = selectedBranchId;
    onSubmitSubBranch(data);
    fetchSubDataList('id_desc', selectedBranchId);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* <FormInput
        label="Branch"
        id="branch_id"
        type="select"
        icon={ChevronDown}
        register={register('branch_id', { required: 'Branch is required' })}
        error={errors.branch_id?.message}
        options={[
          { value: '', label: 'Select a branch' },
          { value: 'admin', label: 'Branch 1' },
          { value: 'user', label: 'Branch 2' },
          { value: 'guest', label: 'Branch 3' }
        ]}
      /> */}
      <FormLabel title={`Branch Info`}/>
      <div className="w-75">
        <Controller
          name="branch_id"
          control={control}
          rules={{ required: 'Branch is required' }} 
          render={({ field }) => (
            <ReactSelect
              {...field}
              options={optionsSubBranch}
              placeholder="Select a branch..."
              onChange={(selectedOption) => {
                field.onChange(selectedOption?.value);
                // handleBranchSubChange(selectedOption?.value ?? '');
              }}
              value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
            />
          )}
        />
      </div>
      <FormInput
        label="Code"
        id="code"
        type="text"
        icon={Home}
        register={register('code', { required: true })}
        error={errors.code && "This field is required"}
      />
      <FormInput
        label="Name"
        id="name"
        type="text"
        icon={Home}
        register={register('name', { required: true })}
        error={errors.name && "This field is required"}
      />
      <FormInput
        label="Address"
        id="address"
        type="text"
        icon={Home}
        register={register('address', { required: true })}
        error={errors.address && "This field is required"}
      />
      <FormInput
        label="Contact No."
        id="contact_no"
        type="text"
        icon={Home}
        register={register('contact_no', { required: true })}
        error={errors.contact_no && "This field is required"}
      />
      <FormLabel title={`Branch Head`}/>
      <FormInput
        label="Head Name"
        id="head_name"
        type="text"
        icon={Home}
        register={register('head_name', { required: true })}
        error={errors.head_name && "This field is required"}
      />
      <FormInput
        label="Contact No."
        id="head_contact"
        type="text"
        icon={Home}
        register={register('head_contact', { required: true })}
        error={errors.head_contact && "This field is required"}
      />
      <FormInput
        label="Head Email."
        id="head_email"
        type="text"
        icon={Home}
        register={register('head_email', { required: true })}
        error={errors.head_email && "This field is required"}
      />
      
      <FormLabel title={`Reference Number`}/>
      <FormInput
        label="Current Value"
        id="ref_current_value"
        type="text"
        icon={Home}
        register={register('ref_current_value', { required: true })}
        error={errors.ref_current_value && "This field is required"}
      />
      <FormInput
        label="Reference No. Length"
        id="ref_no_length"
        type="text"
        icon={Home}
        register={register('ref_no_length', { required: true })}
        error={errors.ref_no_length && "This field is required"}
      /> 
      <FormInput
        label="Year Today (last 2 digit)"
        id="ref_ctr_year"
        type="text"
        icon={Home}
        register={register('ref_ctr_year', { 
          required: true,
          maxLength: {
            value: 2,
            message: "Only 2 digits allowed",
          },
          pattern: {
            value: /^[0-9]{1,2}$/,
            message: "Only numeric values are allowed",
          },
        })}
        error={errors.ref_ctr_year && "This field is required"}
        maxLength={2}
      />

      <div className="flex justify-end gap-4.5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
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

export default FormAddSubBranch;