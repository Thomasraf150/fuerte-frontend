import React from 'react';

interface FormLabelProps {
  title: string;
  required?: boolean;
  /** The id of the control this labels, when there is one (ties the two for screen readers). */
  htmlFor?: string;
}

/**
 * A field or group label, drawn like FormInput's label (UI modernisation B, 2026-10-07): bold
 * text, no filled bar. The `lbl-form` class stays for any page CSS that targets it.
 */
const FormLabel: React.FC<FormLabelProps> = ({ title, required = false, htmlFor }) => {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-black dark:text-white lbl-form">
      {title}
      {required && <span className="ml-1 font-bold text-danger" aria-hidden="true">*</span>}
    </label>
  );
};

export default FormLabel;
