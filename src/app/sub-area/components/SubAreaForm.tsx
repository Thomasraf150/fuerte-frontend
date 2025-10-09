"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useSubArea from '@/hooks/useSubArea';
import { DataSubArea } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchDataSubArea: (f: number, p: number) => void;
  initialData?: DataSubArea | null;
  actionLbl: string;
}

interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const SubAreaForm: React.FC<ParentFormBr> = ({ setShowForm, fetchDataSubArea, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataSubArea>();
  const {
          dataArea,
          dataSubArea,
          onSubmitSubArea,
          handleDeleteSubArea,
          subAreaLoading } = useSubArea();

  const [optionsArea, setOptionsArea] = useState<OptionProps[]>([]);

  useEffect(()=>{
    if (dataArea && Array.isArray(dataArea)) {
      const dynaOpt: OptionProps[] = dataArea?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsArea([
        { value: '', label: 'Select a Area', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }

    if (initialData) {
      if (actionLbl === 'Update Sub Area') {
        setValue('id', initialData.id ?? '')
        setValue('area_id', String(initialData.area_id))
        setValue('name', initialData.name)
      } else {
        reset({
          id: '',
          area_id: '',
          name: '',
        });
      }
    }

    console.log(initialData, ' initialData');
  }, [initialData, setValue, actionLbl, dataArea])

  const onSubmit: SubmitHandler<DataSubArea> = async (data) => {
    const result = await onSubmitSubArea(data);

    // Only close form on successful submission
    if (result.success) {
      fetchDataSubArea(10, 1);
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Area"
        id="area_id"
        type="select"
        icon={ChevronDown}
        register={register('area_id', { required: 'Area is required' })}
        error={errors.area_id?.message}
        options={optionsArea}
        isLoading={!dataArea}
        loadingMessage="Loading areas..."
      />

      <FormInput
        label="Name"
        id="name"
        type="text"
        icon={Home}
        register={register('name', { required: true })}
        error={errors.name && "This field is required"}
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
          className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 ${subAreaLoading ? 'opacity-70' : ''}`}
          type="submit"
          disabled={subAreaLoading}
        >
          {subAreaLoading ? (
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
        </button>
      </div>
    </form>
  );
};

export default SubAreaForm;