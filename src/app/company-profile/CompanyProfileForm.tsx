"use client"
import React, { useEffect, useState } from 'react';
import { Home, MapPin, Archive, Mail, Globe, Phone, User, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import FormInputFile from '@/components/FormInputFile';
import useCompanyProfileForm from '@/hooks/useCompanyProfileForm';
import Image from 'next/image'; // Import next/image
import Button from '@/components/Button';

const CompanyProfileForm: React.FC = () => {
  const { register, handleSubmit, errors, onSubmit, companyLogo, companyProfileLoading } = useCompanyProfileForm(undefined);

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
    <form className="space-y-4" onSubmit={handleSubmit(async (data) => {
      const result = await onSubmit(data);
      // Note: Company profile form doesn't close automatically since it's a standalone settings page
    })}>

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

      {/* width/height stay as the intrinsic ratio Next needs, but the rendered
          size is capped to the container: at 1024px the content area is ~652px,
          so a hard 700px logo preview pushed the page 48px sideways. */}
      {logoPreview && (
        <div className="image-preview">
          <Image
            src={logoPreview}
            alt="Preview"
            width={700}
            height={300}
            priority
            unoptimized={true}
            className="h-auto w-full max-w-[700px]"
          />
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

      
     
      <div className="flex justify-end gap-2">
        <Button variant="secondary"
          type="button">
          Cancel
        </Button>
        <Button variant="primary"
          type="submit"
          disabled={companyProfileLoading}>
          {companyProfileLoading ? (
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

export default CompanyProfileForm;