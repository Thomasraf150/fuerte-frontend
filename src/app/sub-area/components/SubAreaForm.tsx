"use client"
import React, { useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useSubArea from '@/hooks/useSubArea';
import { DataSubArea } from '@/utils/DataTypes';
import Button from '@/components/Button';

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

  // Built during render, not in an effect: the saved area's option must already be in the
  // select when its value goes in, or Edit opens blank (2026-10-13).
  const optionsArea = useMemo<OptionProps[]>(() => (dataArea && Array.isArray(dataArea) ? [
    { value: '', label: 'Select a Area', hidden: true },
    ...dataArea.map(bSub => ({ value: String(bSub.id), label: bSub.name })),
  ] : []), [dataArea]);

  // Fill (or clear) the form when it opens or another sub area is picked -- never when the area
  // list arrives, which wiped (Create) or reverted (Edit) what was typed while it loaded (2026-10-13).
  useEffect(()=>{
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
  }, [initialData, setValue, actionLbl, reset])

  // Edit: the saved area goes in again once its options are in the select (a select cannot take
  // a value it has no option for).
  const areasReady = optionsArea.length > 0;
  useEffect(() => {
    if (initialData && actionLbl === 'Update Sub Area' && areasReady) setValue('area_id', String(initialData.area_id));
  }, [initialData, actionLbl, areasReady, setValue]);

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
        <Button variant="secondary"
          type="button"
          onClick={() => { setShowForm(false) }}>
          Cancel
        </Button>
        <Button variant="primary"
          type="submit"
          disabled={subAreaLoading}>
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
        </Button>
      </div>
    </form>
  );
};

export default SubAreaForm;
