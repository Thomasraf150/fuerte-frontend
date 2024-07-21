import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Icon } from 'react-feather';

interface Option {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

interface FormInputProps {
  label: string;
  id: string;
  type: 'text' | 'password' | 'email' | 'select' | 'checkbox';
  icon: Icon;
  register: UseFormRegisterReturn;
  error?: string;
  options?: Option[];
  placeholder?: string;
  disabled?: boolean;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FormInput: React.FC<FormInputProps> = ({ label, id, type, icon: IconComponent, register, error, options, placeholder, disabled, defaultValue, onChange }) => {
  return (
    <div className={`${type === 'checkbox' ? 'flex items-center' : ''}`}>
      <label
        className={`mb-3 block text-sm font-medium text-black dark:text-white ${type === 'checkbox' ? 'mr-2' : ''}`}
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        {type === 'checkbox' ? (
          <input
            className="rounded-custom-lg border border-stroke bg-gray text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            type={type}
            id={id}
            {...register}
          />
        ) : type === 'select' ? (
          <select
            className="w-full rounded-custom-lg border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            id={id}
            {...register}
            onChange={onChange}
          >
            {options && options.map(option => (
              <option key={option.value} value={option.value} hidden={option.hidden}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="w-full mb-4 rounded-custom-lg border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            type={type}
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            defaultValue={defaultValue}
            {...register}
          />
        )}
        {type !== 'checkbox' && (
          <span className="absolute left-4.5 top-4">
            <IconComponent size="18" />
          </span>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default FormInput;