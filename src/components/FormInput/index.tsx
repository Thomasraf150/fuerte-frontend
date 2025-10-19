import React, { FocusEvent, useState, useEffect } from 'react';
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
  maxLength?: number;
  formatType?: 'number' | 'contact' | 'currency' | 'none';
  required?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  fallbackValue?: string | number; // NEW: Value to use when field is empty (for database defaults)
}

// Native number formatting utilities
const formatNumber = (value: string): string => {
  if (!value) return '';
  // Remove all non-digits except decimal point and negative sign
  const cleanValue = value.replace(/[^\d.-]/g, '');

  // Preserve decimal points during input
  if (cleanValue.includes('.')) {
    const parts = cleanValue.split('.');
    const intPart = parts[0] || '0';
    const decPart = parts[1] ?? '';

    
    const formattedInt = intPart ? parseInt(intPart).toLocaleString('en-US') : '0';
    return `${formattedInt}.${decPart}`;
  }

  // No decimal - format as whole number
  const number = parseFloat(cleanValue);
  if (isNaN(number)) return cleanValue;
  return number.toLocaleString('en-US');
};

const unformatNumber = (value: string): string => {
  if (!value) return '';
  // Remove commas and return raw number string
  return value.replace(/,/g, '');
};

// Currency formatting utilities
const formatCurrency = (value: string): string => {
  if (!value) return '';
  // Remove all non-digits except decimal point and negative sign
  const cleanValue = value.replace(/[^\d.-]/g, '');
  if (cleanValue.includes('.')) {
    const parts = cleanValue.split('.');
    const intPart = parts[0] || '0';
    const decPart = (parts[1] ?? '').substring(0, 2); // Limit to 2 decimals

    // Format integer with commas, preserve decimals
    const formattedInt = intPart ? parseInt(intPart).toLocaleString('en-US') : '0';
    return `${formattedInt}.${decPart}`;
  }

  const number = parseFloat(cleanValue);
  if (isNaN(number)) return cleanValue;
  // Display with commas and exactly 2 decimal places
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const unformatCurrency = (value: string): string => {
  if (!value) return '';
  // Remove commas and return decimal string with 2 decimal places
  const cleanValue = value.replace(/,/g, '');
  const number = parseFloat(cleanValue);
  if (isNaN(number)) return '';
  return number.toFixed(2); // Always 2 decimal places
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  id,
  type,
  icon: IconComponent,
  register,
  maxLength,
  error,
  options,
  placeholder,
  disabled,
  defaultValue,
  onChange,
  className,
  readOnly,
  value,
  formatType = 'none',
  required = false,
  isLoading = false,
  loadingMessage = 'Loading...',
  fallbackValue
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [rawValue, setRawValue] = useState<string>('');

  // Initialize display value
  useEffect(() => {
    const initialValue = value || defaultValue || '';
    if (formatType === 'number' && initialValue) {
      setDisplayValue(formatNumber(initialValue));
      setRawValue(unformatNumber(initialValue));
    } else if (formatType === 'currency' && initialValue) {
      setDisplayValue(formatCurrency(initialValue));
      setRawValue(unformatCurrency(initialValue));
    } else {
      setDisplayValue(initialValue);
      setRawValue(initialValue);
    }
  }, [value, defaultValue, formatType]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const inputValue = event.target.value;

    if (formatType === 'number' && type === 'text') {
      // Format for display, store raw value
      const formatted = formatNumber(inputValue);
      const raw = unformatNumber(inputValue);

      // Apply fallback value if raw is empty and fallback is defined
      const finalValue = (raw === '' || raw === null || raw === undefined) && fallbackValue !== undefined
        ? String(fallbackValue)
        : raw;

      setDisplayValue(formatted);
      setRawValue(finalValue);

      // Create synthetic event with final value (with fallback applied) for form registration
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: finalValue
        }
      };

      if (register?.onChange) {
        register.onChange(syntheticEvent as any);
      }
      if (onChange) {
        onChange(syntheticEvent as any);
      }
    } else if (formatType === 'currency' && type === 'text') {
      // Format for display with currency precision, store decimal value
      const formatted = formatCurrency(inputValue);
      const raw = unformatCurrency(inputValue);

      // Apply fallback value if raw is empty and fallback is defined
      const finalValue = (raw === '' || raw === null || raw === undefined) && fallbackValue !== undefined
        ? String(fallbackValue)
        : raw;

      setDisplayValue(formatted);
      setRawValue(finalValue);

      // Create synthetic event with final value (with fallback applied) for form registration
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: finalValue
        }
      };

      if (register?.onChange) {
        register.onChange(syntheticEvent as any);
      }
      if (onChange) {
        onChange(syntheticEvent as any);
      }
    } else {
      // No formatting for contact fields or other types
      setDisplayValue(inputValue);
      setRawValue(inputValue);

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
        {required && <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>}
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
            className={`h-11 text-sm w-full border border-stroke py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
            id={id}
            {...register}
            onChange={(e) => {
              // Call React Hook Form's onChange first for validation
              if (register?.onChange) {
                register.onChange(e);
              }
              // Then call custom onChange if provided
              if (onChange) {
                onChange(e);
              }
            }}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <option value="" disabled selected>
                {loadingMessage}
              </option>
            ) : (
              options && options.map(option => (
                <option key={option.value} value={option.value} hidden={option.hidden}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        ) : (
          <input
            className={`w-full ${type === 'file' ? '' : 'mb-0'} h-10 text-sm border border-stroke py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary`}
            type={type}
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            {...(formatType === 'number' || formatType === 'currency' ? {} : { defaultValue })}
            {...register}
            onChange={handleChange}
            readOnly={readOnly}
            value={formatType === 'number' || formatType === 'currency' ? displayValue : value}
            maxLength={maxLength}
          />
        )}
        {type !== 'checkbox' && type !== 'file' && (
          <span className={`absolute top-3 ${type === 'select' ? 'right-4.5' : 'left-4.5'}`}>
            <IconComponent size="18" />
          </span>
        )}
        {error && <p className="mt-2 text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>}
      </div>
    </div>
  );
};

export default FormInput;