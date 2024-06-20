import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Icon } from 'react-feather';

interface Option {
  value: string;
  label: string;
}

interface FormInputProps {
  label: string;
  id: string;
  type: 'text' | 'password' | 'email' | 'select';
  icon: Icon;
  register: UseFormRegisterReturn;
  error?: string;
  options?: Option[]; // Add options prop for select type
}

const FormInput: React.FC<FormInputProps> = ({ label, id, type, icon: IconComponent, register, error, options }) => {
  return (
    <div className="mb-5.5">
      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4.5 top-4">
          <IconComponent size="18" />
        </span>
        {type === 'select' ? (
          <select
            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            id={id}
            {...register}
          >
            {options && options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            type={type}
            id={id}
            {...register}
          />
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default FormInput;