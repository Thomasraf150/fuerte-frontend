import React, { FocusEvent, useState, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Icon } from 'react-feather';
import { handleNumberInputChange } from '@/utils/numberFormatting';

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
  maxLength?: number;
  enableNumberFormatting?: boolean;
  onValueChange?: (rawValue: string, displayValue: string) => void;
}

const FormInput: React.FC<FormInputProps> = ({ label, id, type, icon: IconComponent, register, maxLength, error, options, placeholder, disabled, defaultValue, onChange, className, readOnly, value, enableNumberFormatting = false, onValueChange }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isNumberFormatted, setIsNumberFormatted] = useState(false);

  // Initialize display value for number formatting
  useEffect(() => {
    if (enableNumberFormatting && type === 'text') {
      setIsNumberFormatted(true);
      if (defaultValue || value) {
        const initialValue = value || defaultValue || '';
        const { display } = handleNumberInputChange(initialValue);
        setDisplayValue(display);
      }
    }
  }, [enableNumberFormatting, type, defaultValue, value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    if (enableNumberFormatting && type === 'text' && 'value' in event.target) {
      const inputValue = event.target.value;
      const { display, raw } = handleNumberInputChange(inputValue);
      
      setDisplayValue(display);
      
      // Update the form value with raw number
      if (register?.onChange) {
        const syntheticEvent = {
          ...event,
          target: {
            ...event.target,
            value: raw,
            name: event.target.name || id
          }
        };
        register.onChange(syntheticEvent);
      }
      
      // Call custom onChange if provided
      if (onValueChange) {
        onValueChange(raw, display);
      }
      
      // Call standard onChange if provided
      if (onChange) {
        const modifiedEvent = {
          ...event,
          target: {
            ...event.target,
            value: raw
          }
        };
        onChange(modifiedEvent as React.ChangeEvent<HTMLInputElement>);
      }
    } else {
      // Standard handling for non-number inputs
      if (onChange) {
        onChange(event);
      }
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
            defaultValue={isNumberFormatted ? undefined : defaultValue}
            {...(isNumberFormatted ? { name: register?.name } : register)}
            onChange={handleChange}
            readOnly={readOnly}
            value={isNumberFormatted ? displayValue : value}
            maxLength={maxLength}
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