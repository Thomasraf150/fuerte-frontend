import React, { FocusEvent, useState, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { AlertCircle, Icon } from 'react-feather';
import PesoSign from '@/components/PesoSign';

interface Option {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

interface FormInputProps {
  label: string;
  id: string;
  type: 'text' | 'password' | 'email' | 'select' | 'checkbox' | 'file' | 'date';
  /**
   * No longer drawn (UI modernisation B, 2026-10-07): every field showed the same decorative icon
   * (a house on a name field), which guidance says adds noise without meaning. Kept optional so
   * the ~50 callers need no change. A money field (formatType="currency") shows "₱" as text instead.
   */
  icon?: Icon;
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
  /**
   * Forwarded to the native input. For type="date" these are a real gate:
   * the browser refuses to submit an out-of-range value BEFORE any network
   * call, which is the only thing that stops a native date input's
   * zero-padded partial year (0026-01-15) from ever leaving the page.
   * Deliberately NOT defaulted — a posting date and a date of birth do not
   * share bounds. See src/constants/dateBounds.ts.
   */
  min?: string;
  max?: string;
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

  // No decimal point - just format with commas, NO automatic .00
  const number = parseFloat(cleanValue);
  if (isNaN(number)) return cleanValue;
  return number.toLocaleString('en-US');
};

// Currency formatting on blur - adds .00 when field loses focus
const formatCurrencyOnBlur = (value: string): string => {
  if (!value) return '';
  // Remove all non-digits except decimal point and negative sign
  const cleanValue = value.replace(/[^\d.-]/g, '');
  const number = parseFloat(cleanValue);
  if (isNaN(number)) return '';
  // Display with commas and exactly 2 decimal places
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const unformatCurrency = (value: string): string => {
  if (!value) return '';
  // Remove commas and return raw number string
  const cleanValue = value.replace(/,/g, '');

  // Don't force decimal places during typing/editing
  // The .00 will be added by formatCurrencyOnBlur when field loses focus
  const number = parseFloat(cleanValue);
  if (isNaN(number)) return '';

  // Preserve decimal input if user typed it
  if (cleanValue.includes('.')) {
    // Limit to 2 decimal places if decimals exist
    const parts = cleanValue.split('.');
    const decPart = (parts[1] ?? '').substring(0, 2);
    return `${parts[0]}.${decPart}`;
  }

  // No decimals - return clean integer value (no .00)
  return cleanValue;
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  id,
  type,
  icon,
  register,
  maxLength,
  min,
  max,
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

  // react-hook-form finds the field by event.target.name. The formatted branches below build
  // their event by spreading the input, which copies none of its prototype getters (name,
  // type), so the form ignored every keystroke; a number field caught up only on blur, and
  // Enter posted the value from before. The form gets the typed value, unformatted, with the
  // field's name. Not the fallback: an emptied field must stay empty, so `required` stops it.
  // The form gets exactly what the field shows, without the thousands commas:
  // never a character the display dropped. A stray "m" typed before Enter
  // would otherwise post "20000m", and payment posting reads that as 0.
  const updateForm = (shown: string) => {
    if (register) register.onChange({ target: { name: register.name, value: shown.replace(/,/g, '') }, type: 'change' });
  };

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
      updateForm(formatted);

      // Synthetic event with the final value (fallback applied) for the caller's onChange
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: finalValue
        }
      };

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
      updateForm(formatted);

      // Synthetic event with the final value (fallback applied) for the caller's onChange
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: finalValue
        }
      };

      if (onChange) {
        onChange(syntheticEvent as any);
      }
    } else {
      // No formatting for contact fields or other types
      setDisplayValue(inputValue);
      setRawValue(inputValue);

      // Call React Hook Form's onChange for proper tracking
      if (register?.onChange) {
        register.onChange(event);
      }

      if (onChange) {
        onChange(event);
      }
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    // Apply final formatting when field loses focus
    if (formatType === 'currency' && type === 'text') {
      const inputValue = event.target.value;
      const formatted = formatCurrencyOnBlur(inputValue);
      const raw = unformatCurrency(inputValue);

      // Apply fallback value if raw is empty and fallback is defined
      const finalValue = (raw === '' || raw === null || raw === undefined) && fallbackValue !== undefined
        ? String(fallbackValue)
        : raw;

      setDisplayValue(formatted);
      setRawValue(finalValue);

      // Create synthetic event with final value for form registration
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: finalValue
        }
      };

      // Call React Hook Form's onBlur for validation
      if (register?.onBlur) {
        register.onBlur(syntheticEvent as any);
      }
    } else if (register?.onBlur) {
      // For non-currency fields, just call the registered onBlur
      register.onBlur(event);
    }
  };
  // UI modernisation B (2026-10-07): one field style everywhere. Borders reach 3:1 (WCAG 1.4.11),
  // focus shows a ring (2.4.7), and the error is text linked to its field (3.3.1).
  const errorId = error ? `${id}-error` : undefined;
  // A money field: currency formatting, or the peso icon its caller used to draw.
  const isMoney = type === 'text' && (formatType === 'currency' || icon === PesoSign);
  const fieldClass = `w-full rounded-lg border bg-white text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-whiter dark:bg-form-input dark:text-white dark:placeholder:text-bodydark dark:focus:border-primary ${error ? 'border-danger' : 'border-field dark:border-field-dark'}`;
  return (
    <div className={`${type === 'checkbox' ? 'flex items-center' : ''} ${className}`}>
      <label
        className={`mb-1.5 block text-sm font-semibold text-black dark:text-white ${type === 'checkbox' ? 'mr-2' : ''}`}
        htmlFor={id}
      >
        {label}
        {required && <span className="ml-1 font-bold text-danger" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {type === 'checkbox' ? (
          <input
            className="h-5 w-5 rounded border-field text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark"
            type={type}
            id={id}
            {...register}
          />
        ) : type === 'select' ? (
          <select
            className={`${fieldClass} h-12 md:h-11 px-4 ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
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
            className={`${fieldClass} ${type === 'file' ? 'py-2' : 'mb-0'} h-12 md:h-11 ${isMoney ? 'pl-9 pr-4' : 'px-4'}`}
            type={type}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            placeholder={placeholder}
            disabled={disabled}
            {...(formatType === 'number' || formatType === 'currency' ? {} : { defaultValue })}
            {...register}
            onChange={handleChange}
            onBlur={handleBlur}
            readOnly={readOnly}
            value={formatType === 'number' || formatType === 'currency' ? displayValue : value}
            maxLength={maxLength}
            min={min}
            max={max}
          />
        )}
        {isMoney && (
          // The peso sign means something here, unlike the old decorative icons, so it stays as text.
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-body dark:text-bodydark" aria-hidden="true">₱</span>
        )}
        {error && (
          <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormInput;