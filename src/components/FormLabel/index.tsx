import React from 'react';

interface FormLabelProps {
  title: string;
  required?: boolean;
}

const FormLabel: React.FC<FormLabelProps> = ({ title, required = false }) => {
  return (
    <label className="mb-3 block text-sm font-medium text-slate-600 dark:text-white lbl-form">
      {title}
      {required && <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>}
    </label>
  );
};

export default FormLabel;