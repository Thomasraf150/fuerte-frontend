"use client"
import React, { useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useArea from '@/hooks/useArea';
import { DataArea } from '@/utils/DataTypes';
import Button from '@/components/Button';

interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  refresh: () => Promise<void>;
  initialData?: DataArea | null;
  actionLbl: string;
}

interface OptionSubBranch {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const AreaForm: React.FC<ParentFormBr> = ({ setShowForm, refresh, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataArea>();
  const { onSubmitArea, branchSubData, areaLoading } = useArea();

  // Built during render, not in an effect: the saved sub-branch's option must already be in the
  // select when its value goes in, or Edit opens blank (2026-10-13).
  const optionsSubBranch = useMemo<OptionSubBranch[]>(() => (branchSubData && Array.isArray(branchSubData) ? [
    { value: '', label: 'Select a Sub Branch', hidden: true },
    ...branchSubData.map(bSub => ({ value: String(bSub.id), label: bSub.name })),
  ] : []), [branchSubData]);

  // Fill (or clear) the form when it opens or another area is picked -- never when the branch
  // list arrives, which wiped (Create) or reverted (Edit) what was typed while it loaded (2026-10-13).
  useEffect(()=>{
    if (initialData) {
      if (actionLbl === 'Update Area') {
        setValue('id', initialData.id ?? '')
        setValue('branch_sub_id', initialData.branch_sub_id)
        setValue('name', initialData.name)
        setValue('description', initialData.description)
      } else {
        reset({
          id: '',
          branch_sub_id: 0,
          name: '',
          description: ''
        });
      }
    }
  }, [initialData, setValue, actionLbl, reset])

  // Edit: the saved sub-branch goes in again once its options are in the select (a select cannot
  // take a value it has no option for).
  const branchesReady = optionsSubBranch.length > 0;
  useEffect(() => {
    if (initialData && actionLbl === 'Update Area' && branchesReady) setValue('branch_sub_id', initialData.branch_sub_id);
  }, [initialData, actionLbl, branchesReady, setValue]);

  const onSubmit: SubmitHandler<DataArea> = async (data) => {
    const result = await onSubmitArea(data) as { success: boolean; error?: string; data?: any };

    if (result && typeof result === 'object' && 'success' in result && result.success) {
      await refresh();
      setShowForm(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Branch Sub"
        id="branch_sub_id"
        type="select"
        icon={ChevronDown}
        register={register('branch_sub_id', { required: 'Branch Sub is required' })}
        error={errors.branch_sub_id?.message}
        options={optionsSubBranch}
        isLoading={!branchSubData}
        loadingMessage="Loading branches..."
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
        label="Description"
        id="description"
        type="text"
        icon={Home}
        register={register('description', { required: true })}
        error={errors.description && "This field is required"}
      />

      <div className="flex justify-end gap-4.5 mt-6">
        <Button variant="secondary"
          type="button"
          onClick={() => { setShowForm(false) }}>
          Cancel
        </Button>
        <Button variant="primary"
          type="submit"
          disabled={areaLoading}>
          {areaLoading ? (
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

export default AreaForm;
