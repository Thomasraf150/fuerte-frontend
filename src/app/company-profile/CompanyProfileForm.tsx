"use client"
import React, { useEffect, useState } from 'react';
import { Home, MapPin, Archive, Mail, Globe, Phone, User } from 'react-feather';
import FormInput from '@/components/FormInput';
import FormInputFile from '@/components/FormInputFile';
import useCompanyProfileForm from '@/hooks/useCompanyProfileForm';
import Image from 'next/image'; // Import next/image

const CompanyProfileForm: React.FC = () => {
  const { register, handleSubmit, errors, onSubmit, companyLogo } = useCompanyProfileForm(undefined);

  const [logoPreview, setLogoPreview] = useState<string | null>(null); // State for image preview

  // Function to handle file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Update preview image URL
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    setLogoPreview(companyLogo)
    console.log(companyLogo, ' companyLogo')
  }, [companyLogo]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      <FormInputFile
        id="file-upload"
        label="Click to upload Image"
        subLabel1="SVG, PNG, JPG or GIF"
        subLabel2="(max, 800 X 800px)"
        register={register}
        error={errors.company_logo && "This field is required"}
        onChange={handleFileChange}
        required={false}
      />

      {logoPreview && (
        <div className="image-preview">
          <Image src={logoPreview} alt="Preview" width={700} height={300} priority unoptimized={true}/>
        </div>
      )}

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
        id="company_email"
        type="text"
        icon={Mail}
        register={register('company_email', { required: true })}
        error={errors.company_email && "This field is required"}
      />

      <FormInput
        label="Website"
        id="company_website"
        type="text"
        icon={Globe}
        register={register('company_website', { required: true })}
        error={errors.company_website && "This field is required"}
      />
      
      <FormInput
        label="Phone No."
        id="phone_no"
        type="text"
        icon={Phone}
        register={register('phone_no', { required: true })}
        error={errors.phone_no && "This field is required"}
        formatType="contact"
      />
      
      <FormInput
        label="Mobile No."
        id="mobile_no"
        type="text"
        icon={Phone}
        register={register('mobile_no', { required: true })}
        error={errors.mobile_no && "This field is required"}
        formatType="contact"
      />
      
      <FormInput
        label="Contact Person Name."
        id="contact_person"
        type="text"
        icon={User}
        register={register('contact_person', { required: true })}
        error={errors.contact_person && "This field is required"}
      />
      
      <FormInput
        label="Contact Person Contact No."
        id="contact_person_no"
        type="text"
        icon={Phone}
        register={register('contact_person_no', { required: true })}
        error={errors.contact_person_no && "This field is required"}
        formatType="contact"
      />
      
      <FormInput
        label="Contact Person Email."
        id="contact_email"
        type="text"
        icon={Mail}
        register={register('contact_email', { required: true })}
        error={errors.contact_email && "This field is required"}
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