"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';
import useUsers from '@/hooks/useUsers';
import { DataBranches, DataFormUser, User, DataRowLoanProducts } from '@/utils/DataTypes';

interface ParentFormBr {
  // setShowForm: (value: boolean) => void;
  // fetchUsers: (first: number, page: number) => void;
  // actionLbl: string;
  // singleUserData: DataFormUser | undefined;
}
interface OptionBranch {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}
const FormAddLoanProduct: React.FC<ParentFormBr> = ({ }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<DataRowLoanProducts>();
  // const { onSubmitUser, dataSubBranch } = useUsers();
  const [options, setOptions] = useState<OptionBranch[]>([
    { value: '', label: 'Select a branch', hidden: true },
  ]);

   // Watch the password field
  //  const password = watch('password', '');

  const onSubmit: SubmitHandler<DataRowLoanProducts> = data => {
    // onSubmitUser(data);
    // setShowForm(false);
    console.log(data, ' data')
    // fetchUsers(10, 1);
  };

  useEffect(() => {
   
  }, [])

  return (


    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        {/* First Column */}
        <div>
          
           <FormInput
            label="Loan Product"
            id="loan_code_id"
            type="select"
            icon={ChevronDown}
            register={register('loan_code_id', { required: 'Branch is required' })}
            error={errors.loan_code_id?.message}
            options={options}
          />
        </div>

        {/* Second Column */}
        <div>
          {/* Add more FormInput components as needed */}
          
          <div className="flex justify-end gap-4.5">
            <button
              className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              type="button"
              onClick={()=>{}}
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
        </div>

        {/* Add more columns if necessary */}

        {/* Submit Button */}
        
      </form>
    </div>


    // <form onSubmit={handleSubmit(onSubmit)}>
     
      // <FormInput
      //   label="Branch"
      //   id="branch_id"
      //   type="select"
      //   icon={ChevronDown}
      //   register={register('branch_sub_id', { required: 'Branch is required' })}
      //   error={errors.branch_sub_id?.message}
      //   options={options}
      // />

    //   <FormInput
    //     label="Email"
    //     id="name"
    //     type="text"
    //     icon={Home}
    //     register={register('email', { required: true })}
    //     error={errors.email && "This field is required"}
    //   />

    //   <FormInput
    //     label="Name"
    //     id="name"
    //     type="text"
    //     icon={Home}
    //     register={register('name', { required: true })}
    //     error={errors.name && "This field is required"}
    //   />

     
      // <div className="flex justify-end gap-4.5">
      //   <button
      //     className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
      //     type="button"
      //     onClick={() => { setShowForm(false) }}
      //   >
      //     Cancel
      //   </button>
      //   <button
      //     className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
      //     type="submit"
      //   >
      //     Save
      //   </button>
      // </div>
    // </form>
  );
};

export default FormAddLoanProduct;