"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useSubArea from '@/hooks/useSubArea';
import { DataSubArea } from '@/utils/DataTypes';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  refresh: () => Promise<void>;
  initialData?: DataSubArea | null;
  actionLbl: string;
}

interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const SubAreaForm: React.FC<ParentFormBr> = ({ setShowForm, refresh, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataSubArea>();
  const {
    dataArea,
    onSubmitSubArea,
    subAreaLoading,
  } = useSubArea();

  const [optionsArea, setOptionsArea] = useState<OptionProps[]>([]);

  useEffect(()=>{
    if (dataArea && Array.isArray(dataArea)) {
      const dynaOpt: OptionProps[] = dataArea?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name,
      }));
      setOptionsArea([
        { value: '', label: 'Select a Area', hidden: true },
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
  }, [initialData, setValue, actionLbl, dataArea, reset])

  const onSubmit: SubmitHandler<DataSubArea> = async (data) => {
    const result = await onSubmitSubArea(data) as { success: boolean; error?: string; data?: any };

    if (result && typeof result === 'object' && 'success' in result && result.success) {
      await refresh();
      setShowForm(false);
    }
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

      <div className="flex justify-end gap-4.5 mt-6">
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
