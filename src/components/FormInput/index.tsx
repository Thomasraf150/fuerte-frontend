import React, { FocusEvent } from 'react';
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
  type: 'text' | 'password' | 'email' | 'select' | 'checkbox' | 'file' | 'date';
  icon: Icon;
  register?: UseFormRegisterReturn;
  error?: string;
  options?: Option[];
  placeholder?: string;
  disabled?: boolean;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  readOnly?: boolean;
  value?: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, id, type, icon: IconComponent, register, error, options, placeholder, disabled, defaultValue, onChange, className, readOnly, value }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(event);
    }
  };
  return (
    <div className={`${type === 'checkbox' ? 'flex items-center' : ''} ${className}`}>
      <label
        className={`mb-3 block text-sm font-medium text-black dark:text-white ${type === 'checkbox' ? 'mr-2' : ''}`}
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        {type === 'checkbox' ? (
          <input
            className="h-10 text-sm border border-stroke text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            type={type}
            id={id}
            {...register}
          />
        ) : type === 'select' ? (
          <select
            className="h-11 text-sm w-full border border-stroke py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
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
            className={`w-full ${type === 'file' ? '' : 'mb-0'} h-10 text-sm border border-stroke py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary`}
            type={type}
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            defaultValue={defaultValue}
            {...register}
            onChange={handleChange}
            readOnly={readOnly}
            value={value}
          />
        )}
        {type !== 'checkbox' && type !== 'file' && (
          <span className="absolute left-4.5 top-3">
            <IconComponent size="18" />
          </span>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default FormInput;