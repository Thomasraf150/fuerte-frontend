"use client"
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, MapPin, Archive, Mail, Globe, Phone, User } from 'react-feather';
import FormInput from '@/components/FormInput';
import FormInputFile from '@/components/FormInputFile';

interface FormValues {
  company_name: string;
  address: string;
  tin: string;
  email: string;
  website: string;
  phone_no: string;
  mobile_no: string;
  contact_person_name: string;
  contact_person_co: string;
  contact_person_email: string;
};

const CompanyProfileForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = data => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Company Name"
        id="company_name"
        type="text"
        icon={Home}
        register={register('company_name', { required: true })}
        error={errors.company_name && "This field is required"}
      />

      <FormInput
        label="TIN"
        id="tin"
        type="text"
        icon={Archive}
        register={register('tin', { required: true })}
        error={errors.tin && "This field is required"}
      />

      <FormInput
        label="Address"
        id="address"
        type="text"
        icon={MapPin}
        register={register('address', { required: true })}
        error={errors.address && "This field is required"}
      />

      <FormInput
        label="Email"
        id="email"
        type="text"
        icon={Mail}
        register={register('email', { required: true })}
        error={errors.email && "This field is required"}
      />

      <FormInput
        label="Website"
        id="webiste"
        type="text"
        icon={Globe}
        register={register('website', { required: true })}
        error={errors.website && "This field is required"}
      />
      
      <FormInput
        label="Phone No."
        id="phone_no"
        type="text"
        icon={Phone}
        register={register('phone_no', { required: true })}
        error={errors.phone_no && "This field is required"}
      />
      
      <FormInput
        label="Mobile No."
        id="mobile_no"
        type="text"
        icon={Phone}
        register={register('mobile_no', { required: true })}
        error={errors.mobile_no && "This field is required"}
      />
      
      <FormInput
        label="Contact Person Name."
        id="contact_person_name"
        type="text"
        icon={User}
        register={register('contact_person_name', { required: true })}
        error={errors.contact_person_name && "This field is required"}
      />
      
      <FormInput
        label="Contact Person Contact No."
        id="contact_person_co"
        type="text"
        icon={Phone}
        register={register('contact_person_co', { required: true })}
        error={errors.contact_person_co && "This field is required"}
      />
      
      <FormInput
        label="Contact Person Email."
        id="contact_person_email"
        type="text"
        icon={Mail}
        register={register('contact_person_email', { required: true })}
        error={errors.contact_person_email && "This field is required"}
      />

      <FormInputFile
        id="file-upload"
        label="Click to upload Image"
        subLabel1="SVG, PNG, JPG or GIF"
        subLabel2="(max, 800 X 800px)"
        onChange={(e) => console.log(e.target.files)} // Handle file change
      />
     
      <div className="flex justify-end gap-4.5">
        <button
          className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
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

export default CompanyProfileForm;