import { MIN_DATE_OF_BIRTH, boundsAllowing, maxDateOfBirth } from '@/constants/dateBounds';
import { Camera, Home, Save, RotateCw, Search } from 'react-feather';
import FormInput from '@/components/FormInput';
import { checkBorrowerNow } from '@/utils/borrowerDuplicateCheck';
import FormLabel from '@/components/FormLabel';
import { useForm, useFieldArray, Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import { BorrowerInfo, DataSubArea, BorrowerRowInfo, DataChief, DataArea, DataBorrCompanies, DataSubBranches, SelectOption } from '@/utils/DataTypes';
import { useAuthStore } from "@/store";
import { BORROWER_REQUIRED_FIELDS } from '@/utils/borrowerRequiredFields';
import { useEffect, useMemo, useState, useRef } from "react";

interface BorrInfoProps {
  dataChief?: DataChief[] | undefined;
  dataArea?: DataArea[] | undefined;
  dataSubArea?: DataSubArea[] | undefined;
  dataBorrCompany?: DataBorrCompanies[] | undefined;
  /**
   * Sub-branches the logged-in user is allowed to file new borrowers
   * under. Driven by getMyAccessibleBranchSubs. Undefined while loading;
   * empty array means "still single-branch — don't render the picker".
   */
  myAccessibleBranchSubs?: DataSubBranches[] | undefined;
  loadingMyAccessibleBranches?: boolean;
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
  /** Which fields must be filled. Undefined = New Borrower's own set (today's rules). */
  requiredFields?: ReadonlySet<string>;
  /** Values to start from (e.g. an application). Merged over the defaults; never sets `id`. */
  initialValues?: Partial<BorrowerInfo>;
  /** Branch choices that replace the assigned-branch picker; when given, the picker always shows. For creating; with singleData (edit) the picker would show too, so edit pages must not pass it. */
  branchChoices?: SelectOption[];
  /** Extra fields rendered at the top of "Borrower Information", bound to this same form. */
  renderExtraFields?: (form: { control: Control<any>; register: UseFormRegister<any>; errors: FieldErrors<any> }) => React.ReactNode;
  /** 'application' hides the profile photo and the Check Borrower button and titles the identity block "Name & Contact". */
  variant?: 'borrower' | 'application';
  /** Start the branch picker on the user's home branch when it is a choice. False = the user must pick. */
  preselectHomeBranch?: boolean;
}

const BorrowerDetails: React.FC<BorrInfoProps> = ({ dataChief, dataArea, dataSubArea, dataBorrCompany, myAccessibleBranchSubs, loadingMyAccessibleBranches, onSubmitBorrower, singleData, setSingleData, setShowForm, fetchDataSubArea, fetchDataBorrower, fetchDataChief, fetchDataArea, fetchDataBorrCompany, borrowerLoading, requiredFields, initialValues, branchChoices, renderExtraFields, variant = 'borrower', preselectHomeBranch = true }) => {
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
    company_borrower_id: null,
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
  
  // Starting values (an application's, say) go over the defaults. `id` is never taken
  // from them, so a create stays a create.
  const seed: Partial<BorrowerInfo> = { ...initialValues };
  delete seed.id;

  const { register, control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrowerInfo>({
    defaultValues: { ...defaultValues, ...seed }
  });

  // Whether a field must be filled: New Borrower's own set unless the caller gives one.
  const req = (name: string) => (requiredFields ?? BORROWER_REQUIRED_FIELDS).has(name);

  // Multi-branch picker state. The dropdown only renders when (a) the
  // user has more than one accessible sub-branch, AND (b) we're on the
  // CREATE flow (no singleData). EDITs never expose the picker because
  // the backend strips branch_sub_id from update payloads to prevent
  // accidental cross-branch moves. Branch choices from the caller replace
  // the assigned sub-branches and always show the picker.
  const { assignedBranchSubIds, homeBranchSubId } = useMemo(() => {
    const u = useAuthStore.getState().user as { assignedBranchSubIds?: number[]; branch_sub_id?: number } | undefined;
    return {
      assignedBranchSubIds: Array.isArray(u?.assignedBranchSubIds) ? u!.assignedBranchSubIds.map(Number) : [],
      homeBranchSubId: u?.branch_sub_id ? String(u.branch_sub_id) : '',
    };
  }, []);
  const showBranchPicker = !!branchChoices || (assignedBranchSubIds.length > 1 && !singleData?.id);

  const branchOptions: SelectOption[] = useMemo(() => {
    if (branchChoices) return branchChoices;
    if (!myAccessibleBranchSubs) return [];
    return myAccessibleBranchSubs
      .filter((b) => assignedBranchSubIds.includes(Number(b.id)))
      .map((b) => ({ value: String(b.id), label: b.name }));
  }, [branchChoices, myAccessibleBranchSubs, assignedBranchSubIds]);

  // Default the dropdown to the user's home branch on first render so a
  // multi-branch user filing in their own branch doesn't have to pick
  // every time.
  useEffect(() => {
    if (!preselectHomeBranch || !showBranchPicker || watch('branch_sub_id')) return;
    if (homeBranchSubId && branchOptions.some((o) => String(o.value) === homeBranchSubId)) {
      setValue('branch_sub_id', homeBranchSubId as any);
    }
  }, [preselectHomeBranch, showBranchPicker, branchOptions, homeBranchSubId, setValue, watch]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "reference"
  });
    
  // The three reference dropdowns are fetched by the PARENT
  // (src/app/borrowers/[id]/page.tsx) and arrive here as props, so the
  // duplicate fetch that used to sit here was dead weight: it asked for 1,000
  // rows, which the schema's cap now refuses, and the resulting TypeError was
  // swallowed while the props kept the dropdowns populated. Deleted rather
  // than re-capped — re-capping would just have duplicated the parent's call.

  const [optionsChief, setOptionsChief] = useState<SelectOption[]>([]);
  const [optionsArea, setOptionsArea] = useState<SelectOption[]>([]);
  const [optionsSubArea, setOptionsSubArea] = useState<SelectOption[]>([]);
  const [optionsBorrComp, setOptionsBorrComp] = useState<{value: string; label: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [subAreaLoading, setSubAreaLoading] = useState<boolean>(false);

  // Track previous singleData to detect EDIT→CREATE transitions
  const prevSingleDataRef = useRef<BorrowerRowInfo | undefined>(singleData);

  // Sub-area is only optional when an area is selected, loading finished, and no sub-areas exist
  const areaId = watch('area_id');
  const subAreaNotRequired = !!areaId && !subAreaLoading && optionsSubArea.length === 0;

  // Never let a date the operator did not type block the form. See
  // boundsAllowing() in src/constants/dateBounds.ts.
  const dobBounds = boundsAllowing(
    singleData?.borrower_details?.dob,
    MIN_DATE_OF_BIRTH,
    maxDateOfBirth(),
  );

  // Spouse details only apply when the borrower is Married or Live-in.
  // Case-insensitive match so legacy free-text values ("married", "MARRIED")
  // still surface the section in EDIT mode.
  const civilStatus = watch('civil_status');
  const requiresSpouse = ['married', 'live-in'].includes(
    String(civilStatus ?? '').trim().toLowerCase()
  );

  // The 9 spouse fields cleared on switch-back. Listed once so adding a new
  // spouse field doesn't require updating two places.
  const SPOUSE_FIELDS = [
    'work_address',
    'occupation',
    'fullname',
    'company',
    'dept_branch',
    'length_of_service',
    'salary',
    'company_contact_person',
    'spouse_contact_no',
  ] as const;

  // Clear any previously entered spouse values when the user flips civil status
  // to a non-spouse state, so stale data isn't silently submitted to the backend.
  useEffect(() => {
    if (!requiresSpouse) {
      SPOUSE_FIELDS.forEach((field) => setValue(field as any, ''));
    }
  }, [requiresSpouse, setValue]);

  const handleOnChangeArea = (selectedOption: SelectOption | null) => {
    setSubAreaLoading(true);
    setValue('sub_area_id', '');
    setOptionsSubArea([]);
    if (selectedOption) {
      fetchDataSubArea(Number(selectedOption.value));
    }
  }

  useEffect(() => {
    if (dataSubArea && Array.isArray(dataSubArea)) {
      const dynaOpt: SelectOption[] = dataSubArea?.map(aSub => ({
        value: String(aSub.id),
        label: aSub.name,
      }));
      setOptionsSubArea(dynaOpt);
      setSubAreaLoading(false);
    }
  }, [dataSubArea])

  // A starting area comes with its sub-areas, as picking it would. Once, on mount:
  // the form reads its starting values once.
  useEffect(() => {
    if (!initialValues?.area_id) return;
    setSubAreaLoading(true);
    fetchDataSubArea(Number(initialValues.area_id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchDataSubArea is a new function on every render
  }, []);

  const onSubmit = async (data: BorrowerInfo) => {
    data.age = parseInt(data.age as unknown as string, 10); // Ensure age is a number

    const result = await onSubmitBorrower(data) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result && result.success) {
      setShowForm(false);
    }
    // Form stays open on errors for user to fix and retry
  }

  // Manual "Check Borrower" — advisory duplicate + cross-branch + problem-account
  // check the encoder can run after entering just the identity fields, before
  // completing the rest of the form. Never blocks or saves.
  const [checking, setChecking] = useState(false);
  const handleCheckBorrower = async () => {
    setChecking(true);
    try {
      await checkBorrowerNow({
        firstname: watch('firstname'),
        middlename: watch('middlename'),
        lastname: watch('lastname'),
        contact_no: watch('contact_no'),
        email: watch('email'),
        dob: watch('dob'),
        id: singleData?.id,
        branch_sub_id: watch('branch_sub_id' as any),
      } as any);
    } finally {
      setChecking(false);
    }
  };

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
      const dynaOpt: SelectOption[] = dataChief?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name,
      }));
      setOptionsChief(dynaOpt);
    }
  }, [dataChief])

  
  useEffect(() => {
    if (dataArea && Array.isArray(dataArea)) {
      const dynaOpt: SelectOption[] = dataArea?.map(aSub => ({
        value: String(aSub.id),
        label: aSub.name,
      }));
      setOptionsArea(dynaOpt);

      if (singleData && optionsArea) {
        const subArea = dataArea?.find(item => item.id === String(singleData.borrower_work_background.area_id));
        if (subArea && Array.isArray(subArea?.sub_area)) {
          const dynaOptSub: SelectOption[] = subArea?.sub_area?.map(sSub => ({
            value: String(sSub.id),
            label: sSub.name,
          }));
          setOptionsSubArea(dynaOptSub);
          setValue('sub_area_id', singleData.borrower_work_background.sub_area_id);
        }
      }
    }
  }, [dataArea])

  useEffect(() => {
    // Track previous value to detect EDIT→CREATE transitions
    const prevSingleData = prevSingleDataRef.current;
    prevSingleDataRef.current = singleData;

    if (dataBorrCompany && Array.isArray(dataBorrCompany)) {
      const dynaOpt = dataBorrCompany.map(aSub => ({
        value: String(aSub.id),
        label: aSub.name,
      }));
      setOptionsBorrComp(dynaOpt);
    }
    if (singleData) {
      // Assuming singleData has the structure matching BorrowerInfo
      Object.keys(singleData).forEach((key) => {
        if (key === "borrower_reference") {
          singleData.borrower_reference.forEach((ref, index) => {
            setValue(`reference.${index}.occupation`, ref.occupation);
            setValue(`reference.${index}.name`, ref.name);
            setValue(`reference.${index}.contact_no`, ref.contact_no);
          });
        } else {
          setValue('id', singleData.id);
          setValue('chief_id', singleData.chief_id);
          setValue('amount_applied', Number(singleData.amount_applied));
          setValue('purpose', singleData.purpose);
          setValue('firstname', singleData.firstname);
          setValue('middlename', singleData.middlename);
          setValue('lastname', singleData.lastname);
          setValue('terms_of_payment', singleData.terms_of_payment);
          setValue('residence_address', singleData.residence_address);
          // GraphQL sends is_rent as a Boolean although the type says string; comparing it to
          // '0' opened every borrower as Rent. Read true/1/'1' as Rent, anything else as Own.
          const rent = String(singleData.is_rent);
          setValue('is_rent', rent === 'true' || rent === '1' ? 1 : 0);
          setValue('other_source_of_inc', singleData.other_source_of_inc);
          setValue('est_monthly_fam_inc', singleData.est_monthly_fam_inc);
          setValue('employment_position', singleData.employment_position);
          setValue('gender', singleData.gender);
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
    } else if (prevSingleData && !singleData) {
      // Only reset when transitioning from EDIT mode (had data) to CREATE mode (now undefined)
      // This prevents clearing the form after successful CREATE submission
      reset({
        firstname: '',
      });
    }
  }, [dataBorrCompany, singleData])
  
  return (
      <div className="max-w-full lg:max-w-7xl mx-auto px-2 sm:px-4 lg:px-0">
      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Profile Photo - Centered at top */}
        {variant !== 'application' && (
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
        )}

        {/* Form Containers - All full width and aligned */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Identity block first: name + contact + email, then the Check
              button — so an encoder can verify a borrower (own-branch duplicate,
              cross-branch match, problem account) before filling everything. */}
          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  {(singleData?.id || variant === 'application') ? 'Name & Contact' : 'Check for Existing Borrower'}
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5.5 p-4 sm:p-6.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div>
                    <FormInput
                      label="Firstname"
                      id="firstname"
                      type="text"
                      icon={Home}
                      register={register('firstname', { required: req('firstname') })}
                      error={errors.firstname && "This field is required"}
                      required={req('firstname')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Middlename"
                      id="middlename"
                      type="text"
                      icon={Home}
                      register={register('middlename')}
                      error={errors.middlename?.message}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Lastname"
                      id="lastname"
                      type="text"
                      icon={Home}
                      register={register('lastname', { required: req('lastname') })}
                      error={errors.lastname && "This field is required"}
                      required={req('lastname')}
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
                      register={register('contact_no', { required: req('contact_no') })}
                      error={errors.contact_no && "This field is required"}
                      formatType="contact"
                      required={req('contact_no')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Email"
                      id="email"
                      type="text"
                      icon={Home}
                      register={register('email', { required: req('email') })}
                      error={errors.email?.message}
                      required={req('email')}
                    />
                  </div>
                </div>
                {!singleData?.id && variant !== 'application' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCheckBorrower}
                      disabled={checking}
                      className="flex items-center justify-center gap-2 rounded bg-primary px-5 py-2 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {checking
                        ? <RotateCw size={16} className="animate-spin" />
                        : <Search size={16} />}
                      <span>{checking ? 'Checking…' : 'Check Borrower'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-sm border m-2 sm:m-3 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="bg-black border-b border-stroke px-4 py-3 sm:px-6.5 sm:py-4 dark:border-strokedark">
                <h3 className="font-medium text-base lg:text-lg text-whiter dark:text-white">
                  Borrower Information
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5.5 p-4 sm:p-6.5">
                {renderExtraFields?.({ control, register, errors })}
                {showBranchPicker && (
                  <div data-testid="borrower-branch-picker">
                    {/* The application variant marks it required. Both variants name the control "Branch"
                        (neither FormLabel nor ReactSelect takes an id to pair them). */}
                    <FormLabel title="Branch" required={variant === 'application' && req('branch_sub_id')} />
                    <Controller
                      name={"branch_sub_id" as any}
                      control={control}
                      rules={{ required: req('branch_sub_id') ? 'Branch is required' : false }}
                      render={({ field }) => (
                        <ReactSelect
                          {...field}
                          options={branchOptions}
                          placeholder={variant === 'application' ? 'Select the branch for this application...' : 'Select the branch this borrower belongs to...'}
                          onChange={(selectedOption: any) => field.onChange(selectedOption?.value)}
                          value={branchOptions.find((o) => String(o.value) === String(field.value)) || null}
                          isLoading={loadingMyAccessibleBranches}
                          loadingMessage={() => "Loading accessible branches..."}
                          aria-label="Branch"
                        />
                      )}
                    />
                    {(errors as any).branch_sub_id && (
                      <p className="mt-2 text-sm text-danger">
                        {String((errors as any).branch_sub_id?.message ?? 'Branch is required')}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    {/* value={watch(...)} IS REQUIRED on a formatted FormInput, not optional.
                    FormInput renders formatType="number"/"currency" fields as CONTROLLED on its
                    own displayValue (FormInput/index.tsx:338), and displayValue is only ever
                    seeded from the value/defaultValue props. So setValue() writes
                    react-hook-form state, RHF pushes it to the DOM through its ref, and React
                    immediately overwrites it with an empty displayValue. The field then shows
                    its 0.00 placeholder on every EDIT while the real figure sits in form state
                    — which is why saving preserved the value even though the box looked empty.
                    FormLoanComputation.tsx already does this correctly; these six never did. */}
                    <FormInput
                      label="Amount Applied For"
                      id="amount_applied"
                      type="text"
                      icon={Home}
                      placeholder="0.00"
                      value={watch('amount_applied') ? String(watch('amount_applied')) : ''}
                      register={register('amount_applied', { required: req('amount_applied') })}
                      error={errors.amount_applied && "This field is required"}
                      defaultValue=""
                      formatType="number"
                      required={req('amount_applied')}
                      fallbackValue={0}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Purpose"
                      id="purpose"
                      type="text"
                      icon={Home}
                      register={register('purpose', { required: req('purpose') })}
                      error={errors.purpose && "This field is required"}
                      required={req('purpose')}
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
                      register={register('terms_of_payment', { required: req('terms_of_payment') })}
                      error={errors.terms_of_payment && "This field is required"}
                      required={req('terms_of_payment')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Other Source of Income"
                      id="residence_address"
                      type="text"
                      icon={Home}
                      register={register('other_source_of_inc', { required: req('other_source_of_inc') })}
                      error={errors.other_source_of_inc && "This field is required"}
                      required={req('other_source_of_inc')}
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
                      register={register('residence_address', { required: req('residence_address') })}
                      error={errors.residence_address && "This field is required"}
                      required={req('residence_address')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Type of Residency"
                      id="is_rent"
                      type="select"
                      icon={Home}
                      register={register('is_rent', { required: req('is_rent') ? 'Type of Residency is required' : false })}
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
                      value={watch('est_monthly_fam_inc') ? String(watch('est_monthly_fam_inc')) : ''}
                      register={register('est_monthly_fam_inc', { required: req('est_monthly_fam_inc') })}
                      error={errors.est_monthly_fam_inc && "This field is required"}
                      formatType="number"
                      required={req('est_monthly_fam_inc')}
                      defaultValue=""
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Employment Position"
                      id="employment_position"
                      type="text"
                      icon={Home}
                      register={register('employment_position', { required: req('employment_position') })}
                      error={errors.employment_position && "This field is required"}
                      required={req('employment_position')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="chief_id">
                      Chief
                      {req('chief_id') && <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>}
                    </label>
                    <Controller
                      name="chief_id"
                      control={control}
                      rules={{ required: req('chief_id') ? 'Chief is required' : false }}
                      render={({ field }) => (
                        <ReactSelect
                          options={optionsChief}
                          placeholder="Select a Chief..." aria-label="Chief"
                          isLoading={!dataChief}
                          loadingMessage={() => 'Loading chiefs...'}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption ? Number(selectedOption.value) : 0);
                          }}
                          value={optionsChief.find(opt => String(opt.value) === String(field.value)) || null}
                        />
                      )}
                    />
                    {errors.chief_id?.message && (
                      <p className="mt-2 text-sm font-medium" style={{ color: '#DC2626' }}>{errors.chief_id.message}</p>
                    )}
                  </div>
                  <div>
                    <FormInput
                      label="Gender"
                      id="gender"
                      type="select"
                      icon={Home}
                      register={register('gender', { required: req('gender') ? 'Gender is required' : false })}
                      error={errors.gender?.message}
                      options={[
                        { value: '', label: 'Select Gender', hidden: true },
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                      ]}
                      required={req('gender')}
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
                      // Upper bound is TODAY: nobody is born in the future. 124 borrower_details
                      // rows already carry truncated years, 18 of them dated 2026 (infants).
                      // Deliberately NOT a minimum lending age — that is a business rule nobody
                      // has stated, and guessing it would silently reject real borrowers.
                      //
                      // Widened to admit whatever this record already holds. A native bound
                      // blocks the WHOLE FORM, not the field, so bounding a prefilled value
                      // made 95 of 4,516 existing borrowers unsaveable: changing only a phone
                      // number raised a native bubble on a birthdate nobody touched, with no
                      // request sent and no message rendered.
                      min={dobBounds.min}
                      max={dobBounds.max}
                      register={register('dob', { required: req('dob') })}
                      error={errors.dob && "This field is required"}
                      required={req('dob')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Place of birth"
                      id="place_of_birth"
                      type="text"
                      icon={Home}
                      register={register('place_of_birth', { required: req('place_of_birth') })}
                      error={errors.place_of_birth && "This field is required"}
                      required={req('place_of_birth')}
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
                      register={register('age', { required: req('age') })}
                      error={errors.age && "This field is required"}
                      required={req('age')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Civil Status"
                      id="civil_status"
                      type="select"
                      icon={Home}
                      register={register('civil_status', { required: req('civil_status') ? 'Civil Status is required' : false })}
                      error={errors.civil_status?.message}
                      options={[
                        { value: '', label: 'Select Civil Status', hidden: true },
                        { value: 'Single', label: 'Single' },
                        { value: 'Married', label: 'Married' },
                        { value: 'Live-in', label: 'Live-in' },
                        { value: 'Widowed', label: 'Widowed' },
                        { value: 'Separated', label: 'Separated' },
                      ]}
                      required={req('civil_status')}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
          {requiresSpouse && (
          <div className="w-full">
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
                    register={register('work_address', { required: requiresSpouse && req('work_address') })}
                    error={errors.work_address && "This field is required"}
                    required={requiresSpouse && req('work_address')}
                  />
                </div>
                <div>
                  <FormInput
                    label="Occupation"
                    id="occupation"
                    type="text"
                    icon={Home}
                    register={register('occupation', { required: requiresSpouse && req('occupation') })}
                    error={errors.occupation && "This field is required"}
                    required={requiresSpouse && req('occupation')}
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
                    register={register('fullname', { required: requiresSpouse && req('fullname') })}
                    error={errors.fullname && "This field is required"}
                    required={requiresSpouse && req('fullname')}
                  />
                </div>
                <div>
                  <FormInput
                    label="Company"
                    id="company"
                    type="text"
                    icon={Home}
                    register={register('company', { required: requiresSpouse && req('company') })}
                    error={errors.company && "This field is required"}
                    required={requiresSpouse && req('company')}
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
                    register={register('dept_branch', { required: requiresSpouse && req('dept_branch') })}
                    error={errors.dept_branch && "This field is required"}
                    required={requiresSpouse && req('dept_branch')}
                  />
                </div>
                <div>
                  <FormInput
                    label="Length of Service"
                    id="length_of_service"
                    type="text"
                    icon={Home}
                    register={register('length_of_service', { required: requiresSpouse && req('length_of_service') })}
                    error={errors.length_of_service && "This field is required"}
                    required={requiresSpouse && req('length_of_service')}
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
                    value={watch('salary') ? String(watch('salary')) : ''}
                    register={register('salary', { required: requiresSpouse && req('salary') })}
                    error={errors.salary && "This field is required"}
                    formatType="number"
                    required={requiresSpouse && req('salary')}
                    defaultValue=""
                  />
                </div>
                <div>
                  <FormInput
                    label="Company Contact Person"
                    id="company_contact_person"
                    type="text"
                    icon={Home}
                    register={register('company_contact_person', { required: requiresSpouse && req('company_contact_person') })}
                    error={errors.company_contact_person && "This field is required"}
                    required={requiresSpouse && req('company_contact_person')}
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
                    register={register('spouse_contact_no', { required: requiresSpouse && req('spouse_contact_no') })}
                    error={errors.spouse_contact_no && "This field is required"}
                    formatType="contact"
                    required={requiresSpouse && req('spouse_contact_no')}
                    defaultValue="N/A"
                  />
                </div>
                <div>
                </div>
              </div>

              </div>
            </div>
          </div>
          )}
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
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="company_borrower_id">
                        Office Where Currently Employed
                        {req('company_borrower_id') && <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>}
                      </label>
                      <Controller
                        name="company_borrower_id"
                        control={control}
                        rules={{ required: req('company_borrower_id') ? 'Office is required' : false }}
                        render={({ field }) => (
                          <ReactSelect
                            {...field}
                            options={optionsBorrComp}
                            placeholder="Select a Company..." aria-label="Office Where Currently Employed"
                            isLoading={!dataBorrCompany}
                            loadingMessage={() => 'Loading companies...'}
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption ? Number(selectedOption.value) : null);
                            }}
                            value={optionsBorrComp.find(option => String(option.value) === String(field.value)) || null}
                          />
                        )}
                      />
                      {errors.company_borrower_id?.message && (
                        <p className="mt-2 text-sm font-medium" style={{ color: '#DC2626' }}>{errors.company_borrower_id.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <FormInput
                      label="Employee Number"
                      id="employment_number"
                      type="text"
                      icon={Home}
                      register={register('employment_number', { required: req('employment_number') })}
                      error={errors.employment_number && "This field is required"}
                      required={req('employment_number')}
                    />
                  </div>
                </div>                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="area_id">
                      Area
                      {req('area_id') && <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>}
                    </label>
                    <Controller
                      name="area_id"
                      control={control}
                      rules={{ required: req('area_id') ? 'Area is required' : false }}
                      render={({ field }) => (
                        <ReactSelect
                          options={optionsArea}
                          placeholder="Select an Area..." aria-label="Area"
                          isLoading={!dataArea}
                          loadingMessage={() => 'Loading areas...'}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption ? selectedOption.value : '');
                            handleOnChangeArea(selectedOption);
                          }}
                          value={optionsArea.find(opt => String(opt.value) === String(field.value)) || null}
                        />
                      )}
                    />
                    {errors.area_id?.message && (
                      <p className="mt-2 text-sm font-medium" style={{ color: '#DC2626' }}>{errors.area_id.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="sub_area_id">
                      Sub Area
                      {!subAreaNotRequired && req('sub_area_id') && <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>}
                    </label>
                    <Controller
                      name="sub_area_id"
                      control={control}
                      rules={{ required: !subAreaNotRequired && req('sub_area_id') ? 'Sub Area is required' : false }}
                      render={({ field }) => (
                        <ReactSelect
                          options={optionsSubArea}
                          placeholder="Select a Sub Area..." aria-label="Sub Area"
                          isLoading={subAreaLoading}
                          loadingMessage={() => 'Loading sub areas...'}
                          noOptionsMessage={() => 'No sub-areas for this area'}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption ? selectedOption.value : '');
                          }}
                          value={optionsSubArea.find(opt => String(opt.value) === String(field.value)) || null}
                        />
                      )}
                    />
                    {errors.sub_area_id?.message && (
                      <p className="mt-2 text-sm font-medium" style={{ color: '#DC2626' }}>{errors.sub_area_id.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormInput
                      label="Station"
                      id="station"
                      type="text"
                      icon={Home}
                      register={register('station', { required: req('station') })}
                      error={errors.station && "This field is required"}
                      required={req('station')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Term in service"
                      id="term_in_service"
                      type="text"
                      icon={Home}
                      register={register('term_in_service', { required: req('term_in_service') })}
                      error={errors.term_in_service && "This field is required"}
                      required={req('term_in_service')}
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
                      register={register('employment_status', { required: req('employment_status') ? 'Employee Status is required' : false })}
                      error={errors.employment_status?.message}
                      options={[
                        { value: '', label: 'Select Area', hidden: true },
                        { value: 'Contractual', label: 'Contractual' },
                        { value: 'Permanent', label: 'Permanent' },
                        { value: 'Agency', label: 'Agency' },
                      ]}
                      required={req('employment_status')}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Division"
                      id="division"
                      type="text"
                      icon={Home}
                      register={register('division', { required: req('division') })}
                      error={errors.division && "This field is required"}
                      required={req('division')}
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
                      value={watch('monthly_gross') ? String(watch('monthly_gross')) : ''}
                      register={register('monthly_gross', { required: req('monthly_gross') })}
                      error={errors.monthly_gross && "This field is required"}
                      formatType="number"
                      defaultValue=""
                      required={req('monthly_gross')}
                      fallbackValue={0}
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Monthly Net Salary"
                      id="monthly_net"
                      type="text"
                      icon={Home}
                      value={watch('monthly_net') ? String(watch('monthly_net')) : ''}
                      register={register('monthly_net', { required: req('monthly_net') })}
                      error={errors.monthly_net && "This field is required"}
                      formatType="number"
                      defaultValue=""
                      required={req('monthly_net')}
                      fallbackValue={0}
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
                      register={register('office_address', { required: req('office_address') })}
                      error={errors.office_address && "This field is required"}
                      required={req('office_address')}
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
                          register={register(`reference.${index}.occupation`, { required: req('reference') })}
                          error={errors.reference?.[index]?.occupation && "This field is required"}
                          required={req('reference')}
                        />
                      </div>
                      <div>
                        <FormInput
                          label="Fullname"
                          id={`reference.${index}.name`}
                          type="text"
                          icon={Home}
                          register={register(`reference.${index}.name`, { required: req('reference') })}
                          error={errors.reference?.[index]?.name && "This field is required"}
                          required={req('reference')}
                        />
                      </div>
                      <div>
                        <FormInput
                          label="Contact"
                          id={`reference.${index}.contact_no`}
                          type="text"
                          icon={Home}
                          register={register(`reference.${index}.contact_no`, { required: req('reference') })}
                          error={errors.reference?.[index]?.contact_no && "This field is required"}
                          formatType="contact"
                          required={req('reference')}
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
                    register={register('employer', { required: req('employer') })}
                    error={errors.employer && "This field is required"}
                    required={req('employer')}
                  />
                </div>
                <div>
                  <FormInput
                    label="Salary"
                    id="salary"
                    type="text"
                    icon={Home}
                    value={watch('company_salary') ? String(watch('company_salary')) : ''}
                    register={register('company_salary', { required: req('company_salary') })}
                    error={errors.salary && "This field is required"}
                    formatType="number"
                    defaultValue=""
                    required={req('company_salary')}
                    fallbackValue={0}
                  />
                </div>
                <div>
                  <FormInput
                    label="Contract Duration"
                    id="contract_duration"
                    type="text"
                    icon={Home}
                    register={register('contract_duration', { required: req('contract_duration') })}
                    error={errors.contract_duration && "This field is required"}
                    required={req('contract_duration')}
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
