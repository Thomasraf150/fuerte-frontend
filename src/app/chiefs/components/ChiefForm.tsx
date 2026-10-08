"use client"
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import useChiefs from '@/hooks/useChiefs';
import { DataChief, } from '@/utils/DataTypes';
import Button from '@/components/Button';
interface ParentFormBr {
  setShowForm: (value: boolean) => void;
  fetchDataChief: (f: number, p: number) => void;
  initialData?: DataChief | null;
  actionLbl: string;
}

const ChiefForm: React.FC<ParentFormBr> = ({ setShowForm, fetchDataChief, initialData, actionLbl }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DataChief>();
  const { onSubmitChief, chiefLoading } = useChiefs();

  useEffect(()=>{
    if (initialData) {
      if (actionLbl === 'Update Chief') {
        setValue('id', initialData.id ?? '')
        setValue('name', initialData.name)
        setValue('address', initialData.address)
        setValue('contact_no', initialData.contact_no)
        setValue('email', initialData.email)
      } else {
        reset({
          id: '',
          name: '',
          address: '',
          contact_no: '',
          email: '',
        });
      }
    }
  }, [initialData, setValue, actionLbl])

  const onSubmit: SubmitHandler<DataChief> = async (data) => {
    const result = await onSubmitChief(data) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result.success) {
      fetchDataChief(10, 1);
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
        formatType="contact"
        icon={Home}
        register={register('contact_no', { required: true })}
        error={errors.contact_no && "This field is required"}
      />
      <FormInput
        label="Contact Email."
        id="contact_email"
        type="text"
        icon={Home}
        register={register('email', { required: true })}
        error={errors.email && "This field is required"}
      />

      <div className="flex justify-end gap-4.5 mt-6">
        <Button variant="secondary"
          type="button"
          onClick={() => { setShowForm(false) }}>
          Cancel
        </Button>
        <Button variant="primary"
          type="submit"
          disabled={chiefLoading}>
          {chiefLoading ? (
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

export default ChiefForm;