import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Link from "next/link";
import { Camera, Home, Save, RotateCw } from 'react-feather';
import FormInput from '@/components/FormInput';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { BorrowerInfo, DataSubArea, BorrowerRowInfo, DataChief, DataArea, DataBorrCompanies } from '@/utils/DataTypes';
import { useEffect, useState } from "react";
import useBorrower from '@/hooks/useBorrower';

interface BorrInfoProps {
  dataChief?: DataChief[] | undefined;
  dataArea?: DataArea[] | undefined;
  dataSubArea?: DataSubArea[] | undefined;
  dataBorrCompany?: DataBorrCompanies[] | undefined;
  onSubmitBorrower: (d: any) => Promise<{ success: boolean }>;
  singleData: BorrowerRowInfo | undefined;
  setSingleData: (d: BorrowerRowInfo | undefined) => void;
  borrowerLoading: boolean;
  setShowForm: (v: boolean) => void;
  fetchDataBorrower: (v1: number, v2: number) => void;
  fetchDataChief: (v1: number, v2: number) => void;
  fetchDataArea: (v1: number, v2: number) => void;
  fetchDataSubArea: (v1: number) => void;
  fetchDataBorrCompany: (v1: number, v2: number) => void;
}

interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const BorrowerDetails: React.FC<BorrInfoProps> = ({ dataChief, dataArea, dataSubArea, dataBorrCompany, onSubmitBorrower, singleData, setSingleData, setShowForm, fetchDataSubArea, fetchDataBorrower, fetchDataChief, fetchDataArea, fetchDataBorrCompany, borrowerLoading }) => {
  const defaultValues: any = {
    reference: [
      { occupation: 'Supervisor/Princpal', name: '', contact_no: '' },
      { occupation: 'Administrative Officer/Master Teacher/Head Teacher', name: '', contact_no: '' },
      { occupation: 'Co-worker', name: '', contact_no: '' }
    ],
    chief_id: 0,
    amount_applied: 0,
    purpose: "",
    firstname: "",
    middlename: "",
    lastname: "",
    terms_of_payment: "",
    residence_address: "",
    is_rent: 0,
    other_source_of_inc: "",
    est_monthly_fam_inc: "",
    employment_position: "",
    gender: "",
    user_id: 0,
    dob: "",
    place_of_birth: "",
    age: "",
    email: "",
    contact_no: "",
    civil_status: "",
    work_address: "",
    occupation: "",
    fullname: "",
    company: "",
    dept_branch: "",
    length_of_service: "",
    salary: "",
    company_contact_person: "",
    spouse_contact_no: "",
    company_borrower_id: 0,
    employment_number: "",
    area_id: '',
    sub_area_id: '',
    station: "",
    term_in_service: "",
    employment_status: "",
    division: "",
    monthly_gross: 0,
    monthly_net: 0,
    office_address: "",
    employer: "",
    company_salary: "",
    contract_duration: "",
    photo: ""
  };
  
  const { register, control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrowerInfo>({
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "reference"
  });
    
  useEffect(() => {
    fetchDataChief(1000, 1); 
    fetchDataArea(1000, 1);
    fetchDataBorrCompany(1000, 1);
  }, []);

  // const { 
  //     dataChief, 
  //     dataArea, 
  //     dataSubArea, 
  //     fetchDataSubArea, 
  //     dataBorrCompany, 
  //     onSubmitBorrower } = useBorrower();
 
  const [optionsChief, setOptionsChief] = useState<OptionProps[]>([]);
  const [optionsArea, setOptionsArea] = useState<OptionProps[]>([]);
  const [optionsSubArea, setOptionsSubArea] = useState<OptionProps[]>([]);
  const [optionsBorrComp, setOptionsBorrComp] = useState<OptionProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [subAreaLoading, setSubAreaLoading] = useState<boolean>(false);

  const handleOnChangeArea = (value: any) => {
    setSubAreaLoading(true);
    // Clear current sub area selection
    setValue('sub_area_id', '');
    // Fetch new sub area data
    fetchDataSubArea(value.target.value);
  }

  useEffect(() => {
    if (dataSubArea && Array.isArray(dataSubArea)) {
      const dynaOpt: OptionProps[] = dataSubArea?.map(aSub => ({
        value: String(aSub.id),
        label: aSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubArea([
        { value: '', label: 'Select a Sub Area', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
      setSubAreaLoading(false); // Hide loading when data arrives
    }
    // fetchDataChief(100, 1);
    // fetchDataArea(100, 1);
    // fetchDataBorrCompany(100, 1);
  }, [dataSubArea])

  const onSubmit = async (data: BorrowerInfo) => {
    data.age = parseInt(data.age as unknown as string, 10); // Ensure age is a number

    const result = await onSubmitBorrower(data);

    // Only close form on successful submission
    if (result && result.success) {
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  }

  // const [imageSrc, setImageSrc] = useState('/images/user/user-06.png'); // Default image
  const [logoPreview, setLogoPreview] = useState('/images/user/user-06.png'); // State for image preview

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setValue('photo', base64String); // Set the Base64 string as the value
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (dataChief && Array.isArray(dataChief)) {
      const dynaOpt: OptionProps[] = dataChief?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsChief([
        { value: '', label: 'Select a Chief', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
  }, [dataChief])

  
  useEffect(() => {
    if (dataArea && Array.isArray(dataArea)) {
      const dynaOpt: OptionProps[] = dataArea?.map(aSub => ({
        value: String(aSub.id),
        label: aSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsArea([
        { value: '', label: 'Select a Area', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);

      if (singleData && optionsArea) {
        const subArea = dataArea?.find(item => item.id === String(singleData.borrower_work_background.area_id));
        if (subArea && Array.isArray(subArea?.sub_area)) {
          const dynaOptSub: OptionProps[] = subArea?.sub_area?.map(sSub => ({
            value: String(sSub.id),
            label: sSub.name, // assuming `name` is the key you want to use as label
          }));
          setOptionsSubArea([
            { value: '', label: 'Select a Sub Area', hidden: true }, // retain the default "Select a branch" option
            ...dynaOptSub,
          ]);
          setValue('sub_area_id', singleData.borrower_work_background.sub_area_id);
        }
      }
    }
  }, [dataArea])

  // Watch the area_id field
  // const areaId = watch('area_id');

  useEffect(() => {
    if (dataBorrCompany && Array.isArray(dataBorrCompany)) {
      const dynaOpt: OptionProps[] = dataBorrCompany?.map(aSub => ({
        value: String(aSub.id),
        label: aSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsBorrComp([
        { value: '', label: 'Select a Company', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
    }
    if (singleData) {
      // Assuming singleData has the structure matching BorrowerInfo
      Object.keys(singleData).forEach((key) => {
        if (key === "borrower_reference") {
          singleData.borrower_reference.forEach((ref, index) => {
            // console.log(ref, 'ref');
            setValue(`reference.${index}.occupation`, ref.occupation);
            setValue(`reference.${index}.name`, ref.name);
            setValue(`reference.${index}.contact_no`, ref.contact_no);
          });
        } else {
          // setValue(key as keyof BorrowerInfo, singleData[key]);
          setValue('id', singleData.id);
          setValue('chief_id', singleData.chief_id);
          setValue('amount_applied', Number(singleData.amount_applied));
          setValue('purpose', singleData.purpose);
          setValue('firstname', singleData.firstname);
          setValue('middlename', singleData.middlename);
          setValue('lastname', singleData.lastname);
          setValue('terms_of_payment', singleData.terms_of_payment);
          setValue('residence_address', singleData.residence_address);
          setValue('is_rent', (singleData.is_rent !== '0' ? 1 : 0));
          setValue('other_source_of_inc', singleData.other_source_of_inc);
          setValue('est_monthly_fam_inc', singleData.est_monthly_fam_inc);
          setValue('employment_position', singleData.employment_position);
          setValue('gender', singleData.gender);
          // setValue('photo', singleData.photo);
          setValue('user_id', singleData.user_id);
          setValue('dob', singleData.borrower_details.dob);
          setValue('place_of_birth', singleData.borrower_details.place_of_birth);
          setValue('age', Number(singleData.borrower_details.age));
          setValue('email', singleData.borrower_details.email);
          setValue('contact_no', singleData.borrower_details.contact_no);
          setValue('civil_status', singleData.borrower_details.civil_status);
          setValue('work_address', singleData.borrower_spouse_details.work_address);
          setValue('occupation', singleData.borrower_spouse_details.occupation);
          setValue('fullname', singleData.borrower_spouse_details.fullname);
          setValue('company', singleData.borrower_spouse_details.company);
          setValue('dept_branch', singleData.borrower_spouse_details.dept_branch);
          setValue('length_of_service', singleData.borrower_spouse_details.length_of_service);
          setValue('salary', singleData.borrower_spouse_details.salary);
          setValue('company_contact_person', singleData.borrower_spouse_details.company_contact_person);
          setValue('spouse_contact_no', singleData.borrower_spouse_details.contact_no);
          setValue('company_borrower_id', Number(singleData.borrower_work_background.company_borrower_id));
          setValue('employment_number', singleData.borrower_work_background.employment_number);
          setValue('area_id', singleData.borrower_work_background.area_id);
          
          // setValue('sub_area_id', singleData.borrower_work_background.sub_area_id);
          setValue('station', singleData.borrower_work_background.station);
          setValue('term_in_service', singleData.borrower_work_background.term_in_service);
          setValue('employment_status', singleData.borrower_work_background.employment_status);
          setValue('division', singleData.borrower_work_background.division);
          setValue('monthly_gross', Number(singleData.borrower_work_background.monthly_gross));
          setValue('monthly_net', Number(singleData.borrower_work_background.monthly_net));
          setValue('office_address', singleData.borrower_work_background.office_address);
          setValue('employer', singleData.borrower_company_info.employer);
          setValue('company_salary', singleData.borrower_company_info.salary);
          setValue('contract_duration', singleData.borrower_company_info.contract_duration);
          
          setLogoPreview(`${process.env.NEXT_PUBLIC_BASE_URL}/storage/` + singleData.photo);
          
        }
      });
    } else {
      reset({
        firstname: '',
      });
    }
  }, [dataBorrCompany, singleData])
  
  return (
      <div className="max-w-full lg:max-w-7xl mx-auto px-2 sm:px-4 lg:px-0">
      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Profile Photo - Centered at top */}
        <div className="flex justify-center mb-6">
          <div className="relative drop-shadow-2">
            <img
              src={logoPreview}
              alt="profile"
              className="w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full object-cover border-4 border-white dark:border-strokedark shadow-lg"
            />
            <label
              htmlFor="photo"
              className="absolute bottom-0 right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-white hover:bg-opacity-90 sm:bottom-2 sm:right-2 shadow-lg"
            >
              <Camera size="16" className="sm:hidden" />
              <Camera size="14" className="hidden sm:block" />
              <input
                id="photo"
                type="file"
                className="sr-only"
                onChange={onFileChange}
              />
            </label>
          </div>
        </div>

        {/* Form Containers - All full width and aligned */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  Borrower Information
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5.5 p-4 sm:p-6.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Amount Applied For"
                      id="amount_applied"
                      type="text"
                      icon={Home}
                      placeholder="0.00"
                      register={register('amount_applied', { required: true })}
                      error={errors.amount_applied && "This field is required"}
                      defaultValue="0"
                      formatType="number"
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Purpose"
                      id="purpose"
                      type="text"
                      icon={Home}
                      register={register('purpose', { required: true })}
                      error={errors.purpose && "This field is required"}
                      required={true}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div>
                    <FormInput
                      label="Firstname"
                      id="firstname"
                      type="text"
                      icon={Home}
                      register={register('firstname', { required: true })}
                      error={errors.firstname && "This field is required"}
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Middlename"
                      id="middlename"
                      type="text"
                      icon={Home}
                      register={register('middlename', { required: true })}
                      error={errors.middlename && "This field is required"}
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Lastname"
                      id="lastname"
                      type="text"
                      icon={Home}
                      register={register('lastname', { required: true })}
                      error={errors.lastname && "This field is required"}
                      required={true}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Terms of Payment"
                      id="terms_of_payment"
                      type="text"
                      icon={Home}
                      register={register('terms_of_payment', { required: true })}
                      error={errors.terms_of_payment && "This field is required"}
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Other Source of Income"
                      id="residence_address"
                      type="text"
                      icon={Home}
                      register={register('other_source_of_inc', { required: true })}
                      error={errors.other_source_of_inc && "This field is required"}
                      required={true}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Residence Address"
                      id="terms_of_payment"
                      type="text"
                      icon={Home}
                      register={register('residence_address', { required: true })}
                      error={errors.residence_address && "This field is required"}
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Type of Residency"
                      id="is_rent"
                      type="select"
                      icon={Home}
                      register={register('is_rent', { required: 'Type of Residency is required' })}
                      error={errors.is_rent?.message}
                      options={[
                        { value: '', label: 'Type of Residency', hidden: true },
                        { value: '1', label: 'Rent' },
                        { value: '0', label: 'Own' },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Estimated Monthly Family Income"
                      id="est_monthly_fam_inc"
                      type="text"
                      icon={Home}
                      register={register('est_monthly_fam_inc', { required: true })}
                      error={errors.est_monthly_fam_inc && "This field is required"}
                      formatType="number"
                      required={true}
                      defaultValue="0"
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Employment Position"
                      id="employment_position"
                      type="text"
                      icon={Home}
                      register={register('employment_position', { required: true })}
                      error={errors.employment_position && "This field is required"}
                      required={true}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Chief"
                      id="chief_id"
                      type="select"
                      icon={Home}
                      register={register('chief_id', { required: 'Chief is required' })}
                      error={errors.chief_id?.message}
                      options={optionsChief}
                      isLoading={!dataChief}
                      loadingMessage="Loading chiefs..."
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Gender"
                      id="gender"
                      type="select"
                      icon={Home}
                      register={register('gender', { required: 'Gender is required' })}
                      error={errors.gender?.message}
                      options={[
                        { value: '', label: 'Select Gender', hidden: true },
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                      ]}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  Borrower Details
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5.5 p-4 sm:p-6.5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Date of Birth"
                      id="dob"
                      type="date"
                      icon={Home}
                      register={register('dob', { required: true })}
                      error={errors.dob && "This field is required"}
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Place of birth"
                      id="place_of_birth"
                      type="text"
                      icon={Home}
                      register={register('place_of_birth', { required: true })}
                      error={errors.place_of_birth && "This field is required"}
                      required={true}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Age"
                      id="age"
                      type="text"
                      icon={Home}
                      register={register('age', { required: true })}
                      error={errors.age && "This field is required"}
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Email"
                      id="email"
                      type="text"
                      icon={Home}
                      register={register('email', { required: true })}
                      error={errors.email && "This field is required"}
                      required={true}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Contact No."
                      id="contact_no"
                      type="text"
                      icon={Home}
                      register={register('contact_no', { required: true })}
                      error={errors.contact_no && "This field is required"}
                      formatType="contact"
                      required={true}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Civil Status"
                      id="civil_status"
                      type="text"
                      icon={Home}
                      register={register('civil_status', { required: true })}
                      error={errors.civil_status && "This field is required"}
                      required={true}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  Borrower Spouse Details
                </h3>
              </div>
              <div className="flex flex-col gap-5.5 p-6.5">
           
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FormInput
                    label="Spouse's Work Address"
                    id="work_address"
                    type="text"
                    icon={Home}
                    register={register('work_address', { required: true })}
                    error={errors.work_address && "This field is required"}
                    required={true}
                  />
                </div>
                <div>
                  <FormInput
                    label="Occupation"
                    id="occupation"
                    type="text"
                    icon={Home}
                    register={register('occupation', { required: true })}
                    error={errors.occupation && "This field is required"}
                    required={true}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FormInput
                    label="Fullname"
                    id="fullname"
                    type="text"
                    icon={Home}
                    register={register('fullname', { required: true })}
                    error={errors.fullname && "This field is required"}
                    required={true}
                  />
                </div>
                <div>
                  <FormInput
                    label="Company"
                    id="company"
                    type="text"
                    icon={Home}
                    register={register('company', { required: true })}
                    error={errors.company && "This field is required"}
                    required={true}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FormInput
                    label="Dept./Branch"
                    id="dept_branch"
                    type="text"
                    icon={Home}
                    register={register('dept_branch', { required: true })}
                    error={errors.dept_branch && "This field is required"}
                    required={true}
                  />
                </div>
                <div>
                  <FormInput
                    label="Length of Service"
                    id="length_of_service"
                    type="text"
                    icon={Home}
                    register={register('length_of_service', { required: true })}
                    error={errors.length_of_service && "This field is required"}
                    required={true}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FormInput
                    label="Salary"
                    id="salary"
                    type="text"
                    icon={Home}
                    register={register('salary', { required: true })}
                    error={errors.salary && "This field is required"}
                    formatType="number"
                    required={true}
                    defaultValue="0"
                  />
                </div>
                <div>
                  <FormInput
                    label="Company Contact Person"
                    id="company_contact_person"
                    type="text"
                    icon={Home}
                    register={register('company_contact_person', { required: true })}
                    error={errors.company_contact_person && "This field is required"}
                    required={true}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FormInput
                    label="Contact No/s."
                    id="spouse_contact_no"
                    type="text"
                    icon={Home}
                    register={register('spouse_contact_no', { required: true })}
                    error={errors.spouse_contact_no && "This field is required"}
                    formatType="contact"
                    required={true}
                    defaultValue="N/A"
                  />
                </div>
                <div>
                </div>
              </div>

              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  Work Background
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5.5 p-4 sm:p-6.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Office Where Currently Employed"
                      id="company_borrower_id"
                      type="select"
                      icon={Home}
                      register={register('company_borrower_id', { required: 'Office is required' })}
                      error={errors.company_borrower_id?.message}
                      options={optionsBorrComp}
                      isLoading={!dataBorrCompany}
                      loadingMessage="Loading companies..."
                    />
                    {/* <div className="relative flex mt-2">
                      <label
                        htmlFor="cover"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded bg-primary px-2 py-1 text-sm font-medium text-white hover:bg-opacity-80 xsm:px-4"
                      >
                        <span>
                          +
                        </span>
                        <span>Add Company</span>
                      </label>
                    </div> */}
                  </div>
                  <div>  
                    <FormInput
                      label="Employee Number"
                      id="employment_number"
                      type="text"
                      icon={Home}
                      register={register('employment_number', { required: true })}
                      error={errors.employment_number && "This field is required"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Area"
                      id="area_id"
                      type="select"
                      icon={Home}
                      register={register('area_id', { required: 'Area is required' })}
                      error={errors.area_id?.message}
                      options={optionsArea}
                      onChange={(e: any) => { return handleOnChangeArea(e); } }
                      isLoading={!dataArea}
                      loadingMessage="Loading areas..."
                    />
                    {/* <div className="relative flex mt-2">
                      <label
                        htmlFor="cover"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded bg-primary px-2 py-1 text-sm font-medium text-white hover:bg-opacity-80 xsm:px-4"
                      >
                        <span>
                          +
                        </span>
                        <span>Add Area</span>
                      </label>
                    </div> */}
                  </div>
                  <div>
                    <FormInput
                      label="Sub Area"
                      id="sub_area_id"
                      type="select"
                      icon={Home}
                      register={register('sub_area_id', { required: 'Sub Area is required' })}
                      error={errors.sub_area_id?.message}
                      options={optionsSubArea}
                      isLoading={subAreaLoading}
                      loadingMessage="Loading sub areas..."
                    />
                    {/* <div className="relative flex mt-2">
                      <label
                        htmlFor="cover"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded bg-primary px-2 py-1 text-sm font-medium text-white hover:bg-opacity-80 xsm:px-4"
                      >
                        <span>
                          +
                        </span>
                        <span>Add Sub Area</span>
                      </label>
                    </div> */}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Station"
                      id="station"
                      type="text"
                      icon={Home}
                      register={register('station', { required: true })}
                      error={errors.station && "This field is required"}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Term in service"
                      id="term_in_service"
                      type="text"
                      icon={Home}
                      register={register('term_in_service', { required: true })}
                      error={errors.term_in_service && "This field is required"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Employement Status"
                      id="employment_status"
                      type="select"
                      icon={Home}
                      register={register('employment_status', { required: 'Employee Status is required' })}
                      error={errors.employment_status?.message}
                      options={[
                        { value: '', label: 'Select Area', hidden: true },
                        { value: 'Contractual', label: 'Contractual' },
                        { value: 'Permanent', label: 'Permanent' },
                        { value: 'Agency', label: 'Agency' },
                      ]}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Division"
                      id="division"
                      type="text"
                      icon={Home}
                      register={register('division', { required: true })}
                      error={errors.division && "This field is required"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Monthly Gross Salary"
                      id="monthly_gross"
                      type="text"
                      icon={Home}
                      register={register('monthly_gross', { required: true })}
                      error={errors.monthly_gross && "This field is required"}
                      formatType="number"
                      defaultValue="0"
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Monthly Net Salary"
                      id="monthly_net"
                      type="text"
                      icon={Home}
                      register={register('monthly_net', { required: true })}
                      error={errors.monthly_net && "This field is required"}
                      formatType="number"
                      defaultValue="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="col-span-1 md:col-span-2">
                    <FormInput
                      label="Office Address"
                      id="office_address"
                      type="text"
                      icon={Home}
                      register={register('office_address', { required: true })}
                      error={errors.office_address && "This field is required"}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  References
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5.5 p-4 sm:p-6.5">

              <div className="flex flex-col gap-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border border-stroke rounded-lg bg-gray-50/50 dark:bg-meta-4/50">
                      <div>
                        <FormInput
                          label="Position"
                          id={`reference.${index}.occupation`}
                          type="text"
                          icon={Home}
                          register={register(`reference.${index}.occupation`, { required: true })}
                          error={errors.reference?.[index]?.occupation && "This field is required"}
                        />
                      </div>
                      <div>
                        <FormInput
                          label="Fullname"
                          id={`reference.${index}.name`}
                          type="text"
                          icon={Home}
                          register={register(`reference.${index}.name`, { required: true })}
                          error={errors.reference?.[index]?.name && "This field is required"}
                        />
                      </div>
                      <div>
                        <FormInput
                          label="Contact"
                          id={`reference.${index}.contact_no`}
                          type="text"
                          icon={Home}
                          register={register(`reference.${index}.contact_no`, { required: true })}
                          error={errors.reference?.[index]?.contact_no && "This field is required"}
                          formatType="contact"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors w-full sm:w-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => append({ occupation: '', name: '', contact_no: '' })}
                  className="px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors w-full sm:w-auto"
                >
                  Add More
                </button>

              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  Company Information
                </h3>
              </div>
              <div className="flex flex-col gap-5.5 p-6.5">
           
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <FormInput
                    label="Employer"
                    id="employer"
                    type="text"
                    icon={Home}
                    register={register('employer', { required: true })}
                    error={errors.employer && "This field is required"}
                  />
                </div>
                <div>
                  <FormInput
                    label="Salary"
                    id="salary"
                    type="text"
                    icon={Home}
                    register={register('company_salary', { required: true })}
                    error={errors.salary && "This field is required"}
                    formatType="number"
                    defaultValue="0"
                  />
                </div>
                <div>
                  <FormInput
                    label="Contract Duration"
                    id="contract_duration"
                    type="text"
                    icon={Home}
                    register={register('contract_duration', { required: true })}
                    error={errors.contract_duration && "This field is required"}
                  />
                </div>
              </div>


              </div>
            </div>
          </div>
          <div className="w-full mb-5 mt-5">
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mx-2 sm:mx-3">
              <button
                className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white w-full sm:w-auto"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Back
              </button>
              <button
                className={`flex justify-center rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 transition ${borrowerLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={borrowerLoading}
              >
                {borrowerLoading ? (
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
          </div>
          
        </div>
        </form>
      </div>
  );
};

export default BorrowerDetails;
