import React from 'react';

interface FormLabelProps {
  title: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ title }) => {
  return (
    <label className="mb-3 block text-sm font-medium text-slate-600 dark:text-white lbl-form">
      {title}
    </label>
  );
};

export default FormLabel;